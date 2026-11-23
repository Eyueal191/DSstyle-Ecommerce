import mongoose from "mongoose";

const bagSchema = new mongoose.Schema(
  {
    user: {
      type: String, // supports guest ID, phone, or User ObjectId
      required: true,
      unique: true, // ensures one shopping bag per user/guest
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
      },
    ],
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Bag = mongoose.model("Bag", bagSchema);
export default Bag;

