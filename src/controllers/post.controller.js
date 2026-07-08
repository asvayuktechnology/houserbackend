import asyncHandler from "../utils/asyncHandler.js";
import { db } from "../config/db/index.js";
import { post } from "../config/db/schema.js";
import { eq, and, or, ilike, desc, count } from "drizzle-orm";
import { ApiError } from "../utils/ApiError.js";

export const createPost = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
       if (!userId) {
      return next(new ApiError("User authentication required", 401));
    }


  const { fullName, phoneNo, city, sector, plot, address, comment } = req.body;

  try {
    const [postData] = await db
      .insert(post)
      .values({
        fullName: fullName ?? null,
        phoneNo: phoneNo ?? null,
        city: city ?? null,
        sector: sector ?? null,
        plot: plot ?? null,
        address: address ?? null,
        comment: comment ?? null,
        userId: userId, 
      })
      .returning();

    // console.log("Post Data:", req.body);

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: postData,
    });
  } catch (error) {
    console.error("Create Post Error:", error);
    return next(error);
  }
});

// ✅ GET MY LEADS
export const getAllPost = asyncHandler(async (req, res, next) => {
  try {
    const {
      name,
      city,
      phone,
      export: isExport = "false",
      page = 1,
      limit = 20,
    } = req.query;

    const conditions = [];

    // Search by name
    if (name) {
      conditions.push(
        ilike(post.fullName, `%${name}%`)
      );
    }

    // Search by city
    if (city) {
      conditions.push(
        ilike(post.city, `%${city}%`)
      );
    }

    // Search by phone
    if (phone) {
      conditions.push(
        ilike(post.phoneNo, `%${phone}%`)
      );
    }




    // Total Count
    const [countResult] = await db
      .select({
        totalCount: count(),
      })
      .from(post)
      .where(
        conditions.length
          ? and(...conditions)
          : undefined
      );


    const totalCount = Number(countResult?.totalCount || 0);


    // Main Query
    let query = db
      .select()
      .from(post)
      .where(
        conditions.length
          ? and(...conditions)
          : undefined
      )
      .orderBy(desc(post.createdAt));


    // Pagination only when export is false
    if (isExport !== "true") {

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 20;

      query = query
        .limit(limitNum)
        .offset(
          (pageNum - 1) * limitNum
        );
    }


    const data = await query;


    return res.status(200).json({
      success: true,
      message: "Post fetched successfully",
       currentCount: data.length,
      totalCount,
    data
    });


  } catch (error) {
    console.error("Get Post Error:", error);
    return next(error);
  }
});



export const getPostById = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError("Post id is required", 400));
    }

    const [post] = await db
      .select()
      .from(leads)
      .where(eq(post.id, Number(id)));

    if (!post) {
      return next(new ApiError("Post not found", 404));
    }

    return res.status(200).json({
      success: true,
      message: "Post details fetched successfully",
      data: lead,
    });

  } catch (error) {
    console.error("Get Post By Id Error:", error);
    return next(error);
  }
});

export const updatePost = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError("Post id is required", 400));
    }

    const {
      fullName,
      phoneNo,
      city,
      sector,
      plot,
      address,
      comment,
    } = req.body;


    const [postUpdate] = await db
      .update(post)
      .set({
        fullName: fullName ?? undefined,
        phoneNo: phoneNo ?? undefined,
        city: city ?? undefined,
        sector: sector ?? undefined,
        plot: plot ?? undefined,
        address: address ?? undefined,
        comment: comment ?? undefined,
      })
      .where(eq(post.id, Number(id)))
      .returning();


    if (!postUpdate) {
      return next(new ApiError("Post not found", 404));
    }


    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: postUpdate,
    });


  } catch (error) {
    console.error("Update Post Error:", error);
    return next(error);
  }
});
export const deletePost = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;


    if (!id) {
      return next(new ApiError("Post id is required", 400));
    }


    const [deletedPost] = await db
      .delete(post)
      .where(eq(post.id, Number(id)))
      .returning();


    if (!deletedPost) {
      return next(new ApiError("Post not found", 404));
    }


    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: deletedPost,
    });


  } catch (error) {
    console.error("Delete Post Error:", error);
    return next(error);
  }
});
