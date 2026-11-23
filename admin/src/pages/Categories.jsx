import React, { useState, useEffect } from "react";
import Axios from "../axios/axios.config.js";
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Layers,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { getCategoryIcon, getCategoryTheme, PRESET_ICONS } from "../utility/categoryIcons.js";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await Axios.get("/api/category");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setCategories(res.data.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
      setErrorMsg("Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setErrorMsg("");
    setSuccessMsg("");
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name || "");
    setCategoryDescription(cat.description || "");
    setErrorMsg("");
    setSuccessMsg("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
  };

  const handleSelectPreset = (preset) => {
    setCategoryName(preset.label);
    if (!categoryDescription) {
      setCategoryDescription(`Curated ${preset.label.toLowerCase()} products and collections.`);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setErrorMsg("Category name is required");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");

      if (editingCategory) {
        // Update
        const res = await Axios.put(`/api/category/${editingCategory._id}`, {
          name: categoryName.trim(),
          description: categoryDescription.trim(),
        });
        if (res.data?.success) {
          setSuccessMsg("Category updated successfully!");
          closeModal();
          fetchCategories();
        }
      } else {
        // Create
        const res = await Axios.post("/api/category", {
          name: categoryName.trim(),
          description: categoryDescription.trim(),
        });
        if (res.data?.success) {
          setSuccessMsg("Category created successfully!");
          closeModal();
          fetchCategories();
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      setSaving(true);
      const res = await Axios.delete(`/api/category/${id}`);
      if (res.data?.success) {
        setSuccessMsg("Category deleted successfully");
        setDeleteConfirmId(null);
        fetchCategories();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to delete category");
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
  const topCategory = [...categories].sort((a, b) => (b.productCount || 0) - (a.productCount || 0))[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight dark:text-gray-100">
            Category Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 dark:text-gray-400">
            Organize and structure products for effortless storefront browsing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800"
            title="Refresh Categories"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-pink-600" : ""}`} />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center justify-between dark:bg-red-500/10 dark:border-red-500/25 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-600 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/70 shadow-2xs flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Categories</p>
            <h3 className="text-2xl font-serif font-bold text-gray-900 mt-1 dark:text-gray-100">
              {categories.length}
            </h3>
            <p className="text-[11px] text-pink-600 font-medium mt-1">Active Categories</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
            <FolderTree className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/70 shadow-2xs flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Categorized Items</p>
            <h3 className="text-2xl font-serif font-bold text-gray-900 mt-1 dark:text-gray-100">
              {totalProducts}
            </h3>
            <p className="text-[11px] text-gray-400 font-medium mt-1">Active inventory count</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/70 shadow-2xs flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Top Category</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl">{getCategoryIcon(topCategory?.name)}</span>
              <h3 className="text-lg font-serif font-bold text-gray-900 truncate max-w-[150px] dark:text-gray-100" title={topCategory?.name || "N/A"}>
                {topCategory?.name || "None yet"}
              </h3>
            </div>
            <p className="text-[11px] text-pink-600 font-medium mt-1">
              {topCategory ? `${topCategory.productCount || 0} products` : "0 items"}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl ${getCategoryTheme(topCategory?.name).bg} ${getCategoryTheme(topCategory?.name).border} border flex items-center justify-center text-2xl shrink-0 shadow-2xs`}>
            {getCategoryIcon(topCategory?.name)}
          </div>
        </div>
      </div>

      {/* Search & Categories Table */}
      <div className="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:border-slate-800">
          <div className="relative w-full max-w-[240px] sm:max-w-none sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category name..."
              className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs placeholder-gray-400 focus:outline-none focus:bg-white focus:border-pink-600 transition-all shadow-2xs dark:bg-slate-800/50 dark:border-slate-800"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="text-xs text-gray-400">
            Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredCategories.length}</span> categories
          </div>
        </div>

        {/* Mobile View: Touch-Friendly Category Cards */}
        <div className="block sm:hidden divide-y divide-gray-100 dark:divide-slate-800">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-pink-600 animate-spin mx-auto mb-2" />
              <span className="text-xs">Loading categories...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <FolderTree className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No categories found</p>
              <p className="text-xs text-gray-400 mt-1">
                {search ? `No results matching "${search}"` : "Click '+ Add Category' to create your first category."}
              </p>
            </div>
          ) : (
            filteredCategories.map((c) => {
              const theme = getCategoryTheme(c.name);
              return (
                <div key={c._id} className="p-4 space-y-3 hover:bg-gray-50/70 transition-colors dark:hover:bg-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl ${theme.bg} ${theme.border} border flex items-center justify-center text-2xl shrink-0 shadow-2xs`}
                      >
                        {theme.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight dark:text-gray-100">
                          {c.name}
                        </h4>
                        <span className="text-[11px] text-gray-400">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {deleteConfirmId === c._id ? (
                        <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 dark:bg-red-500/10 dark:border-red-500/25">
                          <button
                            onClick={() => handleDeleteCategory(c._id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-1 text-gray-500 text-[10px] cursor-pointer dark:text-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(c._id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {c.description && (
                    <p className="text-xs text-gray-500 leading-relaxed pl-1 dark:text-gray-400">
                      {c.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs dark:border-slate-800">
                    <span className="text-gray-400">Catalog Inventory</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold ${theme.pill} border shadow-2xs`}>
                      <Package className="w-3.5 h-3.5 shrink-0" />
                      <span>{c.productCount || 0} products</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-slate-800/50 dark:border-slate-800 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3.5">Category</th>
                <th scope="col" className="px-6 py-3.5">Products Count</th>
                <th scope="col" className="px-6 py-3.5">Created Date</th>
                <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-pink-600 animate-spin" />
                      <span className="text-xs">Loading categories...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                    <FolderTree className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No categories found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {search ? `No results matching "${search}"` : "Click '+ Add Category' to create your first category."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => {
                  const theme = getCategoryTheme(c.name);
                  return (
                    <tr key={c._id} className="hover:bg-gray-50/70 transition-colors dark:hover:bg-slate-800">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          {/* Colorful Category Emoji/Icon Container */}
                          <div
                            className={`w-11 h-11 rounded-2xl ${theme.bg} ${theme.border} border flex items-center justify-center text-2xl shrink-0 shadow-2xs transition-transform hover:scale-105`}
                          >
                            {theme.icon}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-1.5 dark:text-gray-100">
                              <span>{c.name}</span>
                            </div>
                            {c.description ? (
                              <div className="text-[11px] text-gray-400 truncate max-w-xs mt-0.5">
                                {c.description}
                              </div>
                            ) : (
                              <div className="text-[10px] text-gray-300 italic">No description</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${theme.pill} border shadow-2xs`}>
                          <Package className="w-3.5 h-3.5 shrink-0" />
                          <span>{c.productCount || 0} products</span>
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-500 text-xs dark:text-gray-400">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {deleteConfirmId === c._id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 dark:bg-red-500/10 dark:border-red-500/25">
                              <span className="text-[10px] text-red-700 font-semibold px-1 dark:text-red-300">Confirm?</span>
                              <button
                                onClick={() => handleDeleteCategory(c._id)}
                                className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 text-gray-500 hover:text-gray-800 text-[10px] cursor-pointer dark:text-gray-400 dark:hover:text-white"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(c._id)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal with Preset Icon Suggestions */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 dark:bg-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-lg">
                  {getCategoryIcon(categoryName)}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-gray-900 dark:text-gray-100">
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </h3>
                  <p className="text-[10px] text-gray-400">Database-driven catalog organization</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              {/* Preset Icon Suggestions */}
              {!editingCategory && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">
                    Quick Preset Aisles
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-100 dark:bg-slate-800/50 dark:border-slate-800">
                    {PRESET_ICONS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          categoryName.toLowerCase() === p.label.toLowerCase()
                            ? "bg-pink-600 text-white shadow-xs"
                            : "bg-white text-gray-700 hover:bg-pink-50 border border-gray-200/60 dark:bg-slate-900 dark:text-gray-300 dark:border-slate-800"
                        }`}
                      >
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Name Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 dark:text-gray-300">
                  Category Name <span className="text-pink-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">
                    {getCategoryIcon(categoryName)}
                  </span>
                  <input
                    type="text"
                    required
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g. Skincare, Fragrance, Bath & Body"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-pink-600 transition-all dark:bg-slate-800/50 dark:border-slate-800"
                  />
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 dark:text-gray-300">
                  Description <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows="3"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Short description of products under this category..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-pink-600 transition-all dark:bg-slate-800/50 dark:border-slate-800"
                />
              </div>

              {/* Live Preview Card */}
              {categoryName.trim() && (
                <div className="bg-pink-50/40 rounded-xl p-3 border border-pink-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{getCategoryIcon(categoryName)}</span>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{categoryName}</p>
                      <p className="text-[10px] text-gray-400">Live preview in store & catalog</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                    Ready to save
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 cursor-pointer dark:border-slate-800 dark:text-gray-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;
