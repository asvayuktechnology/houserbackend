import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

export const protectAny = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer")) {
    return next(new ApiError("Not authorized, no token", 401));
  }

  const token = auth.split(" ")[1];

  let decoded;

  try {
    // try user token first
    decoded = jwt.verify(token, process.env.JWT_SECRET);

  } catch (err1) {
    try {
      // fallback to admin token
      decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);

    } catch (err2) {
      return next(new ApiError("Invalid or expired token", 401));
    }
  }

  // attach common req object
  req.user = decoded;

  next();
};