import mongoose from "mongoose";

// Order item schema
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      default: () => ({ name: "Product", price: 0 }),
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    priceAtPurchase: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "succeeded", "failed"],
      default: "pending",
    },
    address: { type: String, default: "" },
    paymentMethod: { type: String, default: "cod" },
  },
  { timestamps: true }
);

// Main Order / Direct Sale schema
// Supports simple direct sales (sold products, amount, date, seller name)
// and online client storefront orders with optional customer info.
const orderSchema = new mongoose.Schema(
  {
    saleType: {
      type: String,
      enum: ["direct", "online"],
      default: "online",
    },
    sellerName: {
      type: String,
      default: "Store Seller",
      trim: true,
    },
    customerName: {
      type: String,
      required: false,
      default: "Walk-in Customer",
      trim: true,
    },
    customerPhone: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    deliveryAddress: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    guestId: {
      type: String,
      trim: true,
      index: true,
    },
    items: [orderItemSchema],
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
