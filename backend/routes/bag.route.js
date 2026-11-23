import express from "express";
import {
  addToBag,
  getBagByUserId,
  deleteBagItemByUserId,
  clearUserBagByUserId,
} from "../controllers/bagController.js";

const bagRoutes = express.Router();

// 1. Add item to Bag
// POST /api/bag
bagRoutes.post("/", addToBag);

// 2. Get Bag by User ID
// GET /api/bag/:userId
bagRoutes.get("/:userId", getBagByUserId);

// 3. Delete specific Bag item
// DELETE /api/bag/:userId/item
bagRoutes.delete("/:userId/item", deleteBagItemByUserId);

// 4. Clear entire Bag
// DELETE /api/bag/:userId/clear
bagRoutes.delete("/:userId/clear", clearUserBagByUserId);

export default bagRoutes;

