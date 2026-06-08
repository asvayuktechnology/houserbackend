import fs from "fs";
import csv from "csv-parser";
import xlsx from "xlsx";
import asyncHandler from "../../utils/asyncHandler.js";
import { db } from "../../config/db/index.js";
import { ilike, eq, and, desc } from "drizzle-orm";
import { fixedproperties } from "../../config/db/schema.js";
import { ApiError } from "../../utils/ApiError.js";

export const uploadFixedProperties = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError("File is required", 400);
  }

  const filePath = req.file.path;
  let results = [];

  try {
    // ===== CSV HANDLING =====
    if (req.file.mimetype === "text/csv") {
      // detect delimiter (comma or tab)
      const firstLine = fs.readFileSync(filePath, "utf-8").split("\n")[0];
      const separator = firstLine.includes("\t") ? "\t" : ",";

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator }))
          .on("data", (data) => results.push(data))
          .on("end", resolve)
          .on("error", reject);
      });
    } else {
      // ===== EXCEL HANDLING =====
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      results = xlsx.utils.sheet_to_json(sheet);
    }

    if (!results.length) {
      throw new ApiError("Uploaded file is empty", 400);
    }

    // ===== HEADER VALIDATION =====
    const requiredColumns = [
      "city",
      "plotNumber",
      "category",
      "propertyStatus",
    ];

    const headers = Object.keys(results[0]);

    const missing = requiredColumns.filter((col) => !headers.includes(col));

    if (missing.length) {
      throw new ApiError(
        `Missing columns: ${missing.join(", ")}`,
        400
      );
    }

    // ===== FORMAT DATA =====
    const formattedData = results.map((row, index) => {
      if (!row.city || !row.plotNumber) {
        throw new ApiError(
          `Row ${index + 1}: city and plotNumber are required`,
          400
        );
      }

      return {
        city: row.city.trim(),
        sector: row.sector || null,
        plotNumber: row.plotNumber,

        category: row.category,
        plotSize: row.plotSize,
        propertyStatus: row.propertyStatus,

        ownerName: row.ownerName,
        ownerPhone: String(row.ownerPhone || "").trim(),
        permanentAddress: row.permanentAddress || null,

        comments: row.comments || null,

        images: row.images ? row.images.split(",") : [],

        createdBy: req.user?.id || 1,
        creatorRole: "admin",
      };
    });

    // ===== INSERT =====
    await db.insert(fixedproperties).values(formattedData);

    res.status(200).json({
      success: true,
      message: "Properties uploaded successfully",
      count: formattedData.length,
    });

  } catch (error) {
    throw new ApiError(error.message || "File processing failed", 500);
  } finally {
    // ===== CLEANUP =====
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});



export const getFixedProperties = asyncHandler(async (req, res) => {
  try {
    const { city, category, status, search } = req.query;

    let conditions = [];

    if (city) {
      conditions.push(ilike(fixedproperties.city, `%${city}%`));
    }

    if (category) {
      conditions.push(eq(fixedproperties.category, category));
    }

    if (status) {
      conditions.push(eq(fixedproperties.propertyStatus, status));
    }

    if (search) {
      conditions.push(ilike(fixedproperties.ownerName, `%${search}%`));
    }

    const data = await db
      .select()
      .from(fixedproperties)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(fixedproperties.createdAt));

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });

  } catch (error) {
    throw new ApiError(error.message || "Failed to fetch properties", 500);
  }
});

// GET http://localhost:8000/api/fixed-properties?city=noida&category=residential&status=sell



