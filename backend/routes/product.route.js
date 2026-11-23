import {
  addProduct,
  getProductById,
  getProductsList,
  deleteProductById,
  updateProductById,
  toggleFeaturedProduct,
} from "../controllers/productController.js";
import express from "express";
import upload from "../config/multer.js";
import { ensureAuthenticatedAdmin } from "../middleware/auth.js";

let productRoutes = express.Router();
productRoutes.post("/", upload.array("images", 5), addProduct);
productRoutes.patch("/toggle-featured/:id", toggleFeaturedProduct);
productRoutes.put("/toggle-featured/:id", toggleFeaturedProduct);
productRoutes.put("/:id", upload.array("images", 5), updateProductById);
productRoutes.delete("/:id", deleteProductById);
productRoutes.get("/", getProductsList);
productRoutes.get("/:id", getProductById);
export default productRoutes;