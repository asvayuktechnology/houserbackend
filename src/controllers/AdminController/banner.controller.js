import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { db } from "../../config/db/index.js";
import { banners } from "../../config/db/schema.js";
import { eq, inArray } from "drizzle-orm";

// ✅ CREATE
export const createBanner = asyncHandler(async (req, res, next) => {
  const { title, category } = req.body;

  if (!title) {
    return next(new ApiError("Title is required", 400));
  }

  if (!req.files || req.files.length === 0) {
    return next(new ApiError("Image is required", 400));
  }

  const data = req.files.map(file => ({
    title,
    category: category || "homepage", // ✅ default handle
    imageUrl: file.path,
  }));

  const result = await db.insert(banners).values(data).returning();

  res.status(201).json({
    success: true,
    data: result,
  });
});

// ✅ DELETE SINGLE IMAGE
export const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await db.delete(banners).where(eq(banners.id, Number(id)));

  res.status(200).json({
    success: true,
    message: "Deleted",
  });
});


// ✅ GET ALL
export const getBanners = asyncHandler(async (req, res) => {
  const { category } = req.query;

  let query = db.select().from(banners);

  if (category) {
    query = query.where(eq(banners.category, category));
  }

  const data = await query;

  res.status(200).json({
    success: true,
    data,
  });
});


// ✅ GET BY ID
export const getBannerById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const banner = await db
    .select()
    .from(banners)
    .where(eq(banners.id, Number(id)));

  if (!banner.length) {
    return next(new ApiError("Banner not found", 404));
  }

  res.status(200).json({
    success: true,
    data: banner[0],
  });
});


// ✅ 🔥 FINAL UPDATE (all-in-one)
export const updateBanner = asyncHandler(async (req, res, next) => {
  const { title, deleteIds, category } = req.body;

  // 🗑️ DELETE
  if (deleteIds && deleteIds.length > 0) {
    await db
      .delete(banners)
      .where(inArray(banners.id, deleteIds.map(Number)));
  }

  // ✏️ UPDATE (title + category)
  if (title || category) {
    await db.update(banners).set({
      ...(title && { title }),
      ...(category && { category }),
    });
  }

  // ➕ ADD NEW
  if (req.files && req.files.length > 0) {
    if (!title) {
      return next(new ApiError("Title required when adding images", 400));
    }

    const data = req.files.map(file => ({
      title,
      category: category || "homepage",
      imageUrl: file.path,
    }));

    await db.insert(banners).values(data);
  }

  const updatedData = await db.select().from(banners);

  res.status(200).json({
    success: true,
    message: "Banner updated",
    data: updatedData,
  });
});