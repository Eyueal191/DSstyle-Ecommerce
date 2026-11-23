import express from "express";
import { getDashboardAnalytics, getCustomersAnalytics } from "../controllers/analyticsController.js";

const analyticsRoutes = express.Router();

analyticsRoutes.get("/dashboard", getDashboardAnalytics);
analyticsRoutes.get("/customers", getCustomersAnalytics);

export default analyticsRoutes;

