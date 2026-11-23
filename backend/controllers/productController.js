import Product from "../models/product.js";
import Category from "../models/category.js";
import uploadMultipleFiles from "../utility/uploadMultipleFiles.js";
import mongoose from "mongoose";

// 1. Create Product (Simplified)
const addProduct = async (req, res) => {
  try {
    let productData = req.body;
    if (req.body.data) {
      try {
        productData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
      } catch {
        return res.status(400).json({
          message: "Invalid product JSON data format",
          error: true,
          success: false,
        });
      }
    }
    const files = req.files || [];

    // Store uploaded file URLs or image URLs
    let imageUrls = files.length > 0 ? uploadMultipleFiles(files, req) : [];
    if (productData.images && Array.isArray(productData.images)) {
      imageUrls = [...imageUrls, ...productData.images];
    } else if (productData.imageUrl) {
      imageUrls.push(productData.imageUrl);
    }
    if (imageUrls.length === 0) {
      imageUrls.push("https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&auto=format&fit=crop&q=80");
    }

    if (!productData.name || !productData.name.trim()) {
      return res.status(400).json({
        message: "Product name is required",
        error: true,
        success: false,
      });
    }

    if (productData.price === undefined || productData.price === null || productData.price === "") {
      return res.status(400).json({
        message: "Product price in Birr (ETB) is required",
        error: true,
        success: false,
      });
    }

    // Resolve or Auto-Create Category
    let categoryDoc = null;
    const catName = productData.category?.trim() || "General";
    if (mongoose.isValidObjectId(catName)) {
      categoryDoc = await Category.findById(catName);
    }
    if (!categoryDoc) {
      categoryDoc = await Category.findOne({
        name: new RegExp(`^${catName}$`, "i"),
      });
    }
    if (!categoryDoc) {
      categoryDoc = await Category.create({ name: catName });
    }

    const amount = productData.amount || productData.volume || "";

    const isFeaturedVal =
      productData.isFeatured === true ||
      productData.isFeatured === "true" ||
      productData.isFeaturedFlag === true ||
      productData.isFeaturedFlag === "true";

    const actualStockVal =
      productData.actualStock !== undefined && productData.actualStock !== ""
        ? Number(productData.actualStock)
        : (productData.quantity !== undefined && productData.quantity !== ""
          ? Number(productData.quantity)
          : 50);

    const visibleStockVal =
      productData.visibleStock !== undefined && productData.visibleStock !== ""
        ? Number(productData.visibleStock)
        : actualStockVal;

    // Create new simplified product
    const newProduct = new Product({
      name: productData.name.trim(),
      price: Number(productData.price) || 0,
      amount,
      volume: amount,
      category: categoryDoc._id,
      images: imageUrls,
      description: productData.description?.trim() || "",
      quantity: actualStockVal,
      actualStock: actualStockVal,
      visibleStock: visibleStockVal,
      inStock: actualStockVal > 0 && visibleStockVal > 0,
      isFeatured: isFeaturedVal,
      isFeaturedFlag: isFeaturedVal,
      brand: productData.brand?.trim() || "DS Style",
    });

    await newProduct.save();

    res.status(201).json({
      message: "Product created successfully",
      error: false,
      success: true,
      product: newProduct,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      message: error.message || "Internal Server Error",
      error: true,
      success: false,
    });
  }
};

// 2. Get Product By ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID format",
        error: true,
        success: false,
      });
    }

    const product = await Product.findById(id).populate("category", "name");

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        error: true,
        success: false,
      });
    }

    res.status(200).json({
      message: "Product retrieved successfully",
      error: false,
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
      error: true,
      success: false,
    });
  }
};

// 3. Get Products List
const getProductsList = async (req, res) => {
  try {
    const {
      search,
      selectedCategories,
      priceMin,
      priceMax,
      inStock,
      startDate,
      endDate,
      dateFilter,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const conditions = [];

    // Date filtering (Date range or presets: 7d, 30d, 90d, today, year)
    const dateQuery = {};
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) dateQuery.$gte = d;
    }
    if (endDate) {
      const d = new Date(endDate);
      if (!isNaN(d.getTime())) dateQuery.$lte = d;
    }

    if (dateFilter) {
      const now = new Date();
      if (dateFilter === "today" || dateFilter === "1d") {
        const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        dateQuery.$gte = past24h;
      } else if (dateFilter === "7d" || dateFilter === "week") {
        const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateQuery.$gte = past7d;
      } else if (dateFilter === "30d" || dateFilter === "month") {
        const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateQuery.$gte = past30d;
      } else if (dateFilter === "90d" || dateFilter === "3months") {
        const past90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        dateQuery.$gte = past90d;
      } else if (dateFilter === "year") {
        const pastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        dateQuery.$gte = pastYear;
      }
    }

    if (Object.keys(dateQuery).length > 0) {
      conditions.push({ createdAt: dateQuery });
    }

    // Price range
    if (priceMin || priceMax) {
      const priceFilter = {};
      if (priceMin && !isNaN(Number(priceMin))) priceFilter.$gte = Number(priceMin);
      if (priceMax && !isNaN(Number(priceMax))) priceFilter.$lte = Number(priceMax);
      if (Object.keys(priceFilter).length > 0) {
        conditions.push({ price: priceFilter });
      }
    }

    // Category filter
    if (selectedCategories) {
      let categoriesArray = [];
      try {
        categoriesArray =
          typeof selectedCategories === "string"
            ? JSON.parse(selectedCategories)
            : selectedCategories;
      } catch (e) {
        categoriesArray = [selectedCategories];
      }

      if (Array.isArray(categoriesArray) && categoriesArray.length > 0) {
        const regexList = categoriesArray.map(
          (c) => new RegExp(`^${(c || "").toString().trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
        );
        const categoryDocs = await Category.find({
          name: { $in: regexList },
        });
        const categoryIds = categoryDocs.map((cat) => cat._id);

        conditions.push({ category: { $in: categoryIds } });
      }
    }

    // In stock
    if (inStock !== undefined) {
      conditions.push({ inStock: inStock === "true" || inStock === true });
    }

    // Featured Flag filter
    if (req.query.isFeatured !== undefined || req.query.isFeaturedFlag !== undefined) {
      const isFeat =
        req.query.isFeatured === "true" ||
        req.query.isFeatured === true ||
        req.query.isFeaturedFlag === "true" ||
        req.query.isFeaturedFlag === true;
      conditions.push({
        $or: [{ isFeatured: isFeat }, { isFeaturedFlag: isFeat }],
      });
    }

    // Search term (safely escaped)
    if (search && search.trim() !== "") {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(safeSearch, "i");
      conditions.push({
        $or: [
          { name: searchRegex },
          { brand: searchRegex },
          { description: searchRegex },
          { amount: searchRegex },
        ],
      });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    const sortDirection = order === "asc" || order === "1" || order === 1 ? 1 : -1;
    const sortField = sortBy === "price" || sortBy === "name" || sortBy === "actualStock" ? sortBy : "createdAt";

    const products = await Product.find(query)
      .populate("category", "name")
      .sort({ [sortField]: sortDirection, _id: sortDirection });

    res.status(200).json({
      message: "Products retrieved successfully",
      error: false,
      success: true,
      products,
      totalCount: products.length,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      message: error.message || "Internal Server Error",
      error: true,
      success: false,
    });
  }
};

// 4. Delete Product By ID
const deleteProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        message: "Product not found",
        error: true,
        success: false,
      });
    }

    res.status(200).json({
      message: `Product '${deletedProduct.name}' deleted successfully`,
      error: false,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
      error: true,
      success: false,
    });
  }
};

// 5. Update Product By ID
const updateProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files || [];
    const imageUrls = files.length > 0 ? uploadMultipleFiles(files, req) : [];

    let updates = req.body;
    if (req.body.data) {
      try {
        updates = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
      } catch {
        return res.status(400).json({ success: false, error: true, message: "Invalid updates JSON format" });
      }
    }

    // Resolve category if provided
    if (updates.category) {
      let categoryDoc = null;
      if (mongoose.isValidObjectId(updates.category)) {
        categoryDoc = await Category.findById(updates.category);
      }
      if (!categoryDoc) {
        categoryDoc = await Category.findOne({
          name: new RegExp(`^${updates.category.trim()}$`, "i"),
        });
      }
      if (!categoryDoc) {
        categoryDoc = await Category.create({ name: updates.category.trim() });
      }
      updates.category = categoryDoc._id;
    }

    if (updates.amount) {
      updates.volume = updates.amount;
    }

    // Preserve existing images if none were newly uploaded
    const oldProduct = await Product.findById(id);
    if (!oldProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (imageUrls.length > 0) {
      updates.images = imageUrls;
    } else if (!updates.images) {
      updates.images = oldProduct.images;
    }

    if (updates.isFeatured !== undefined || updates.isFeaturedFlag !== undefined) {
      const isFeat =
        updates.isFeatured === true ||
        updates.isFeatured === "true" ||
        updates.isFeaturedFlag === true ||
        updates.isFeaturedFlag === "true";
      updates.isFeatured = isFeat;
      updates.isFeaturedFlag = isFeat;
    }

    // Handle stock updates
    if (updates.actualStock !== undefined && updates.actualStock !== "") {
      updates.actualStock = Number(updates.actualStock);
      updates.quantity = updates.actualStock;
    } else if (updates.quantity !== undefined && updates.quantity !== "") {
      updates.quantity = Number(updates.quantity);
      updates.actualStock = updates.quantity;
    }

    if (updates.visibleStock !== undefined && updates.visibleStock !== "") {
      updates.visibleStock = Number(updates.visibleStock);
    }

    const currentActual = updates.actualStock ?? oldProduct.actualStock ?? oldProduct.quantity ?? 0;
    const currentVisible = updates.visibleStock ?? oldProduct.visibleStock ?? currentActual;
    updates.inStock = currentActual > 0 && currentVisible > 0;

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("category", "name");

    res.status(200).json({
      success: true,
      message: `Product '${updatedProduct.name}' updated successfully`,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// 6. Fast Toggle Featured Product
const toggleFeaturedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    const nextVal = !(product.isFeatured || product.isFeaturedFlag);
    product.isFeatured = nextVal;
    product.isFeaturedFlag = nextVal;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product '${product.name}' is now ${nextVal ? "featured on marquee" : "unfeatured"}`,
      isFeatured: nextVal,
      isFeaturedFlag: nextVal,
      product,
    });
  } catch (error) {
    console.error("Toggle featured error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle featured status",
    });
  }
};

export {
  addProduct,
  getProductById,
  getProductsList,
  deleteProductById,
  updateProductById,
  toggleFeaturedProduct,
};
