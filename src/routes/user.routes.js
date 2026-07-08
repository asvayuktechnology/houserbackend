import express from "express";

// controllers
import {
  createProperty,
  getProperties,
  getPropertyById,
} from "../controllers/property.controller.js";

import {createProperty as postProperties,getPostProperties } from "../controllers/UserController/user.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";
import {
  createPropertySchema,
  getPropertiesQuerySchema,
} from "../validators/property.validator.js";

import { sendOtp, verifyOtp, loginUser } from "../controllers/UserController/user.controller.js";
import { loginUserSchema } from "../validators/user.validator.js";
import { getFixedProperties } from "../controllers/AdminController/fixedProperties.controller.js";
import { getDealers } from "../controllers/AdminController/dealer.controller.js";
import { protectAny } from "../middlewares/protectAny.middlreware.js";
import { adminProtect } from "../middlewares/admin.middleware.js";

const router = express.Router();

// 🔐 AUTH
router.post("/user/login", validate(loginUserSchema), loginUser);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// 🏠 CREATE PROPERTY
router.post(
  "/properties",
  // protect, // enable later
  validate(createPropertySchema),
  createProperty
);

// 🔥 IMPORTANT: ID route BEFORE list route
router.get("/properties/:id", (req, res, next) => {
  console.log("✅ ROUTE HIT");
  console.log("PARAM ID:", req.params.id);
  next();
}, protect, getPropertyById);

// 🔍 GET ALL PROPERTIES
router.get(
  "/properties",
  protect,
  validate(getPropertiesQuerySchema, "query"),
  getProperties
);

// Post Properties


router.post("/post-property", protect, validate(createPropertySchema),postProperties );
router.get("/post-property", protect,getPostProperties );

// Fixed Properties
router.get("/fixed-properties", protectAny, getFixedProperties);

// Dealers (public/user)
router.get("/dealers", getDealers);



// router.post("/post-property", validate(createPropertySchema),postProperties );

export default router;