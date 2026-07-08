

import asyncHandler from "../../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../../utils/ApiError.js";
import { db } from "../../config/db/index.js";
import { eq, and, gt ,sql} from "drizzle-orm";
import { users, otps } from "../../config/db/schema.js";
import bcrypt from "bcrypt";

export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ApiError("Email and password are required", 400));
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      return next(new ApiError("Invalid email or password", 401));
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return next(new ApiError("Invalid email or password", 401));
    }

    // Check admin role
    if (user.role !== "admin") {
      return next(new ApiError("Unauthorized", 403));
    }

    // Access Token
    const accessToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_ADMIN_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    // Refresh Token
    const refreshToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      }
    );

    const refreshDays =
      parseInt(process.env.JWT_REFRESH_EXPIRES_IN) || 7;

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: refreshDays * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      token: accessToken,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    return next(new ApiError(error.message || "Internal Server Error", 500));
  }
};

export const refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return next(new ApiError("No refresh token", 401));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET
    );

    const newAccessToken = jwt.sign(
      { role: decoded.role },
      process.env.JWT_ADMIN_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (err) {
    return next(new ApiError("Refresh token expired", 401));
  }
});



export const logoutAdmin = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken");

  res.json({ success: true });
});