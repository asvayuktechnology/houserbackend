import fs from "fs";
import csv from "csv-parser";
import xlsx from "xlsx";
import { or, ilike, eq, and, desc } from "drizzle-orm";
import asyncHandler from "../../utils/asyncHandler.js";
import { db } from "../../config/db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { fixedProperties } from "../../config/db/schema.js";
import { fixedPropertyImportRowSchema } from "../../validators/fixedProperty.validator.js";

const COLUMN_MAPPING = {
  City: "city",
  SectorId: "sector",
  PlotNumber: "plotNumber",
  CategoryCode: "categoryCode",
  SubCategoryCode: "subCategoryCode",
  Name: "name",
  FatherName: "fatherName",
  PermanentAddress: "permanentAddress",
  CorrespondenceAddress: "correspondenceAddress",
  MobileNumber: "mobileNumber",
  email: "email",
  ImageUrl: "imageUrl",
};

const REQUIRED_COLUMNS = [
  "City",
  "SectorId",
  "PlotNumber",
  "CategoryCode",
  "SubCategoryCode",
  "Name",
  "MobileNumber",
];

const BATCH_SIZE = 500;

export const uploadFixedProperties = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError("File is required", 400);
  }

  const filePath = req.file.path;
  let rawRows = [];

  try {
    if (req.file.mimetype === "text/csv") {
      const firstLine = fs.readFileSync(filePath, "utf-8").split("\n")[0];
      const separator = firstLine.includes("\t") ? "\t" : ",";

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator }))
          .on("data", (data) => rawRows.push(data))
          .on("end", resolve)
          .on("error", reject);
      });
    } else {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rawRows = xlsx.utils.sheet_to_json(sheet);
    }

    if (!rawRows.length) {
      throw new ApiError("Uploaded file is empty", 400);
    }

    const headers = Object.keys(rawRows[0]);
    const missingCols = REQUIRED_COLUMNS.filter(
      (col) => !headers.includes(col)
    );
    if (missingCols.length) {
      throw new ApiError(
        `Missing required columns: ${missingCols.join(", ")}`,
        400
      );
    }

    const mappedRows = [];
    const validationErrors = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const mapped = {};

      for (const [csvCol, dbCol] of Object.entries(COLUMN_MAPPING)) {
        mapped[dbCol] =
          row[csvCol] !== undefined && row[csvCol] !== null
            ? String(row[csvCol]).trim()
            : "";
      }

      const result = fixedPropertyImportRowSchema.safeParse(mapped);

      if (!result.success) {
        const fields = {};
        result.error.issues.forEach((issue) => {
          fields[issue.path.join(".")] = issue.message;
        });
        validationErrors.push({ row: i + 2, fields });
        continue;
      }

      mappedRows.push(result.data);
    }

    if (validationErrors.length) {
      throw new ApiError(
        JSON.stringify({
          message: `Validation failed in ${validationErrors.length} row(s)`,
          errors: validationErrors,
        }),
        400
      );
    }

    const allExisting = await db
      .select({
        city: fixedProperties.city,
        sector: fixedProperties.sector,
        plotNumber: fixedProperties.plotNumber,
        mobileNumber: fixedProperties.mobileNumber,
        email: fixedProperties.email,
      })
      .from(fixedProperties);

    const existingPlots = new Set(
      allExisting.map((r) => `${r.city}|${r.sector}|${r.plotNumber}`)
    );
    const existingMobiles = new Set(allExisting.map((r) => r.mobileNumber));
    const existingEmails = new Set(
      allExisting.map((r) => r.email).filter(Boolean)
    );

    const toInsert = [];
    const skippedRows = [];
    const seenPlots = new Set();
    const seenMobiles = new Set();
    const seenEmails = new Set();

    for (let i = 0; i < mappedRows.length; i++) {
      const row = mappedRows[i];
      const plotKey = `${row.city}|${row.sector}|${row.plotNumber}`;

      if (existingPlots.has(plotKey) || seenPlots.has(plotKey)) {
        skippedRows.push({
          row: i + 2,
          reason: `Duplicate plot: ${row.city}/${row.sector}/${row.plotNumber}`,
        });
        continue;
      }

      if (existingMobiles.has(row.mobileNumber) || seenMobiles.has(row.mobileNumber)) {
        skippedRows.push({
          row: i + 2,
          reason: `Mobile ${row.mobileNumber} already exists`,
        });
        continue;
      }

      if (row.email && (existingEmails.has(row.email) || seenEmails.has(row.email))) {
        skippedRows.push({
          row: i + 2,
          reason: `Email ${row.email} already exists`,
        });
        continue;
      }

      seenPlots.add(plotKey);
      seenMobiles.add(row.mobileNumber);
      if (row.email) seenEmails.add(row.email);

      toInsert.push({
        city: row.city,
        sector: row.sector,
        plotNumber: row.plotNumber,
        categoryCode: row.categoryCode,
        subCategoryCode: row.subCategoryCode,
        name: row.name,
        fatherName: row.fatherName || null,
        permanentAddress: row.permanentAddress || null,
        correspondenceAddress: row.correspondenceAddress || null,
        mobileNumber: row.mobileNumber,
        email: row.email || null,
        imageUrl: row.imageUrl || null,
      });
    }

    let insertedCount = 0;
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      const result = await db.insert(fixedProperties).values(batch);
      insertedCount += result.length ?? batch.length;
    }

    res.status(200).json({
      success: true,
      message: "Import completed",
      data: {
        total: mappedRows.length,
        inserted: insertedCount,
        skipped: skippedRows.length,
        skippedRows,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.code === "23505") {
      const msg = error.detail || "Duplicate value violates unique constraint";
      throw new ApiError(msg, 409);
    }
    throw new ApiError("File processing failed", 500);
  }
});



export const getFixedProperties = asyncHandler(async (req, res) => {
  const { city, mobileNumber, category, keyword } = req.query;

  let conditions = [];

  if (city) {
    conditions.push(ilike(fixedProperties.city, `%${city}%`));
  }

  if (mobileNumber) {
    conditions.push(eq(fixedProperties.mobileNumber, mobileNumber));
  }
  if (category) {
    conditions.push(eq(fixedProperties.categoryCode, category));
  }

  if (keyword) {
    conditions.push(
      or(
        ilike(fixedProperties.name, `%${keyword}%`),
        ilike(fixedProperties.email, `%${keyword}%`)
      )
    );
  }

  let data = [];
  try {
    data = await db
      .select()
      .from(fixedProperties)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(fixedProperties.createdAt));
  } catch (error) {
    data = [];
  }

  res.status(200).json({
    success: true,
    currentCount: data.length,
    totalCount: data.length,
    data,
  });
});

export const getFixedPropertyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db
    .select()
    .from(fixedProperties)
    .where(eq(fixedProperties.id, Number(id)));

  if (!result.length) {
    return res.status(404).json({
      success: false,
      message: "Fixed property not found",
    });
  }

  res.json({
    success: true,
    data: result[0],
  });
});

// ✅ CREATE SINGLE FIXED PROPERTY
export const createFixedProperty = asyncHandler(async (req, res, next) => {
  const {
    city, sector, plotNumber, categoryCode, subCategoryCode,
    name, fatherName, permanentAddress, correspondenceAddress,
    mobileNumber, email, imageUrl
  } = req.body;

  if (!city || !sector || !plotNumber || !categoryCode || !subCategoryCode || !name || !mobileNumber) {
    return next(new ApiError("Missing required fields", 400));
  }

  const existing = await db
    .select({ id: fixedProperties.id })
    .from(fixedProperties)
    .where(
      and(
        eq(fixedProperties.city, city),
        eq(fixedProperties.sector, sector),
        eq(fixedProperties.plotNumber, plotNumber)
      )
    )
    .limit(1);

  if (existing.length) {
    return next(new ApiError("Property with same city/sector/plot already exists", 400));
  }

  const mobileExists = await db
    .select({ id: fixedProperties.id })
    .from(fixedProperties)
    .where(eq(fixedProperties.mobileNumber, mobileNumber))
    .limit(1);

  if (mobileExists.length) {
    return next(new ApiError(`Mobile ${mobileNumber} already exists`, 400));
  }

  if (email) {
    const emailExists = await db
      .select({ id: fixedProperties.id })
      .from(fixedProperties)
      .where(eq(fixedProperties.email, email))
      .limit(1);

    if (emailExists.length) {
      return next(new ApiError(`Email ${email} already exists`, 400));
    }
  }

  const result = await db
    .insert(fixedProperties)
    .values({
      city, sector, plotNumber, categoryCode, subCategoryCode,
      name, fatherName: fatherName || null,
      permanentAddress: permanentAddress || null,
      correspondenceAddress: correspondenceAddress || null,
      mobileNumber, email: email || null, imageUrl: imageUrl || null,
    })
    .returning();

  res.status(201).json({
    success: true,
    data: result[0],
  });
});

// ✅ UPDATE FIXED PROPERTY
export const updateFixedProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  const result = await db
    .update(fixedProperties)
    .set(updateData)
    .where(eq(fixedProperties.id, Number(id)))
    .returning();

  if (!result.length) {
    return res.status(404).json({
      success: false,
      message: "Fixed property not found",
    });
  }

  res.json({
    success: true,
    data: result[0],
  });
});

// ❌ DELETE FIXED PROPERTY
export const deleteFixedProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await db
    .select()
    .from(fixedProperties)
    .where(eq(fixedProperties.id, Number(id)));

  if (!existing.length) {
    return res.status(404).json({
      success: false,
      message: "Fixed property not found",
    });
  }

  await db.delete(fixedProperties).where(eq(fixedProperties.id, Number(id)));

  res.json({
    success: true,
    message: "Fixed property deleted successfully",
  });
});

// 🗑️ DELETE ALL FIXED PROPERTIES
export const deleteAllFixedProperties = asyncHandler(async (req, res) => {
  await db.delete(fixedProperties);
  res.json({
    success: true,
    message: "All fixed properties deleted successfully",
  });
});

// GET http://localhost:8000/api/fixed-properties?city=noida&category=residential&status=sell



