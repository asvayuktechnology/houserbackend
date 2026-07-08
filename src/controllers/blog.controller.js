import asyncHandler from "../utils/asyncHandler.js";
import { eq, and, or, ilike, desc, count, ne } from "drizzle-orm";
import { db } from "../config/db/index.js";
import { blogs } from "../config/db/schema.js";
import { ApiError } from "../utils/ApiError.js";
import slugify from "slugify";
// ✅ CREATE LEAD
export const createBlog = asyncHandler(async (req, res, next) => {
  const user = req.user;
    let featuredImage =''
      if (req.files?.length) {
      featuredImage = req.files[0].path; 
    }

  if (!user?.id) {
    return next(
      new ApiError(
        "User authentication required",
        401
      )
    );
  }
  if (user.role !== "admin") {
    return next(
      new ApiError(
        "Only admin can create blog",
        403
      )
    );
  }

  const {
    title,
    excerpt,
    content,
    status,
    tags,
    metaTitle,
    metaDescription,
    publishedAt,
  } = req.body;

  // Auto generate slug from title
  let generatedSlug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });

  // Check if slug already exists
  const [existingBlog] = await db
    .select()
    .from(blogs)
    .where(eq(blogs.slug, generatedSlug))
    .limit(1);

  if (existingBlog) {
    return next(
      new ApiError(
        "Blog with same title already exists",
        400
      )
    );
  }



  const [blog] = await db
    .insert(blogs)
    .values({
      userId: user.id,
      title,
      slug: generatedSlug,
      excerpt: excerpt || "",
      content,
      featuredImage,
      status: status || "draft",
      tags: tags || [],
      metaTitle: metaTitle || "",
      metaDescription:
        metaDescription || "",
      publishedAt:
        publishedAt || null,
    })
    .returning();

  return res.status(201).json({
    success: true,
    message:
      "Blog created successfully",
    // data: blog,
  });
});

// ✅ GET MY LEADS
export const getAllBlog = asyncHandler(async (req, res, next) => {
  const {
    title,
    status,
    export: isExport = "false",
    page = 1,
    limit = 20,
  } = req.query;

  const conditions = [];

  if (title) {
    conditions.push(ilike(blogs.title, `%${title}%`));
  }

  if (status) {
    conditions.push(eq(blogs.status, status));
  }

  const [countResult] = await db
    .select({
      totalCount: count(),
    })
    .from(blogs)
    .where(
      conditions.length
        ? and(...conditions)
        : undefined
    );

  const totalCount = Number(
    countResult?.totalCount || 0
  );

  let query = db
    .select()
    .from(blogs)
    .where(
      conditions.length
        ? and(...conditions)
        : undefined
    )
    .orderBy(desc(blogs.createdAt));

  if (isExport !== "true") {
    query = query
      .limit(Number(limit))
      .offset(
        (Number(page) - 1) * Number(limit)
      );
  }

  const data = await query;

  return res.status(200).json({
    success: true,
    message: "Blogs fetched successfully",
    currentCount: data.length,
    totalCount,
    data,
  });
});

export const getBlogById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const [blog] = await db
    .select()
    .from(blogs)
    .where(eq(blogs.id, Number(id)));

  if (!blog) {
    return next(
      new ApiError("Blog not found", 404)
    );
  }

  return res.status(200).json({
    success: true,
    message: "Blog fetched successfully",
    data: blog,
  });
});

export const updateBlog = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const {
    title,
    excerpt,
    content,
    status,
    tags,
    metaTitle,
    metaDescription,
    publishedAt,
  } = req.body;

  // Check blog exists
  const [existingBlog] = await db
    .select()
    .from(blogs)
    .where(eq(blogs.id, Number(id)));

  if (!existingBlog) {
    return next(
      new ApiError("Blog not found", 404)
    );
  }

      let featuredImage = existingBlog.featuredImage;

    if (req.files?.length) {
      featuredImage = req.files[0].path; 
    }


  let generatedSlug;

  // Generate slug only if title is changing
  if (title) {
    const baseSlug = slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    });

    generatedSlug = baseSlug;
    let counter = 1;

    // Ensure slug uniqueness excluding current blog
    while (true) {
      const [slugExists] = await db
        .select()
        .from(blogs)
        .where(
          and(
            eq(blogs.slug, generatedSlug),
            ne(blogs.id, Number(id))
          )
        )
        .limit(1);

      if (!slugExists) break;

      generatedSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
console.log('dsad', generatedSlug)
  const [updatedBlog] = await db
    .update(blogs)
    .set({
      title: title,
      slug: generatedSlug,
      excerpt: excerpt,
      content: content,
      featuredImage,
      status: status,
      tags: tags,
      metaTitle: metaTitle,
      metaDescription: metaDescription,
      publishedAt: publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(blogs.id, Number(id)))
    .returning();

  return res.status(200).json({
    success: true,
    message: "Blog updated successfully",
    data: updatedBlog,
  });
});

export const deleteBlog = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const [deletedBlog] = await db
    .delete(blogs)
    .where(eq(blogs.id, Number(id)))
    .returning();

  if (!deletedBlog) {
    return next(
      new ApiError("Blog not found", 404)
    );
  }

  return res.status(200).json({
    success: true,
    message: "Blog deleted successfully",
    data: deletedBlog,
  });
});