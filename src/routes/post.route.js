import express from "express";
import {
  createPost,
  deletePost,
  getAllPost,
  getPostById,
  updatePost,
} from "../controllers/post.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { protectAny } from "../middlewares/protectAny.middlreware.js";

const router = express.Router();

router.post("/post", protectAny, createPost);
router.get("/post", protectAny, getAllPost);
router.get("/post/:id", protectAny, getPostById);
router.patch("/post/:id", protectAny, updatePost);
router.delete("/post/:id", protectAny, deletePost);

export default router;
