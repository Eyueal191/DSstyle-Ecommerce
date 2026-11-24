import multer from "multer";
import path from "path";
import fs from "fs";

// Configure disk storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads";
    if (file.fieldname === "profileImage") {
      folder = "uploads/userProfiles";
    } else if (file.fieldname === "images") {
      folder = "uploads/products";
    }
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Allow only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});

export default upload;
