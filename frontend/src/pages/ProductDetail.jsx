import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Axios from "../axios/axios.config.js";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { setProduct } from "../redux/productSlice.js";
import { setUserBag } from "../redux/bagSlice.js";
import { optimizeImageUrl } from "../utility/imageOptimizer.js";
import { updateSEO } from "../utility/seo.js";

function ProductDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const product = useSelector((state) => state.product.product);
  const userId = localStorage.getItem("userId");

  // Fetch product by ID
  const fetchProductById = async (productId) => {
    try {
      setIsLoading(true);
      const { data } = await Axios.get(`/api/product/${productId}`);
      if (data.success) {
        dispatch(setProduct(data.product));
      } else {
        toast.error(data.message || "Failed to fetch product");
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch product");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProductById(id);
  }, [id]);

  useEffect(() => {
    if (product && product.name) {
      const priceStr = product.price ? ` - ${product.price} ETB` : "";
      const desc = product.description
        ? (product.description.length > 150 ? product.description.slice(0, 150) + "..." : product.description)
        : `Buy ${product.name} at DS Style, Golagole 22, with delivery across Addis Ababa.`;
      const imgUrl = Array.isArray(product.image) ? product.image[0] : product.image;
      updateSEO({
        title: `${product.name}${priceStr} | DS Style`,
        description: desc,
        image: imgUrl || undefined,
      });
    }
  }, [product, id]);

  // Client storefront strictly respects visibleStock
  const clientAvailableStock =
    product?.visibleStock !== undefined && product?.visibleStock !== null
      ? Number(product.visibleStock)
      : (product?.actualStock !== undefined && product?.actualStock !== null
          ? Number(product.actualStock)
          : Number(product?.quantity) || 0);

  // Add to bag
  const addToBag = async () => {
    if (adding) return;

    let currentUserId = userId || localStorage.getItem("userId");
    if (!currentUserId) {
      currentUserId = "guest_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("userId", currentUserId);
    }

    if (clientAvailableStock <= 0 || product?.inStock === false) {
      toast.error("This product is currently out of stock, sorry!");
      return;
    }

    if (quantity > clientAvailableStock) {
      toast.error("Sorry, that quantity isn't available right now. Please choose fewer.");
      return;
    }

    setAdding(true);
    try {
      const newItem = {
        product: product._id,
        quantity: Number(quantity) || 1,
      };

      const response = await Axios.post("/api/bag/", {
        newItem,
        userId: currentUserId,
      });
      const data = response.data;

      if (data.success) {
        dispatch(setUserBag(data.userBag));
        toast.success("Added to shopping bag!");
      } else {
        toast.error(data.message || "Failed to add product to bag");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while adding to bag");
    } finally {
      setAdding(false);
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen w-full bg-[#f4f3f0] dark:bg-[#0c0b0a] flex items-center justify-center p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center text-lg animate-pulse">
          Loading product...
        </p>
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen w-full bg-[#f4f3f0] dark:bg-[#0c0b0a] flex items-center justify-center p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center text-lg">
          Product not found.
        </p>
      </div>
    );

  const mainImage = product.images?.[0];
  const otherImages = product.images?.slice(1) || [];
  const availableStock = product.quantity ?? 0;

  return (
    <div className="min-h-screen w-full bg-[#f4f3f0] dark:bg-[#0c0b0a] py-6 sm:py-10 px-3 sm:px-6 text-gray-900 dark:text-white transition-colors">
      <div className="max-w-4xl mx-auto p-6 md:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-200/90 dark:border-slate-800">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Images */}
          <div className="flex-1 flex flex-col gap-4">
            {mainImage && (
              <img
                src={optimizeImageUrl(mainImage, 800)}
                alt={product.name}
                className="w-full h-80 md:h-[380px] object-cover rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800"
                loading="eager"
                decoding="async"
              />
            )}
            {otherImages.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {otherImages.map((img, index) => (
                  <img
                    key={index}
                    src={optimizeImageUrl(img, 200)}
                    alt={`${product.name} ${index + 2}`}
                    className="w-20 h-20 object-cover rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:border-pink-500 cursor-pointer transition-all"
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              {product.brand && (
                <span className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 block mb-1">
                  {product.brand}
                </span>
              )}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {Number(product.price).toLocaleString()}{" "}
                <span className="text-base font-semibold text-gray-500 dark:text-gray-400">
                  ETB
                </span>
              </span>
              {(product.amount || product.volume) && (
                <span className="text-sm text-gray-700 dark:text-gray-200 font-semibold bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-gray-200 dark:border-slate-700">
                  {product.amount || product.volume}
                </span>
              )}
            </div>

            {/* Skin Type tags */}
            {product.skinType?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Skin Type:
                </span>
                {product.skinType.map((st) => (
                  <span
                    key={st}
                    className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-transparent dark:border-slate-700 text-xs font-medium px-2.5 py-0.5 rounded-full"
                  >
                    {st}
                  </span>
                ))}
              </div>
            )}

            {/* In Stock status (Customer visible) */}
            <div className="text-sm">
              {clientAvailableStock > 0 && product.inStock ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  In Stock
                </span>
              ) : (
                <span className="text-red-500 dark:text-red-400 font-semibold">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-3 mt-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Quantity:
              </label>
              <div className="flex items-center border border-gray-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold transition-colors cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={availableStock}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(1, Math.min(availableStock, Number(e.target.value) || 1))
                    )
                  }
                  className="w-14 text-center py-1 font-semibold text-gray-900 dark:text-white bg-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                  className="px-3.5 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* How to Use */}
            {product.howToUse && (
              <div className="p-3.5 bg-pink-50 dark:bg-pink-950/30 rounded-xl border border-pink-100 dark:border-pink-900/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-pink-700 dark:text-pink-400 mb-1">
                  How to Use
                </h4>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {product.howToUse}
                </p>
              </div>
            )}

            {/* Key Ingredients */}
            {product.ingredients && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">
                  Key Ingredients
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {product.ingredients}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                disabled={availableStock <= 0 || adding}
                className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all shadow-sm cursor-pointer ${
                  availableStock <= 0
                    ? "bg-gray-300 dark:bg-slate-800 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                    : "bg-pink-600 text-white hover:bg-pink-700 active:scale-98"
                }`}
                onClick={addToBag}
              >
                {availableStock <= 0
                  ? "Out of Stock"
                  : adding
                  ? "Adding..."
                  : "Add To Bag"}
              </button>

              <button
                className="border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => navigate(-1)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
