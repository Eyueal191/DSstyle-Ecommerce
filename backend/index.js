// api/index.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/connectDB.js";
import { launchBot } from "./bot/bot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  userRoutes,
  productRoutes,
  bagRoutes,
  orderRoutes,
  settingRoutes,
  analyticsRoutes,
  categoryRoutes,
  aiRoutes,
} from "./routes/index.js";

// Load environment variables
dotenv.config();

const app = express();

// --------------------
// CORS Configuration (Environment-driven)
// --------------------
const rawOrigins = [
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
  process.env.FRONTEND_URL,
  process.env.ADMIN_FRONTEND_URL,
];

const allowedOrigins = [
  ...new Set(rawOrigins.map((origin) => origin && origin.trim().replace(/\/+$/, "")).filter(Boolean)),
];

console.log("🔒 Configured Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.trim().replace(/\/+$/, "");
      const isVercel = /^https?:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(normalizedOrigin);
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin);

      if (
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(normalizedOrigin) ||
        isVercel ||
        isLocalhost
      ) {
        return callback(null, true);
      } else {
        console.warn(`⚠️ Blocked by CORS: ${origin}`);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ✅ Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Health check route for Docker & uptime monitors
app.get(["/", "/health"], (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "DS Style Backend API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// --------------------
// Routes
// --------------------
app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/bag", bagRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/setting", settingRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/ai", aiRoutes);

// --------------------
// Server Start
// --------------------
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    launchBot();
  });
});
