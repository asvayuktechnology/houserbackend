import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { db } from "../../config/db/index.js";
import { banners } from "../../config/db/schema.js";
import { eq, inArray } from "drizzle-orm";

// ✅ CREATE
export const createBanner = asyncHandler(async (req, res, next) => {
  const { title, category, link } = req.body;

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
    link
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


export const updateBanner = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { title, category, link } = req.body;

  const updateData = {};

  if (title) updateData.title = title;
  if (category) updateData.category = category;
  if (link !== undefined) updateData.link = link;
  if (req.files && req.files.length > 0) updateData.imageUrl = req.files[0].path;

  
  if (Object.keys(updateData).length === 0) {
    return next(new ApiError("No fields to update", 400));
  }

  await db
    .update(banners)
    .set(updateData)
    .where(eq(banners.id, Number(id)));

  const updatedBanner = await db
    .select()
    .from(banners)
    .where(eq(banners.id, Number(id)));

  res.status(200).json({
    success: true,
    message: "Banner updated",
    data: updatedBanner[0],
  });
});