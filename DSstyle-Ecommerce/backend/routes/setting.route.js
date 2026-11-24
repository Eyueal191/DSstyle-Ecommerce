import express from "express";
import { getSettings, updateSettings } from "../controllers/settingController.js";

const settingRoutes = express.Router();

settingRoutes.get("/", getSettings);
settingRoutes.put("/", updateSettings);
settingRoutes.post("/", updateSettings);

export default settingRoutes;

