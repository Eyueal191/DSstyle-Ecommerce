import express from "express";
import {
  handleQuickScan,
  handleAiChat,
} from "../controllers/aiController.js";

const router = express.Router();

// One-click structured business intelligence scans (overview, restock, deadstock, velocity)
router.get("/quick-scan/:type", handleQuickScan);

// Conversational AI Business Intelligence Agent
router.post("/chat", handleAiChat);

export default router;

