import asyncHandler from "../../utils/asyncHandler.js";
import { db } from "../../config/db/index.js";
import { leads } from "../../config/db/schema.js";
import { users, otps } from "../../config/db/schema.js";
import { ApiError } from "../../utils/ApiError.js";
import { eq, and, gt ,sql, or, ilike, desc, count } from "drizzle-orm";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { postProperties } from "../../config/db/schema.js";


export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (!user.length) {
    return next(new ApiError("Invalid email or password", 401));
  }

  const isMatch = await bcrypt.compare(password, user[0].password);

  if (!isMatch) {
    return next(new ApiError("Invalid email or password", 401));
  }

  const accessToken = jwt.sign(
    { id: user[0].id, role: user[0].role },
    process.env.JWT_SECRET,
    {  expiresIn: process.env.JWT_EXPIRES_IN,}
  );

  const refreshToken = jwt.sign(
    { id: user[0].id, role: user[0].role },
    process.env.JWT_REFRESH_SECRET,
    {  expiresIn: process.env.JWT_REFRESH_EXPIRES_IN, }
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.json({
    success: true,
    token: accessToken,
  });
});

export const getMyLeads = asyncHandler(async (req, res) => {
  const userId = req.user.id; 

  const result = await db
    .select()
    .from(leads)
    .where(eq(leads.ownerId, userId));

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});


export const sendOtp = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new ApiError("Phone is required", 400));
  }

  // 🔥 CHECK USER EXISTS
  const user = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone));

  if (!user.length) {
    return next(new ApiError("User not found. Contact admin.", 404));
  }

  // const otp = generateOtp();
  const otp='123456';

  await db.insert(otps).values({
    phone,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  console.log("OTP:", otp);

  res.json({
    success: true,
    message: "OTP sent",
  });
});


export const verifyOtp = asyncHandler(async (req, res, next) => {
  const { phone, otp } = req.body;


  
  const record = await db
  .select()
  .from(otps)
  .where(
    and(
      eq(otps.phone, phone),
      eq(otps.otp, otp),
      gt(otps.expiresAt, new Date())
    )
  );
  
  console.log("the records are :-",record);

  if (!record.length) {
    return next(new ApiError("Invalid or expired OTP", 400));
  }

  // 🔥 USER MUST EXIST (no signup)
  const user = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone));

  if (!user.length) {
    return next(new ApiError("User not found", 404));
  }

  const userData = user[0];

  const token = jwt.sign(
    { id: userData.id, role: userData.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    success: true,
    token,
    user: userData,
  });
});


export const createProperty = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id;

  if (!userId) {
    return next(new ApiError("Unauthorized", 401));
  }

const { city, sector, plotNumber, category, plotSize, propertyStatus, ownerName, ownerPhone, permanentAddress, comments } = req.body;

  if (!city) {
    return next(new ApiError("City is required", 400));
  }

  const images = req.files?.map((f) => f.path) || [];

  console.log("Received property data:", req.body);

  const result = await db
    .insert(postProperties)
    .values({
      createdBy: userId,
      city,
      sector,
      plotNumber,
      category,
      plotSize,
      propertyStatus,
      ownerName,
      ownerPhone,
      permanentAddress,
      comments,
      images,
    })
    .returning();



  res.status(201).json({
    success: true,
    data: result[0],
  });
});

export const getPostProperties = asyncHandler(async (req, res) => {
  const userId = req.user?.id || 0;

  const result = await db.execute(sql`
    SELECT 
      p.*,

      CASE 
        WHEN pu.id IS NOT NULL THEN true 
        ELSE false 
      END AS "isUnlocked",

      CASE 
        WHEN pu.id IS NOT NULL THEN p.owner_phone 
        ELSE NULL 
      END AS "ownerPhone"

    FROM post_properties p

    LEFT JOIN property_unlocks pu 
      ON p.id = pu.property_id 
      AND pu.user_id = ${userId}

    ORDER BY p.id DESC
  `);

  res.json({
    success: true,
    data: result.rows,
  });
});