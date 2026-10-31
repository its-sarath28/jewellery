import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import type { Category } from "~/interface/index.interface";

export interface CategoryFormData {
  name: string;
  slug: string;
  sort_order: number;
  active: boolean;
  image_url: string | null;
}

export interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: Category | null;
  onSave: (data: CategoryFormData) => Promise<void> | void;
}

export default function CategoryDialog({
  isOpen,
  onClose,
  editingCategory,
  onSave,
}: CategoryDialogProps) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    sort_order: 0,
    image_url: "",
    active: true,
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync form when dialog opens or editingCategory changes
  useEffect(() => {
    if (editingCategory) {
      setForm({
        name: editingCategory.name,
        slug: editingCategory.slug,
        sort_order: editingCategory.sort_order ?? 0,
        image_url: editingCategory.image_url || "",
        active: editingCategory.active !== false,
      });
    } else {
      setForm({
        name: "",
        slug: "",
        sort_order: 0,
        image_url: "",
        active: true,
      });
    }
    setValidationError(null);
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  // Auto-generate slug when category name changes
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

  // Handle single category image upload
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        image_url: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!form.name.trim()) {
      setValidationError("Please provide category name");
      return;
    }

    const slugVal =
      form.slug.trim() ||
      form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    onSave({
      name: form.name.trim(),
      slug: slugVal,
      sort_order: Number(form.sort_order) || 0,
      active: form.active,
      image_url: form.image_url.trim() ? form.image_url.trim() : null,
    });
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-[#dfd9cf] shadow-2xl max-w-md w-full my-auto max-h-[92vh] overflow-y-auto animate-fade-in p-6 sm:p-8 md:p-10">
        {/* Header: Title and Close button */}
        <div className="flex items-start justify-between mb-7">
          <h2 className="font-serif text-[28px] sm:text-[32px] text-neutral-900 font-normal tracking-tight">
            {editingCategory ? "Edit category" : "Add a category"}
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-neutral-600 mb-1.5 font-normal">
              Category name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Necklaces, Bangles, Haram Sets"
              value={form.name}
              onChange={handleNameChange}
              className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-700 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1.5 font-normal">
              URL slug
            </label>
            <input
              type="text"
              placeholder="e.g. necklaces"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-700 outline-none transition-colors"
            />
            <p className="text-xs text-neutral-500 mt-1.5">
              Web address: /category/{form.slug.trim() || "slug"}
            </p>
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1.5 font-normal">
              Sort order
            </label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm({
                  ...form,
                  sort_order: parseInt(e.target.value, 10) || 0,
                })
              }
              className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-neutral-700 outline-none transition-colors"
            />
            <p className="text-xs text-neutral-500 mt-1.5">
              Lower numbers appear first on the site navigation.
            </p>
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1.5 font-normal">
              Category image (optional)
            </label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={handleFile}
              className="block w-full text-xs text-neutral-600 file:mr-3 file:py-1.5 file:px-3 file:border file:border-neutral-300 file:text-xs file:font-normal file:bg-neutral-50 hover:file:bg-neutral-100 file:cursor-pointer cursor-pointer"
            />
            <p className="text-xs text-neutral-500 mt-1.5">
              Appears on homepage category cards. (Only allow PNG, JPG, JPEG,
              WebP files)
            </p>
            {form.image_url && (
              <div className="relative group w-14 h-14 border border-neutral-300 overflow-hidden bg-neutral-100 mt-2">
                <img
                  src={form.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image_url: "" })}
                  className="absolute top-0 right-0 bg-black/75 text-white p-0.5 hover:bg-black transition-colors"
                  title="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-3.5 h-3.5 accent-[#2c2722] cursor-pointer"
              />
              <span className="text-xs text-neutral-700">
                Active (visible to visitors)
              </span>
            </label>
          </div>

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
              SAVE CATEGORY
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
