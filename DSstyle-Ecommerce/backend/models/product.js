import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Price in Birr (ETB)
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // Amount with unit: e.g. "50 ml", "1 kg", "250 mg", "100 g", "1 L", "1 pcs"
    amount: {
      type: String,
      default: "",
      trim: true,
    },
    // Also keep volume as alias for backward compatibility
    volume: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    images: [
      {
        type: String,
      },
    ],
    // Optional description
    description: {
      type: String,
      default: "",
      trim: true,
    },
    // Stock / Inventory (Actual warehouse stock & Client visible stock)
    quantity: {
      type: Number,
      min: 0,
      default: 50,
    },
    actualStock: {
      type: Number,
      min: 0,
      default: 50,
    },
    visibleStock: {
      type: Number,
      min: 0,
      default: 10,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    // Featured Product Flag for highlights and special showcases
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeaturedFlag: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Optional brand
    brand: {
      type: String,
      default: "DS Style",
      trim: true,
    },
    // Optional rating fields
    rating: {
      type: Number,
      default: 4.5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: false,
        },
        userName: {
          type: String,
          default: "Customer",
        },
        rating: {
          type: Number,
          default: 5,
        },
        comment: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Full-text search index
productSchema.index({
  name: "text",
  description: "text",
  amount: "text",
  brand: "text",
});

// Fast filtering compound index
productSchema.index({ category: 1, price: 1, inStock: 1 });

// Ensure actualStock, visibleStock, quantity, and inStock stay synchronized
productSchema.pre("save", function (next) {
  if (this.actualStock !== undefined && this.actualStock !== null) {
    this.quantity = Number(this.actualStock);
  } else if (this.quantity !== undefined && this.quantity !== null) {
    this.actualStock = Number(this.quantity);
  } else {
    this.actualStock = 50;
    this.quantity = 50;
  }

  if (this.visibleStock === undefined || this.visibleStock === null || this.visibleStock === "") {
    this.visibleStock = this.actualStock;
  } else {
    this.visibleStock = Number(this.visibleStock);
  }

  this.inStock = this.actualStock > 0 && this.visibleStock > 0;
  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
