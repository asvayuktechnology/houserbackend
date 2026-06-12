import express from "express";
import { createDealer,deleteDealer,updateDealer,getDealerById, getDealers, uploadDealers, deleteAllDealers } from "../controllers/AdminController/dealer.controller.js";
import { createBanner, deleteBanner, getBanners } from "../controllers/AdminController/banner.controller.js";
import { upload } from "../utils/multer.js";
import cvsUpload from "../utils/csvMulter.js"
import { validate } from "../middlewares/validate.middleware.js";
import { createDealerSchema,updateDealerSchema ,getDealerParamsSchema } from "../validators/dealer.validator.js";
import { adminLogin, logoutAdmin, refreshToken } from "../controllers/AdminController/adminlogin.controller.js";
import { adminProtect } from "../middlewares/admin.middleware.js";
import { createUserByAdmin, deleteUser, getUsers, updateUser } from "../controllers/AdminController/adduser.controller.js";

import { getPropertiesQuerySchema } from "../validators/property.validator.js";
import { deleteProperty, getProperties, getPropertyById, updateProperty } from "../controllers/AdminController/properties.controller.js";

import { getDashboardData } from "../controllers/AdminController/dashboard.controller.js";
import { createUserSchema } from "../validators/user.validator.js";
import { getAdminProperties } from "../controllers/AdminController/postProperties.controller.js";
import { getFixedProperties, getFixedPropertyById, uploadFixedProperties, createFixedProperty, updateFixedProperty, deleteFixedProperty, deleteAllFixedProperties } from "../controllers/AdminController/fixedProperties.controller.js";
import { createFixedPropertySchema, updateFixedPropertySchema } from "../validators/fixedProperty.validator.js";



const router = express.Router();

// 🔐 LOGIN
router.post("/login", adminLogin);

// refresh Token
router.post("/refresh-token", refreshToken);

// 🔐 LOGIN
router.post("/login", adminLogin);


router.post(
  "/create-dealers",
  validate(createDealerSchema),
  adminProtect,
  // isAdmin, // 🔥 admin only
  createDealer
);

// GET ALL ( For Dealers)
router.get("/dealers",adminProtect, getDealers);

// GET ONE
router.get(
  "/dealers/:id",
  validate(getDealerParamsSchema, "params"),
  getDealerById
);

// UPDATE
router.put(
  "/dealers/:id",
  validate(getDealerParamsSchema, "params"),
  validate(updateDealerSchema),
  adminProtect,
  updateDealer
);

// // DELETE
router.delete(
  "/dealers/:id",
  validate(getDealerParamsSchema, "params"),
  adminProtect,
  deleteDealer
);

router.post(
  "/create-banner",
  upload("images", 1), 
  createBanner
);
router.get(
  "/banners",
    adminProtect,
  upload("images", 1), 
  getBanners
);
router.delete(
  "/banners/:id",
    adminProtect,
  upload("images", 1), 
  deleteBanner
);




// 🔥 PROTECTED ADMIN ACTION
router.post("/create-user", adminProtect,validate(createUserSchema), createUserByAdmin);

router.get(
  "/properties",
  // adminProtect, // 🔥 add this
  validate(getPropertiesQuerySchema, "query"),
getProperties
);

router.get("/properties/:id", adminProtect, getPropertyById);
router.put("/properties/:id", adminProtect, updateProperty);
router.delete("/properties/:id", adminProtect,deleteProperty);


// admin controll on users

router.get("/users", adminProtect, getUsers);
router.put("/users/:id", adminProtect, updateUser);
router.delete("/users/:id", adminProtect, deleteUser);

// dashboard data
router.get("/dashboard", adminProtect, getDashboardData);


router.get("/post-properties", adminProtect, getAdminProperties );
router.get("/logout",logoutAdmin)

// CSV uploads
router.post("/upload-properties",adminProtect, cvsUpload.single("file"), uploadFixedProperties);
router.post("/upload-dealers", adminProtect, cvsUpload.single("file"), uploadDealers);

// Delete all
router.delete("/delete-all-properties", adminProtect, deleteAllFixedProperties);
router.delete("/delete-all-dealers", adminProtect, deleteAllDealers);

// Fixed Properties CRUD
router.post("/fixed-properties", adminProtect, createFixedProperty);
router.get("/fixed-properties/:id", getFixedPropertyById);
router.patch("/fixed-properties/:id", adminProtect, updateFixedProperty);
router.delete("/fixed-properties/:id", adminProtect, deleteFixedProperty);

export default router;