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

    const toInsert = [];
    const skippedRows = [];

    for (let i = 0; i < mappedRows.length; i++) {
      const row = mappedRows[i];

      const existing = await db
        .select({ id: fixedProperties.id })
        .from(fixedProperties)
        .where(
          and(
            eq(fixedProperties.city, row.city),
            eq(fixedProperties.sector, row.sector),
            eq(fixedProperties.plotNumber, row.plotNumber)
          )
        )
        .limit(1);

      if (existing.length) {
        skippedRows.push({
          row: i + 2,
          reason: `Duplicate plot: ${row.city}/${row.sector}/${row.plotNumber}`,
        });
        continue;
      }

      const mobileExists = await db
        .select({ id: fixedProperties.id })
        .from(fixedProperties)
        .where(eq(fixedProperties.mobileNumber, row.mobileNumber))
        .limit(1);

      if (mobileExists.length) {
        skippedRows.push({
          row: i + 2,
          reason: `Mobile ${row.mobileNumber} already exists`,
        });
        continue;
      }

      if (row.email) {
        const emailExists = await db
          .select({ id: fixedProperties.id })
          .from(fixedProperties)
          .where(eq(fixedProperties.email, row.email))
          .limit(1);

        if (emailExists.length) {
          skippedRows.push({
            row: i + 2,
            reason: `Email ${row.email} already exists`,
          });
          continue;
        }
      }

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
    if (toInsert.length) {
      const result = await db.insert(fixedProperties).values(toInsert);
      insertedCount = result.length ?? toInsert.length;
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
  try {
    const { city, category, mobileNumber, keyword } = req.query;

    let conditions = [];

    if (city) {
      conditions.push(ilike(fixedProperties.city, `%${city}%`));
    }

    if (category) {
      conditions.push(eq(fixedProperties.category, category));
    }

    if (mobileNumber) {
      conditions.push(eq(fixedProperties.mobileNumber, mobileNumber));
    }

    if (keyword) {
      conditions.push(
        or(
          ilike(fixedProperties.name, `%${keyword}%`),
          ilike(fixedProperties.email, `%${keyword}%`)
        )
      );
    }

    const data = await db
      .select()
      .from(fixedProperties)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(fixedProperties.createdAt));

    const totalCount = data.length; // filtered result count

    res.status(200).json({
      success: true,
      currentCount: data.length,
      totalCount,
      data,
    });

  } catch (error) {
    throw new ApiError(error.message || "Failed to fetch properties", 500);
  }
});

// GET http://localhost:8000/api/fixed-properties?city=noida&category=residential&status=sell



