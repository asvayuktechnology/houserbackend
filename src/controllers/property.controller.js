import asyncHandler from "../utils/asyncHandler.js";
import { db } from "../config/db/index.js";
import { properties } from "../config/db/schema.js";
import { createPropertySchema } from "../validators/property.validator.js";
import { eq, and, ilike, or } from "drizzle-orm";
import { ApiError } from "../utils/ApiError.js";

// ================= CREATE =================
export const createProperty = asyncHandler(async (req, res, next) => {
  const parsed = createPropertySchema.safeParse(req.body);

  if (!parsed.success) {
    return next(
      new ApiError(
        parsed.error.errors.map((e) => e.message).join(", "),
        400
      )
    );
  }

  const imageUrls =
    req.files?.map((file) => file.path || file.url) || [];

  const result = await db
    .insert(properties)
    .values({
      ...parsed.data,
      images: imageUrls,
      createdBy: req.user?.id || 1,
      creatorRole: req.user?.role || "user",
    })
    .returning();

  res.status(201).json({
    success: true,
    data: result[0],
  });
});


// ================= GET ALL =================
export const getProperties = asyncHandler(async (req, res) => {
  const {
    city,
    sector,
    category,
    propertyStatus,
    plotSize,
    ownerName,
    search,
    userId, // 🔥 optional for admin filter
  } = req.query;

  let filters = [];

  // 🔎 Filters
  if (propertyStatus)
    filters.push(eq(properties.propertyStatus, propertyStatus));

  if (city)
    filters.push(ilike(properties.city, `%${city}%`));

  if (sector)
    filters.push(ilike(properties.sector, `%${sector}%`));

  if (category)
    filters.push(eq(properties.category, category));

  if (plotSize)
    filters.push(eq(properties.plotSize, plotSize));

  if (ownerName)
    filters.push(ilike(properties.ownerName, `%${ownerName}%`));

  if (search) {
    filters.push(
      or(
        ilike(properties.city, `%${search}%`),
        ilike(properties.sector, `%${search}%`),
        ilike(properties.ownerName, `%${search}%`),
        ilike(properties.plotNumber, `%${search}%`)
      )
    );
  }

  // 🔥 BASE QUERY
  let query = db.select().from(properties);

  // ================= ROLE LOGIC =================

  // 👤 USER → only own properties
  if (req.user?.role !== "admin") {
    filters.push(eq(properties.createdBy, req.user?.id));
  }

  // 👑 ADMIN → filter by userId if provided
  if (req.user?.role === "admin" && userId) {
    filters.push(eq(properties.createdBy, Number(userId)));
  }

  // ================= APPLY FILTERS =================
  if (filters.length > 0) {
    query = query.where(and(...filters));
  }

  const result = await query;

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});


// ================= GET BY ID =================
export const getPropertyById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;


  console.log("hello")
  const result = await db
    .select()
    .from(properties)
    .where(eq(properties.id, Number(id)));

  if (!result.length) {
    return next(new ApiError("Property not found", 404));
  }

  const property = result[0];

  // 🔐 USER can only see own property
  if (
    req.user?.role !== "admin" &&
    property.createdBy !== req.user?.id
  ) {
    return next(new ApiError("Not allowed", 403));
  }

  res.json({
    success: true,
    data: property,
  });
});


// ================= UPDATE =================
export const updateProperty = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const existing = await db
    .select()
    .from(properties)
    .where(eq(properties.id, Number(id)));

  if (!existing.length) {
    return next(new ApiError("Property not found", 404));
  }

  const property = existing[0];

  // 🔐 permission
  if (
    property.createdBy !== req.user?.id &&
    req.user?.role !== "admin"
  ) {
    return next(new ApiError("Not allowed", 403));
  }

  let imageUrls = property.images || [];

  if (req.files?.length) {
    const newImages = req.files.map((file) => file.path);
    imageUrls = [...imageUrls, ...newImages];
  }

  const result = await db
    .update(properties)
    .set({
      ...req.body,
      images: imageUrls,
    })
    .where(eq(properties.id, Number(id)))
    .returning();

  res.json({
    success: true,
    data: result[0],
  });
});


// ================= DELETE =================
export const deleteProperty = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const existing = await db
    .select()
    .from(properties)
    .where(eq(properties.id, Number(id)));

  if (!existing.length) {
    return next(new ApiError("Property not found", 404));
  }

  const property = existing[0];

  // 🔐 permission
  if (
    property.createdBy !== req.user?.id &&
    req.user?.role !== "admin"
  ) {
    return next(new ApiError("Not allowed", 403));
  }

  await db
    .delete(properties)
    .where(eq(properties.id, Number(id)));

  res.json({
    success: true,
    message: "Property deleted successfully",
  });
});