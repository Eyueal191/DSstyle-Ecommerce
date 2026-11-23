import Category from "../models/category.js";
import Product from "../models/product.js";

// 1. Get all categories with product count
export const getAllCategories = async (req, res) => {
  try {
    let categories = await Category.find().sort({ createdAt: 1 }).lean();
    
    // Auto-seed default categories if database is currently empty
    if (categories.length === 0) {
      const defaultCats = [
        "Skincare",
        "Makeup",
        "Haircare",
        "Fragrance",
        "Body & Bath",
        "Beauty Tools",
        "Kids & Baby",
        "Pantry & Snacks",
      ];
      await Category.insertMany(defaultCats.map((name) => ({ name })));
      categories = await Category.find().sort({ createdAt: 1 }).lean();
    }

    // Auto-sync any category string referenced by products
    const productCategories = await Product.distinct("category");
    for (const catRef of productCategories) {
      if (
        catRef &&
        typeof catRef === "string" &&
        !categories.some((c) => c.name.toLowerCase() === catRef.toLowerCase())
      ) {
        try {
          const created = await Category.create({ name: catRef });
          categories.push(created.toObject ? created.toObject() : created);
        } catch (_) {}
      }
    }

    // Count products per category safely using ObjectId
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        let count = 0;
        try {
          count = await Product.countDocuments({ category: cat._id });
        } catch (_) {
          count = 0;
        }
        return {
          ...cat,
          productCount: count,
        };
      })
    );

    return res.status(200).json({
      success: true,
      error: false,
      data: categoriesWithCount,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to retrieve categories",
    });
  }
};

// 2. Create new category
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Category name is required",
      });
    }

    const trimmedName = name.trim();
    const existing = await Category.findOne({
      name: new RegExp(`^${trimmedName}$`, "i"),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: true,
        message: `Category "${trimmedName}" already exists`,
      });
    }

    const newCategory = new Category({
      name: trimmedName,
      description: description?.trim() || "",
    });

    await newCategory.save();

    return res.status(201).json({
      success: true,
      error: false,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    console.error("Create category error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to create category",
    });
  }
};

// 3. Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Category name is required",
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Category not found",
      });
    }

    category.name = name.trim();
    if (description !== undefined) {
      category.description = description.trim();
    }

    await category.save();

    return res.status(200).json({
      success: true,
      error: false,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Update category error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to update category",
    });
  }
};

// 4. Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Category not found",
      });
    }

    // Check if products are assigned
    const assignedProducts = await Product.countDocuments({ category: id });

    if (assignedProducts > 0) {
      // Reassign products to General category
      let generalCat = await Category.findOne({ name: "General" });
      if (!generalCat) {
        generalCat = await Category.create({ name: "General" });
      }
      await Product.updateMany(
        { category: id },
        { $set: { category: generalCat._id } }
      );
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to delete category",
    });
  }
};
