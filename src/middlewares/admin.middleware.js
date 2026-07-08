import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

export const adminProtect = (req, res, next) => {
  const auth = req.headers.authorization;

  // console.log("🔹 Authorization Header:", auth);

  if (!auth || !auth.startsWith("Bearer")) {
    console.log("❌ No token provided");
    return next(new ApiError("Not authorized", 401));
  }

  const token = auth.split(" ")[1];

  console.log("🔹 Token:", token);

  try {
    // decode without verify (to check exp)
    const decodedRaw = jwt.decode(token);
    console.log("🔹 Decoded (raw):", decodedRaw);

    if (decodedRaw?.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      // console.log("⏱ Current Time:", currentTime);
      // console.log("⏳ Token Expiry Time:", decodedRaw.exp);
      // console.log(
      //   "⌛ Time Left (sec):",
      //   decodedRaw.exp - currentTime
      // );
    }

    // actual verification
    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);

    console.log("✅ Verified Decoded:", decoded);

    if (decoded.role !== "admin") {
      console.log("❌ Not an admin");
      return next(new ApiError("Access denied. Admin only.", 403));
    }

    req.user = decoded;

    next();
  } catch (err) {
    console.log("❌ JWT Error:", err.message);
    return next(new ApiError(err.message || "Invalid token", 401));
  }
};