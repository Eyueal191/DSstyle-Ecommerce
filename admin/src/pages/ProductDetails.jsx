import React, { useState, useEffect } from "react";
import Axios from "../axios/axios.config.js";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

function ProductDetails() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await Axios.get(`/api/product/${id}`);
        if (data.success && data.product) {
          setProduct(data.product);
        } else {
          toast.error(data.message || "Failed to load product");
        }
      } catch (error) {
        toast.error("Error fetching product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return <p className="text-center mt-10 text-gray-500 dark:text-gray-400">Loading product...</p>;
  }

  if (!product) {
    return <p className="text-center mt-10 text-gray-500 dark:text-gray-400">No product found.</p>;
  }

  const mainImage = product.images?.[0];
  const otherImages = product.images?.slice(1) || [];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 mt-6 flex flex-col gap-6">
      {/* Images Section */}
      <div className="flex flex-col md:flex-row gap-4">
        {mainImage && (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full md:w-2/3 h-80 object-cover rounded-xl shadow-md bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800"
          />
        )}
        {otherImages.length > 0 && (
          <div className="flex flex-row md:flex-col gap-4 md:w-1/3">
            {otherImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`${product.name} ${index + 2}`}
                className="w-24 h-24 md:w-full md:h-24 object-cover rounded-lg shadow-sm bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800"
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-3">
        <div>
          {product.brand && (
            <span className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 block mb-1">
              {product.brand}
            </span>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {Number(product.price).toLocaleString()} <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">ETB</span>
          </span>
          {product.volume && (
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">({product.volume})</span>
          )}
          {product.isCrueltyFree && (
            <span className="bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-xs font-bold px-2 py-0.5 rounded-full border border-pink-200 dark:border-pink-800">
              Cruelty-Free
            </span>
          )}
        </div>

        {/* Stock Quantity */}
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">
          Available Stock:{" "}
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{product.quantity ?? 0} units</span>
        </h2>

        {product.description && (
          <p className="text-gray-700 dark:text-gray-300 text-sm mt-2 leading-relaxed">{product.description}</p>
        )}

        {product.howToUse && (
          <div className="p-3.5 bg-pink-50 dark:bg-pink-950/30 rounded-xl border border-pink-100 dark:border-pink-900/50 mt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-pink-700 dark:text-pink-400 mb-1">
              How to Use:
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">{product.howToUse}</p>
          </div>
        )}

        {product.ingredients && (
          <div className="mt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Key Ingredients:
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{product.ingredients}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
        <button
          className="bg-pink-600 text-white py-2 px-5 rounded-xl shadow hover:bg-pink-700 transition font-semibold text-xs cursor-pointer"
          onClick={() => navigate(`/product-update/${id}`)}
        >
          Update Product
        </button>
        <button
          className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700 py-2 px-5 rounded-xl shadow-xs hover:bg-gray-200 dark:hover:bg-slate-700 transition font-semibold text-xs cursor-pointer"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default ProductDetails;
