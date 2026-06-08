import asyncHandler from "../utils/asyncHandler.js";
import { db } from "../db/index.js";
import { leads, properties } from "../db/schema.js";
import { eq } from "drizzle-orm";
import AppError from "../utils/AppError.js";

// ✅ CREATE LEAD
export const createLead = asyncHandler(async (req, res, next) => {
  const { propertyId, type } = req.body;

  // 🔍 find property
  const property = await db
    .select()
    .from(properties)
    .where(eq(properties.id, propertyId));

  if (!property.length) {
    return next(new AppError("Property not found", 404));
  }

  const prop = property[0];

  // 🔥 owner = jisne property create ki
  const ownerId = prop.createdBy;

  // ✅ create lead
  const result = await db
    .insert(leads)
    .values({
      propertyId,
      ownerId,
      userId: req.user?.id || null,
      type,
    })
    .returning();

  res.status(201).json({
    success: true,
    data: result[0],
  });
});

// ✅ GET MY LEADS
export const getMyLeads = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id;

  if (!userId) {
    return next(new AppError("Unauthorized", 401));
  }

  const result = await db
    .select({
      leadId: leads.id,
      type: leads.type,
      createdAt: leads.createdAt,

      propertyId: properties.id,
      city: properties.city,
      sector: properties.sector,
      plotNumber: properties.plotNumber,
      propertyStatus: properties.propertyStatus,
    })
    .from(leads)
    .leftJoin(properties, eq(leads.propertyId, properties.id))
    .where(eq(leads.ownerId, userId));

  res.status(200).json({
    success: true,
    count: result.length,
    data: result,
  });
});