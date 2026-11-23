import _ from "lodash";
import Bag from "../models/bag.js";

// 1. Add item to Shopping Bag
const addToBag = async (req, res) => {
  try {
    const { newItem, userId } = req.body;

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return res.status(400).json({ success: false, message: "Valid User ID is required" });
    }

    if (!newItem || !newItem.product) {
      return res.status(400).json({ success: false, message: "Valid product item is required" });
    }

    const cleanUserId = userId.trim();
    const qtyToAdd = Math.max(1, parseInt(newItem.quantity, 10) || 1);
    const prodId = (newItem.product?._id || newItem.product).toString();

    let userBag = await Bag.findOne({ user: cleanUserId });

    if (userBag) {
      const existingItem = _.find(
        userBag.items,
        (item) => item.product.toString() === prodId
      );

      if (existingItem) {
        existingItem.quantity = Math.max(1, (existingItem.quantity || 0) + qtyToAdd);
      } else {
        userBag.items.push({ ...newItem, product: prodId, quantity: qtyToAdd });
      }
      await userBag.save();
    } else {
      userBag = await Bag.create({
        user: cleanUserId,
        items: [{ ...newItem, product: prodId, quantity: qtyToAdd }],
      });
    }

    await userBag.populate({ path: "items.product" });

    // Clean up any orphaned references where product no longer exists
    if (userBag && Array.isArray(userBag.items)) {
      const origLen = userBag.items.length;
      userBag.items = userBag.items.filter((item) => item && item.product != null);
      if (userBag.items.length !== origLen) {
        await userBag.save();
      }
    }

    return res.status(201).json({
      success: true,
      message: "Item added to bag",
      userBag,
      userCart: userBag,
    });
  } catch (error) {
    console.error("Add to bag error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// 2. Get Shopping Bag by User ID
const getBagByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const userBag = await Bag.findOne({ user: userId }).populate("items.product");

    if (userBag && Array.isArray(userBag.items)) {
      const origLen = userBag.items.length;
      userBag.items = userBag.items.filter((item) => item && item.product != null);
      if (userBag.items.length !== origLen) {
        await userBag.save();
      }
    }

    return res.status(200).json({
      message: "Shopping bag retrieved successfully",
      error: false,
      success: true,
      userBag,
      userCart: userBag,
    });
  } catch (error) {
    console.error("Get Bag Error:", error);
    return res.status(500).json({
      message: error.message || "Internal Server Error",
      error: true,
      success: false,
    });
  }
};

// 3. Delete specific item from Bag
const deleteBagItemByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const itemToDelete = req.body;

    const userBag = await Bag.findOne({ user: userId });
    if (!userBag) {
      return res.status(404).json({ success: false, message: "Shopping bag not found" });
    }

    const productIdToDelete =
      itemToDelete?.product?._id || itemToDelete?.product || itemToDelete?._id;

    userBag.items = userBag.items.filter(
      (item) => item.product.toString() !== productIdToDelete?.toString()
    );

    await userBag.save();
    await userBag.populate({ path: "items.product" });

    // Clean up any orphaned references where product no longer exists
    if (userBag && Array.isArray(userBag.items)) {
      const origLen = userBag.items.length;
      userBag.items = userBag.items.filter((item) => item && item.product != null);
      if (userBag.items.length !== origLen) {
        await userBag.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Item removed from bag successfully",
      userBag,
      userCart: userBag,
    });
  } catch (error) {
    console.error("Delete Bag Item Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// 4. Clear entire Shopping Bag
const clearUserBagByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    await Bag.findOneAndUpdate({ user: userId }, { items: [] });

    return res.status(200).json({
      success: true,
      message: "Shopping bag cleared successfully",
    });
  } catch (error) {
    console.error("Clear Bag Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export {
  addToBag,
  getBagByUserId,
  deleteBagItemByUserId,
  clearUserBagByUserId,
  // Backward compatibility aliases
  addToBag as addToCart,
  getBagByUserId as getCartByUserId,
  deleteBagItemByUserId as deleteCartItemsByUserId,
  clearUserBagByUserId as clearUserCartByUserId,
};

