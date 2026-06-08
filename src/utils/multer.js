import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

const sanitizeFileName = (name) => {
  return name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.-]/g, "");
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext =
      file.mimetype?.split("/")[1] ||
      file.originalname.split(".").pop();

    return {
      folder: "banners",
      resource_type: "image",
      format: ext,
      public_id: `${Date.now()}-${sanitizeFileName(file.originalname)}`,
    };
  },
});

const fileFilter = (req, file, cb) => {
  console.log("FILE DEBUG:", file);

  const allowedMime = ["image/jpeg", "image/png", "image/webp"];

  const isValidMime = allowedMime.includes(file.mimetype);
  const isValidExt = file.originalname.match(/\.(jpg|jpeg|png|webp)$/i);

  if (isValidMime || isValidExt) {
    return cb(null, true);
  }

  return cb(new Error("Only image files allowed"), false);
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const upload = (field = "images", max = 5) => {
  return (req, res, next) => {
    multerUpload.array(field, max)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      console.log("FILES AFTER MULTER:", req.files); // 🔥 debug
      next();
    });
  };
};