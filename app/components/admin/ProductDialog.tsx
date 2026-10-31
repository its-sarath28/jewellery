import { RefreshCw, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FALL_BACK_IMAGE } from "~/constants/data";
import type { Category, Product } from "~/interface/index.interface";

export interface ProductFormData {
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  price: number;
  original_price: number | null;
  description: string;
  specifications: string;
  availability: "available" | "out_of_stock";
  images: string[];
  is_new: boolean;
  is_bestseller: boolean;
  is_featured: boolean;
  published: boolean;
}

export interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  categories: Category[];
  onSave: (data: ProductFormData) => Promise<void> | void;
  onOpenAddCategory: () => void;
  onReloadCategories: () => Promise<void> | void;
  isReloadingCategories?: boolean;
}

export default function ProductDialog({
  isOpen,
  onClose,
  editingProduct,
  categories,
  onSave,
  onOpenAddCategory,
  onReloadCategories,
  isReloadingCategories = false,
}: ProductDialogProps) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    sku: "",
    category_id: "",
    price: "",
    original_price: "",
    description: "",
    specifications: "",
    availability: "available" as "available" | "out_of_stock",
    images: [] as string[],
    is_new: false,
    is_bestseller: false,
    is_featured: false,
    published: true,
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync form when dialog opens or editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        slug: editingProduct.slug,
        sku: editingProduct.sku || "",
        category_id: editingProduct.category_id,
        price: editingProduct.price.toString(),
        original_price: editingProduct.original_price
          ? editingProduct.original_price.toString()
          : "",
        description: editingProduct.description || "",
        specifications: editingProduct.specifications || "",
        availability: editingProduct.availability || "available",
        images: editingProduct.images || [],
        is_new: Boolean(editingProduct.is_new),
        is_bestseller: Boolean(editingProduct.is_bestseller),
        is_featured: Boolean(editingProduct.is_featured),
        published: editingProduct.published !== false,
      });
    } else {
      setForm({
        name: "",
        slug: "",
        sku: "",
        category_id: categories[0]?.id || "",
        price: "",
        original_price: "",
        description: "",
        specifications: "",
        availability: "available",
        images: [],
        is_new: false,
        is_bestseller: false,
        is_featured: false,
        published: true,
      });
    }
    setValidationError(null);
  }, [editingProduct, isOpen, categories]);

  if (!isOpen) return null;

  // Auto-generate slug when product name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((prev) => {
      const prevAutoSlug = prev.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const shouldUpdateSlug = !prev.slug || prev.slug === prevAutoSlug;
      const newSlug = shouldUpdateSlug
        ? val
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
        : prev.slug;
      return { ...prev, name: val, slug: newSlug };
    });
  };

  // Handle image upload via FileReader
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const readers = Array.from(files).map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then((newImages) => {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
    });
  };

  // Remove thumbnail
  const removeImage = (indexToRemove: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!form.name.trim() || !form.price) {
      setValidationError("Please provide product name and price");
      return;
    }

    const priceNum = parseFloat(form.price) || 0;
    const origPriceNum = form.original_price
      ? parseFloat(form.original_price)
      : null;
    const slugVal =
      form.slug.trim() ||
      form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const imagesArr = form.images.length > 0 ? form.images : [FALL_BACK_IMAGE];

    onSave({
      name: form.name.trim(),
      slug: slugVal,
      sku: form.sku.trim(),
      category_id: form.category_id,
      price: priceNum,
      original_price: origPriceNum,
      description: form.description.trim(),
      specifications: form.specifications.trim(),
      availability: form.availability,
      images: imagesArr,
      is_new: form.is_new,
      is_bestseller: form.is_bestseller,
      is_featured: form.is_featured,
      published: form.published,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-[#dfd9cf] shadow-2xl max-w-2xl w-full my-auto max-h-[92vh] overflow-y-auto animate-fade-in p-6 sm:p-8 md:p-10">
        {/* Header: Title and Close button */}
        <div className="flex items-start justify-between mb-7">
          <h2 className="font-serif text-[28px] sm:text-[32px] text-neutral-900 font-normal tracking-tight">
            {editingProduct ? "Edit product" : "Add a product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-700 hover:text-black p-1 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        {validationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
            {validationError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Product name & URL slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs text-neutral-600 mb-1.5 font-normal">
                Product name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={handleNameChange}
                className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-neutral-700 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-600 mb-1.5 font-normal">
                URL slug
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-neutral-700 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Row 2: SKU / Product ID & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs text-neutral-600 mb-1.5 font-normal">
                SKU / Product ID
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-neutral-700 outline-none transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs text-neutral-600 font-normal">
                  Category
                </label>
                <div className="flex items-center gap-3 text-xs text-neutral-600">
                  <button
                    type="button"
                    onClick={onOpenAddCategory}
                    className="hover:text-neutral-900 font-normal flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    + New
                  </button>
                  <button
                    type="button"
                    onClick={onReloadCategories}
                    className="hover:text-neutral-900 font-normal flex items-center gap-1 cursor-pointer transition-colors"
                    title="Reload categories"
                  >
                    <RefreshCw
                      size={11}
                      className={isReloadingCategories ? "animate-spin" : ""}
                    />
                    Reload
                  </button>
                </div>
              </div>
              <select
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
                className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-neutral-700 outline-none transition-colors cursor-pointer"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Selling price & Original price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs text-neutral-600 mb-1.5 font-normal">
                Selling price (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-neutral-700 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-600 mb-1.5 font-normal">
                Original price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.original_price}
                onChange={(e) =>
                  setForm({ ...form, original_price: e.target.value })
                }
                className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-neutral-700 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="block text-xs text-neutral-600 mb-1.5 font-normal">
              Description
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full border border-neutral-300 bg-white p-3.5 text-sm text-neutral-900 focus:border-neutral-700 outline-none transition-colors"
            />
          </div>

          {/* Row 5: Specifications */}
          <div>
            <label className="block text-xs text-neutral-600 mb-1.5 font-normal">
              Specifications (one per line)
            </label>
            <textarea
              rows={4}
              value={form.specifications}
              onChange={(e) =>
                setForm({ ...form, specifications: e.target.value })
              }
              className="w-full border border-neutral-300 bg-white p-3.5 text-sm text-neutral-900 focus:border-neutral-700 outline-none transition-colors"
            />
          </div>

          {/* Row 6: Availability */}
          <div>
            <label className="block text-xs text-neutral-600 mb-1.5 font-normal">
              Availability
            </label>
            <select
              value={form.availability}
              onChange={(e) =>
                setForm({
                  ...form,
                  availability: e.target.value as "available" | "out_of_stock",
                })
              }
              className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-neutral-700 outline-none transition-colors cursor-pointer"
            >
              <option value="available">Available</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </div>

          {/* Row 7: Upload new images */}
          <div>
            <label className="block text-xs text-neutral-600 mb-1.5 font-normal">
              Upload new images (Only allow PNG, JPG, JPEG, WebP files)
            </label>
            <input
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.webp"
              onChange={handleFiles}
              className="block w-full text-xs text-neutral-600 file:mr-3 file:py-1.5 file:px-3 file:border file:border-neutral-300 file:text-xs file:font-normal file:bg-neutral-50 hover:file:bg-neutral-100 file:cursor-pointer cursor-pointer"
            />
            {form.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {form.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group w-14 h-14 border border-neutral-300 overflow-hidden bg-neutral-100"
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-0 right-0 bg-black/75 text-white p-0.5 hover:bg-black transition-colors"
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 8: Checkboxes */}
          <div className="flex items-center gap-7 sm:gap-9 pt-1">
            <label className="flex flex-col items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_new}
                onChange={(e) => setForm({ ...form, is_new: e.target.checked })}
                className="w-3.5 h-3.5 accent-[#2c2722] cursor-pointer"
              />
              <span className="text-xs text-neutral-700">New arrival</span>
            </label>

            <label className="flex flex-col items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_bestseller}
                onChange={(e) =>
                  setForm({ ...form, is_bestseller: e.target.checked })
                }
                className="w-3.5 h-3.5 accent-[#2c2722] cursor-pointer"
              />
              <span className="text-xs text-neutral-700">Bestseller</span>
            </label>

            <label className="flex flex-col items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) =>
                  setForm({ ...form, is_featured: e.target.checked })
                }
                className="w-3.5 h-3.5 accent-[#2c2722] cursor-pointer"
              />
              <span className="text-xs text-neutral-700">Featured</span>
            </label>

            <label className="flex flex-col items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm({ ...form, published: e.target.checked })
                }
                className="w-3.5 h-3.5 accent-[#2c2722] cursor-pointer"
              />
              <span className="text-xs text-neutral-700">Published</span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="border-t border-neutral-200 pt-5 mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-neutral-400 text-xs uppercase tracking-wider font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#3a322b] hover:bg-[#25201a] text-white text-xs uppercase tracking-wider font-medium shadow-xs transition-colors cursor-pointer"
            >
              SAVE PRODUCT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
