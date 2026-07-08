import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

export const protect = (req, res, next) => {
  const auth = req.headers.authorization;

  // ❌ NO TOKEN
  if (!auth || !auth.startsWith("Bearer")) {
    return next(new ApiError("Not authorized, no token", 401));
  }

  const token = auth.split(" ")[1];

  if (!token) {
    return next(new ApiError("Token missing", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log(decoded, 'deco')

    // 🔥 attach user
    req.user = decoded;

    next();
  } catch (err) {
    return next(new ApiError("Invalid or expired token", 401));
  }
};