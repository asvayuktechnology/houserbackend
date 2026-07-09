import express from "express";

import { protect } from "../middlewares/auth.middleware.js";
import { protectAny } from "../middlewares/protectAny.middlreware.js";
import { createCity, deleteCity, deleteAllCities, getAllCities, getCityById, updateCity } from "../controllers/city.controller.js";
import { adminProtect } from "../middlewares/admin.middleware.js";

const router = express.Router();

router.post("/admin/city", adminProtect, createCity);
router.get("/city", getAllCities);
router.get("/city/:id",  getCityById);
router.patch("/admin/city/:id", adminProtect, updateCity);
router.delete("/admin/city/:id", adminProtect, deleteCity);
router.delete("/admin/delete-all-cities", adminProtect, deleteAllCities);
export default router;
