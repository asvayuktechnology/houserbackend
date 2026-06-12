import fs from "fs";
import csv from "csv-parser";
import xlsx from "xlsx";
import asyncHandler from "../../utils/asyncHandler.js";
import { db } from "../../config/db/index.js";
import { dealers } from "../../config/db/schema.js";
import { eq, and, or } from "drizzle-orm";
import { ApiError } from "../../utils/ApiError.js";
import { dealerImportRowSchema } from "../../validators/dealer.validator.js";

const DEALER_COLUMN_MAPPING = {
  City: "city",
  Name: "name",
  Address: "address",
  Website: "website",
  Phone: "phone",
  Rating: "rating",
  Latitude: "lat",
  Longitude: "lng",
  UserId: "userId",
};

const DEALER_REQUIRED_COLUMNS = ["City", "Name", "Phone"];

export const createDealer = asyncHandler(async (req, res, next) => {
  const { city, name, address, website, phone, rating, lat, lng } = req.body;

  if (!city || !name || !phone) {
    return next(new ApiError("City, Name and Phone are required", 400));
  }

  const existing = await db
    .select()
    .from(dealers)
    .where(
      and(
        eq(dealers.name, name),
        eq(dealers.website, website || ""),
        eq(dealers.phone, phone),
        eq(dealers.lat, lat || "0"),
        eq(dealers.lng, lng || "0")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return next(new ApiError("Dealer with same name, website, phone & location already exists", 400));
  }

  const phoneExists = await db
    .select()
    .from(dealers)
    .where(eq(dealers.phone, phone))
    .limit(1);

  if (phoneExists.length > 0) {
    return next(new ApiError("Dealer with this phone number already exists", 400));
  }

  const result = await db
    .insert(dealers)
    .values({
      city,
      name,
      address,
      website,
      phone,
      rating,
      lat: lat || "0",
      lng: lng || "0",
    })
    .returning();

  res.status(201).json({
    success: true,
    data: result[0],
  });
});

export const getDealers = asyncHandler(async (req, res) => {
  const { city, keyword } = req.query;
  let conditions = [];

  if (city) {
    conditions.push(eq(dealers.city, city));
  }

  if (keyword) {
    conditions.push(
      or(
        eq(dealers.name, `%${keyword}%`),
        eq(dealers.phone, `%${keyword}%`)
      )
    );
  }

  const result = await db
    .select()
    .from(dealers)
    .where(conditions.length ? and(...conditions) : undefined);

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});

export const getDealerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db
    .select()
    .from(dealers)
    .where(eq(dealers.id, Number(id)));

  if (!result.length) {
    return res.status(404).json({
      success: false,
      message: "Dealer not found",
    });
  }

  res.json({
    success: true,
    data: result[0],
  });
});

export const updateDealer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (updateData.phone) {
    const phoneExists = await db
      .select()
      .from(dealers)
      .where(
        and(
          eq(dealers.phone, updateData.phone),
          eq(dealers.id, Number(id))
        )
      )
      .limit(1);

    if (!phoneExists.length) {
      const otherWithPhone = await db
        .select()
        .from(dealers)
        .where(eq(dealers.phone, updateData.phone))
        .limit(1);

      if (otherWithPhone.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use by another dealer",
        });
      }
    }
  }

  const result = await db
    .update(dealers)
    .set(updateData)
    .where(eq(dealers.id, Number(id)))
    .returning();

  if (!result.length) {
    return res.status(404).json({
      success: false,
      message: "Dealer not found",
    });
  }

  res.json({
    success: true,
    data: result[0],
  });
});

export const deleteDealer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const dealer = await db
    .select()
    .from(dealers)
    .where(eq(dealers.id, Number(id)));

  if (!dealer.length) {
    return res.status(404).json({
      success: false,
      message: "Dealer not found",
    });
  }

  await db.delete(dealers).where(eq(dealers.id, Number(id)));

  res.json({
    success: true,
    message: "Dealer deleted successfully",
  });
});

export const uploadDealers = asyncHandler(async (req, res) => {
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
    const missingCols = DEALER_REQUIRED_COLUMNS.filter(
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

      for (const [csvCol, dbCol] of Object.entries(DEALER_COLUMN_MAPPING)) {
        const val =
          row[csvCol] !== undefined && row[csvCol] !== null
            ? String(row[csvCol]).trim()
            : "";
        mapped[dbCol] = dbCol === "phone" ? val.replace(/\s+/g, "") : val;
      }

      const result = dealerImportRowSchema.safeParse(mapped);

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
    const seenPhones = new Set();

    for (let i = 0; i < mappedRows.length; i++) {
      const row = mappedRows[i];

      if (seenPhones.has(row.phone)) {
        skippedRows.push({
          row: i + 2,
          reason: `Duplicate phone ${row.phone} in same file`,
        });
        continue;
      }

      const existing = await db
        .select({ id: dealers.id })
        .from(dealers)
        .where(eq(dealers.phone, row.phone))
        .limit(1);

      if (existing.length) {
        skippedRows.push({
          row: i + 2,
          reason: `Phone ${row.phone} already exists`,
        });
        continue;
      }

      seenPhones.add(row.phone);

      toInsert.push({
        userId: row.userId ? Number(row.userId) : null,
        city: row.city,
        name: row.name,
        address: row.address || null,
        website: row.website || null,
        phone: row.phone,
        rating: row.rating || null,
        lat: row.lat || "0",
        lng: row.lng || "0",
      });
    }

    let insertedCount = 0;
    if (toInsert.length) {
      const result = await db.insert(dealers).values(toInsert);
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
    const pgErr = error;
    if (pgErr.code === "23505" || (pgErr.message && pgErr.message.includes("23505"))) {
      const msg = pgErr.detail || "Duplicate value violates unique constraint";
      throw new ApiError(msg, 409);
    }
    throw new ApiError(error.message || "File processing failed", 500);
  }
});
