import asyncHandler from "../utils/asyncHandler.js";
import { db } from "../db/index.js";
import { users, otps } from "../config/db/schema.js";
import { eq, and, gt } from "drizzle-orm";
import { generateOtp } from "../utils/Otp.js";
import { signToken } from "../utils/jwt.js";

// 🔥 SEND OTP
export const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: "Phone required",
    });
  }

  const otp = generateOtp();

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // delete old OTP
  await db.delete(otps).where(eq(otps.phone, phone));

  // save new OTP
  await db.insert(otps).values({
    phone,
    otp,
    expiresAt,
  });

  console.log(`OTP for ${phone}: ${otp}`); // 🔥 dev

  res.json({
    success: true,
    message: "OTP sent",
  });
});

// 🔥 VERIFY OTP
export const verifyOtp = asyncHandler(async (req, res) => {
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

    console.log(record)

  if (!record.length) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  // delete OTP
  await db.delete(otps).where(eq(otps.phone, phone));

  // find user
  let user = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone));

  if (!user.length) {
    const newUser = await db
      .insert(users)
      .values({
        phone,
        role: "user", // 🔥 default
      })
      .returning();

    user = newUser;
  }

  const token = signToken(user[0]);

  res.json({
    success: true,
    token,
    user: user[0],
  });
});