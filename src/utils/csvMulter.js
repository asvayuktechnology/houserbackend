import multer from "multer";
import path from "path";
import fs from "fs";

// ensure uploads/import folder exists
const uploadDir = "uploads/import";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

// file filter (only CSV, TSV & Excel)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "text/csv",
    "text/plain",
    "text/tab-separated-values",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
  ];

  const allowedExts = [".csv", ".tsv", ".xls", ".xlsx"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    const err = new Error("Only accept CSV and XLSX file");
    err.isOperational = true;
    cb(err, false);
  }
};

const csvUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export default csvUpload;