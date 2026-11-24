import express from "express";
import {
  placeOrderByUserId,
  getUserOrdersByUserId,
  getOrdersByPhone,
  getAllOrders,
  deleteOrderItemByUserId,
  updateOrderItemById,
  updateUserOrderByUserId,
  updateOrderStatus,
  createDirectSale,
  deleteOrderById,
} from "../controllers/orderController.js";

const orderRoutes = express.Router();

// Admin: delete order / sale record
orderRoutes.delete("/:orderId", deleteOrderById);

// Admin: record direct / counter sale
orderRoutes.post("/direct-sale", createDirectSale);

// Admin: get all orders
orderRoutes.get("/", getAllOrders);

// Admin: update order status
orderRoutes.put("/:orderId/status", updateOrderStatus);
orderRoutes.patch("/:orderId/status", updateOrderStatus);

// Guest / Direct order placement
orderRoutes.post("/", placeOrderByUserId);

// User: place a new order
orderRoutes.post("/user/:userId", placeOrderByUserId);
orderRoutes.post("/:userId", placeOrderByUserId);

// Lookup orders by phone number
orderRoutes.get("/phone/:phone", getOrdersByPhone);

// Get orders by userId / phone / guestId
orderRoutes.get("/user/:userId", getUserOrdersByUserId);
orderRoutes.get("/:userId", getUserOrdersByUserId);

// Update entire order
orderRoutes.put("/user/:userId", updateUserOrderByUserId);

// Update a specific item in an order
orderRoutes.put("/:itemId", updateOrderItemById);

// Delete a specific item from an order
orderRoutes.delete("/user/:userId/", deleteOrderItemByUserId);

export default orderRoutes;
