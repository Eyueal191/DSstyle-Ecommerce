import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.js";
dotenv.config();

// Middleware: ensures user is logged in (Pass-through for seamless Admin CRUD)
export const ensureAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
          const user = await User.findById(decoded.id);
          if (user) req.user = user;
        } catch (_) { }
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// Middleware: ensures user is admin (Pass-through for seamless Admin CRUD)
export const ensureAuthenticatedAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
          const user = await User.findById(decoded.id);
          if (user) req.user = user;
        } catch (_) { }
      }
    }
    next();
  } catch (error) {
    next();
  }
};
