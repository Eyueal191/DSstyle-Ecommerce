import React, { useState, useEffect } from "react";
import Axios from "../axios/axios.config.js";
import { toast } from "react-toastify";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, UploadCloud, Image, Trash2, Star } from "lucide-react";

function ProductUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [amountValue, setAmountValue] = useState("");
  const [amountUnit, setAmountUnit] = useState("EU");
  const [category, setCategory] = useState("Sneakers");
  const [description, setDescription] = useState("");
  const [actualStock, setActualStock] = useState("50");
  const [visibleStock, setVisibleStock] = useState("10");
  const [inStock, setInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [categoryList, setCategoryList] = useState([
    "Sneakers",
    "Boots",
    "Slides & Crocs",
    "T-Shirts & Shirts",
    "Hoodies & Tracksuits",
    "Jeans & Pants",
    "Shorts & Jorts",
    "Complete Outfits",
    "Bags & Backpacks",
    "Belts",
    "Caps & Beanies",
    "Jewelry & Grillz",
    "Eyewear & Accessories",
  ]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await Axios.get("/api/category");
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setCategoryList(res.data.data.map((c) => c.name));
        }
      } catch (e) {
        // Fallback
      }
    };
    fetchCats();
  }, []);

  const units = [
    { label: "Shoe size (EU)", value: "EU" },
    { label: "Waist size", value: "waist" },
    { label: "Clothing size (S–XXL)", value: "size" },
    { label: "Pieces (pcs)", value: "pcs" },
    { label: "One size", value: "one size" },
  ];

  // Fetch product from MongoDB
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await Axios.get(`/api/product/${id}`);
        if (res.data?.success && res.data?.product) {
          const p = res.data.product;
          setName(p.name || "");
          setPrice(p.price || 0);

          // Parse amount & unit
          const rawAmount = p.amount || p.volume || "";
          const trimmed = rawAmount.trim();
          const unitMatch = ["EU", "waist", "size", "pcs"].find((u) => trimmed.endsWith(` ${u}`));
          if (trimmed.toLowerCase() === "one size") {
            setAmountValue("");
            setAmountUnit("one size");
          } else if (unitMatch) {
            setAmountValue(trimmed.slice(0, -(unitMatch.length + 1)));
            setAmountUnit(unitMatch);
          } else if (trimmed) {
            setAmountValue(trimmed);
          }

          if (p.category) {
            setCategory(typeof p.category === "object" ? p.category.name : p.category);
          }
          setDescription(p.description || "");
          const act = p.actualStock !== undefined ? p.actualStock : (p.quantity !== undefined ? p.quantity : 50);
          const vis = p.visibleStock !== undefined ? p.visibleStock : act;
          setActualStock(String(act));
          setVisibleStock(String(vis));
          setInStock(p.inStock !== false);
          setIsFeatured(Boolean(p.isFeatured || p.isFeaturedFlag));

          const firstImg = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image || "");
          if (firstImg) {
            setPreviewUrl(firstImg);
            setImageUrl(firstImg);
          }
        }
      } catch (err) {
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setImageUrl("");
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    if (url) {
      setPreviewUrl(url);
      setSelectedFile(null);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    if (!price || Number(price) <= 0) {
      toast.error("Please enter a valid price in Birr (ETB)");
      return;
    }

    const formattedAmount = amountUnit === "one size" ? "One size" : amountValue ? `${amountValue.trim()} ${amountUnit}` : "";

    const productPayload = {
      name: name.trim(),
      price: Number(price),
      amount: formattedAmount,
      volume: formattedAmount,
      category,
      description: description.trim(),
      actualStock: Number(actualStock) || 0,
      visibleStock: Number(visibleStock) || 0,
      quantity: Number(actualStock) || 0,
      inStock: (Number(actualStock) || 0) > 0 && (Number(visibleStock) || 0) > 0,
      isFeatured,
      isFeaturedFlag: isFeatured,
      images: imageUrl ? [imageUrl.trim()] : [previewUrl],
    };

    const formData = new FormData();
    formData.set("data", JSON.stringify(productPayload));

    if (selectedFile) {
      formData.append("images", selectedFile);
    }

    try {
      setUpdating(true);
      const res = await Axios.put(`/api/product/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success(`Product '${name}' updated successfully!`);
        navigate("/products");
      } else {
        toast.error(res.data?.message || "Failed to update product");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-pink-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="p-2 bg-white rounded-xl border border-gray-200/80 text-gray-600 hover:text-pink-600 hover:bg-gray-50 transition-all shadow-2xs dark:bg-slate-900 dark:border-slate-800 dark:text-gray-400 dark:hover:bg-slate-800"
            title="Back to products"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight dark:text-gray-100">
              Edit Product
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">
              Update product pricing, volume, category, and stock
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/70 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
        <form onSubmit={submitHandler} className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider dark:text-gray-300">
              Product Name <span className="text-pink-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200/90 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-50 focus:border-pink-600 transition-all dark:bg-slate-800/50 dark:border-slate-800"
            />
          </div>

          {/* Price & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider dark:text-gray-300">
                Price in Birr (ETB) <span className="text-pink-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-serif">
                  ETB
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50/70 border border-gray-200/90 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-50 focus:border-pink-600 transition-all font-semibold font-serif dark:bg-slate-800/50 dark:border-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider dark:text-gray-300">
                Amount / Size
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={amountValue}
                  onChange={(e) => setAmountValue(e.target.value)}
                  placeholder="e.g. 40–44, 30–36, M–XXL"
                  className="flex-1 px-4 py-2.5 bg-gray-50/70 border border-gray-200/90 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-50 focus:border-pink-600 transition-all dark:bg-slate-800/50 dark:border-slate-800"
                />
                <select
                  value={amountUnit}
                  onChange={(e) => setAmountUnit(e.target.value)}
                  className="w-36 px-2.5 py-2.5 bg-gray-50/70 border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:bg-white focus:border-pink-600 cursor-pointer dark:bg-slate-800/50 dark:border-slate-800 dark:text-gray-300"
                >
                  {units.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category & Stock Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider dark:text-gray-300">
                Category <span className="text-pink-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200/90 rounded-xl text-sm text-gray-800 focus:outline-none focus:bg-white focus:border-pink-600 cursor-pointer dark:bg-slate-800/50 dark:border-slate-800 dark:text-gray-100"
              >
                {categoryList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center justify-between dark:text-gray-300">
                <span>Actual Stock</span>
                <span className="text-[10px] text-emerald-600 font-bold lowercase bg-emerald-50 px-1.5 py-0.5 rounded dark:bg-emerald-500/10">warehouse</span>
              </label>
              <input
                type="number"
                min="0"
                value={actualStock}
                onChange={(e) => setActualStock(e.target.value)}
                placeholder="50"
                className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200/90 rounded-xl text-sm text-gray-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-50 focus:border-pink-600 transition-all dark:bg-slate-800/50 dark:border-slate-800 dark:text-gray-100"
              />
              <p className="text-[10px] text-gray-400 mt-1">Real inventory in store</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center justify-between dark:text-gray-300">
                <span>Visible Stock</span>
                <span className="text-[10px] text-pink-600 font-bold lowercase bg-pink-50 px-1.5 py-0.5 rounded">storefront</span>
              </label>
              <input
                type="number"
                min="0"
                value={visibleStock}
                onChange={(e) => setVisibleStock(e.target.value)}
                placeholder="10"
                className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200/90 rounded-xl text-sm text-gray-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-50 focus:border-pink-600 transition-all dark:bg-slate-800/50 dark:border-slate-800 dark:text-gray-100"
              />
              <p className="text-[10px] text-gray-400 mt-1">Shown to customers in shop</p>
            </div>
          </div>

          {/* Product Image */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider dark:text-gray-300">
              Product Image
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-pink-600 hover:bg-pink-50/20 cursor-pointer transition-all dark:border-slate-800">
                  <UploadCloud className="w-6 h-6 text-pink-600 mb-1" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {selectedFile ? selectedFile.name : "Replace image file"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {previewUrl && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0 dark:border-slate-800 dark:bg-slate-800/50">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="relative">
                <Image className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={handleUrlChange}
                  placeholder="Or paste an image URL"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200/90 rounded-xl text-xs placeholder-gray-400 focus:outline-none focus:bg-white focus:border-pink-600 transition-all dark:bg-slate-800/50 dark:border-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                Description
              </label>
              <span className="text-[11px] text-gray-400 font-medium">Optional</span>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product details or notes (optional)..."
              className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200/90 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-50 focus:border-pink-600 transition-all dark:bg-slate-800/50 dark:border-slate-800"
            />
          </div>

          {/* In Stock Toggle */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-slate-800">
            <div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">In Stock for Sale</span>
              <p className="text-xs text-gray-400">Available for customer checkout</p>
            </div>
            <button
              type="button"
              onClick={() => setInStock(!inStock)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${inStock ? "bg-pink-600" : "bg-gray-200 dark:bg-slate-700"
                }`}
            >
              <span
                className={`pointer-events-none inline-block em-keep-light h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${inStock ? "translate-x-5.5" : "translate-x-0.5"
                  }`}
              />
            </button>
          </div>

          {/* Featured on Home Marquee Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-pink-50/60 border border-pink-100 dark:bg-pink-500/10 dark:border-pink-500/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Feature on Home Marquee</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Highlight this product in the animated marquee flow on the client homepage</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFeatured(!isFeatured)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                isFeatured ? "bg-pink-600" : "bg-gray-200 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block em-keep-light h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${
                  isFeatured ? "translate-x-5.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              to="/products"
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors dark:border-slate-800 dark:text-gray-400 dark:hover:bg-slate-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-2.5 bg-pink-600 hover:bg-[#b58d33] text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              {updating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Update Product</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductUpdate;
