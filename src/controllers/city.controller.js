import asyncHandler from "../utils/asyncHandler.js";
import { db } from "../config/db/index.js";
import { city as City } from "../config/db/schema.js";
import { eq, and, ilike, desc, count } from "drizzle-orm";
import { ApiError } from "../utils/ApiError.js";

// CREATE CITY
export const createCity = asyncHandler(async (req, res, next) => {
  try {
    const { city } = req.body;

    if (!city) {
      return next(new ApiError("City is required", 400));
    }

    const [cityData] = await db
      .insert(City)
      .values({
        city,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: "City created successfully",
      data: cityData,
    });
  } catch (error) {
    console.error("Create City Error:", error);
    return next(error);
  }
});

// GET ALL CITIES
export const getAllCities = asyncHandler(async (req, res, next) => {
  try {
    const {
      city,
      export: isExport = "false",
      page = 1,
      limit = 20,
    } = req.query;

    const conditions = [];

    if (city) {
      conditions.push(ilike(City.city, `%${city}%`));
    }

    const [countResult] = await db
      .select({
        totalCount: count(),
      })
      .from(City)
      .where(conditions.length ? and(...conditions) : undefined);

    const totalCount = Number(countResult?.totalCount || 0);

    let query = db
      .select()
      .from(City)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(City.createdAt));

    if (isExport !== "true") {
      query = query
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));
    }

    const data = await query;

    return res.status(200).json({
      success: true,
      message: "Cities fetched successfully",
      currentCount: data.length,
      totalCount,
      data,
    });
  } catch (error) {
    console.error("Get Cities Error:", error);
    return next(error);
  }
});

// GET CITY BY ID
export const getCityById = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError("City id is required", 400));
    }

    const [cityData] = await db
      .select()
      .from(City)
      .where(eq(City.id, Number(id)));

    if (!cityData) {
      return next(new ApiError("City not found", 404));
    }

    return res.status(200).json({
      success: true,
      message: "City fetched successfully",
      data: cityData,
    });
  } catch (error) {
    console.error("Get City By Id Error:", error);
    return next(error);
  }
});

// UPDATE CITY
export const updateCity = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { city } = req.body;

    if (!id) {
      return next(new ApiError("City id is required", 400));
    }

    const [updatedCity] = await db
      .update(City)
      .set({
        city,
      })
      .where(eq(City.id, Number(id)))
      .returning();

    if (!updatedCity) {
      return next(new ApiError("City not found", 404));
    }

    return res.status(200).json({
      success: true,
      message: "City updated successfully",
      data: updatedCity,
    });
  } catch (error) {
    console.error("Update City Error:", error);
    return next(error);
  }
});

// DELETE ALL CITIES
export const deleteAllCities = asyncHandler(async (req, res, next) => {
  try {
    await db.delete(City);

    return res.status(200).json({
      success: true,
      message: "All cities deleted successfully",
    });
  } catch (error) {
    console.error("Delete All Cities Error:", error);
    return next(error);
  }
});

// DELETE CITY
export const deleteCity = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError("City id is required", 400));
    }

    const [deletedCity] = await db
      .delete(City)
      .where(eq(City.id, Number(id)))
      .returning();

    if (!deletedCity) {
      return next(new ApiError("City not found", 404));
    }

    return res.status(200).json({
      success: true,
      message: "City deleted successfully",
      data: deletedCity,
    });
  } catch (error) {
    console.error("Delete City Error:", error);
    return next(error);
  }
});