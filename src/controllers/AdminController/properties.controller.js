import asyncHandler from "../../utils/asyncHandler.js";
import { db } from "../../config/db/index.js";
import { properties } from "../../config/db/schema.js";
import { eq, and, ilike, or } from "drizzle-orm";
import { ApiError } from "../../utils/ApiError.js";


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
    userId,
  } = req.query;

  let filters = [];

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

  // 🔥 Optional: filter by specific user
  if (userId) {
    filters.push(eq(properties.createdBy, Number(userId)));
  }

  let query = db.select().from(properties);

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

  const result = await db
    .select()
    .from(properties)
    .where(eq(properties.id, Number(id)));

  if (!result.length) {
    return next(new ApiError("Property not found", 404));
  }

  res.json({
    success: true,
    data: result[0],
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

  // ❌ remove dangerous fields
  const {
    id: _id,
    createdAt,
    createdBy,
    creatorRole,
    ...cleanBody
  } = req.body;

  const result = await db
    .update(properties)
    .set(cleanBody)
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

  await db
    .delete(properties)
    .where(eq(properties.id, Number(id)));

  res.json({
    success: true,
    message: "Property deleted successfully",
  });
});