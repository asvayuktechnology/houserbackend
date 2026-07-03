import fs from "fs";
import csv from "csv-parser";
import xlsx from "xlsx";
import asyncHandler from "../../utils/asyncHandler.js";
import { db } from "../../config/db/index.js";
import { dealers } from "../../config/db/schema.js";
import { eq, and, or, ilike, desc, count } from "drizzle-orm";
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
    const {
    city,
    phone,
    name,
    email,
    keyword,
    export: isExport = "false",
    page = 1,
    limit = 20,
  } = req.query;

  const conditions = [];

    if (city) {
      conditions.push(ilike(dealers.city, `%${city}%`));
    }
  
    if (phone) {
      conditions.push(eq(dealers.phone, phone));
    }
    if (name) {
      conditions.push(eq(dealers.name, name));
    }
    if (email) {
      conditions.push(eq(dealers.email, email));
    }
  
  
    if (keyword) {
      conditions.push(
        or(
          ilike(dealers.address, `%${keyword}%`),
          ilike(dealers.rating, `%${keyword}%`),
        )
      );
    }
  
    let data = [];
      let totalCount = 0;

    try {

          const [countResult] = await db
            .select({
              totalCount: count(),
            })
            .from(dealers)
            .where(conditions.length ? and(...conditions) : undefined);
      
          totalCount = Number(countResult?.totalCount || 0);

      let query = db
        .select()
        .from(dealers)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(dealers.createdAt));
  
      // export=true => no pagination, return all records
      if (isExport !== "true") {
        query = query.limit(Number(limit)).offset(
          (Number(page) - 1) * Number(limit)
        );
      }
  
      data = await query;
    } catch (error) {
      data = [];
    }

    res.status(200).json({
      success: true,
      // export: isExport === "true",
      currentCount: data.length,
      totalCount,
      data,
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

const BATCH_SIZE = 500;

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

    const allExistingPhones = await db
      .select({ phone: dealers.phone })
      .from(dealers);

    const existingPhones = new Set(allExistingPhones.map((r) => r.phone));

    const toInsert = [];
    const skippedRows = [];
    const seenPhones = new Set();

    for (let i = 0; i < mappedRows.length; i++) {
      const row = mappedRows[i];

      // if (seenPhones.has(row.phone) || existingPhones.has(row.phone)) {
      //   skippedRows.push({
      //     row: i + 2,
      //     reason: `Phone ${row.phone} already exists`,
      //   });
      //   continue;
      // }

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
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      const result = await db.insert(dealers).values(batch);
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
    const pgErr = error;
    if (pgErr.code === "23505" || (pgErr.message && pgErr.message.includes("23505"))) {
      const msg = pgErr.detail || "Duplicate value violates unique constraint";
      throw new ApiError(msg, 409);
    }
    throw new ApiError(error.message || "File processing failed", 500);
  }
});

// 🗑️ DELETE ALL DEALERS
export const deleteAllDealers = asyncHandler(async (req, res) => {
  await db.delete(dealers);
  res.json({
    success: true,
    message: "All dealers deleted successfully",
  });
});
