// import asyncHandler from "../../utils/asyncHandler.js";
// import jwt from "jsonwebtoken";
// import {ApiError} from "../../utils/ApiError.js";

// export const adminLogin = asyncHandler(async (req, res, next) => {
//   const { email, password } = req.body;

//   // 🔥 validation
//   if (!email || !password) {
//     return next(new ApiError("Email and password are required", 400));
//   }

//   // 🔥 check from .env
//   if (
//     email !== process.env.ADMIN_EMAIL ||
//     password !== process.env.ADMIN_PASSWORD
//   ) {
//     return next(new ApiError("Invalid admin credentials", 401));
//   }

//   // 🔐 generate token
//   const token = jwt.sign(
//     { role: "admin" },
//     process.env.JWT_ADMIN_SECRET,
//     { expiresIn: "5m" }
//   );

//   res.json({
//     success: true,
//     token,
//   });
// });


import asyncHandler from "../../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../../utils/ApiError.js";

export const adminLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  console.log(email,password)



  if (!email || !password) {
    return next(new ApiError("Email and password are required", 400));
  }

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return next(new ApiError("Invalid admin credentials", 401));
  }
console.log(email)
  // 🔐 Access Token (short)
  const accessToken = jwt.sign(
    { role: "admin" },
    process.env.JWT_ADMIN_SECRET,
    { expiresIn: "5m" }
  );

  // 🔐 Refresh Token (long)
  const refreshToken = jwt.sign(
    { role: "admin" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  // 🍪 Send refresh token in cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV, // 👉 true in production
    sameSite: "strict",
  });

  res.json({
    success: true,
    token: accessToken,
  });
});


export const refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return next(new ApiError("No refresh token", 401));
  }

  try {
    // verify refresh token
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET
    );

    // 🔐 new access token
    const newAccessToken = jwt.sign(
      { role: decoded.role },
      process.env.JWT_ADMIN_SECRET,
      { expiresIn: "5m" }
    );

    res.json({
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