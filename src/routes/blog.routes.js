import express from "express";
import { createBlog, deleteBlog, getAllBlog, getBlogById, updateBlog } from "../controllers/blog.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { adminProtect } from "../middlewares/admin.middleware.js";
import { protectAny } from "../middlewares/protectAny.middlreware.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

router.post("/admin/blog", upload('featuredImage', 1), adminProtect, createBlog);
router.get("/blog", getAllBlog);
router.get("/blog/:id", protectAny, getBlogById);
router.patch("/admin/blog/:id", upload('featuredImage', 1), adminProtect, updateBlog);
router.delete("/admin/blog/:id",  adminProtect, deleteBlog);

export default router;
