import express from "express";

import { createSetting, getSetting, updateSetting } from "../controllers/settingController.js";
import { adminProtect } from "../middlewares/admin.middleware.js";
import { upload } from "../utils/multer.js";
const router = express.Router();


router.post("/admin/setting",  adminProtect,  createSetting);
router.get("/setting",  getSetting);
router.patch("/admin/setting", upload("logo", 1),  adminProtect,  updateSetting);


export default router;

