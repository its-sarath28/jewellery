import {
  Check,
  Edit2,
  Eye,
  Folder,
  FolderPlus,
  LogOut,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useOutletContext,
  useRevalidator,
} from "react-router";
import type { Route } from "./+types/index";
import type { AdminLayoutContext } from "./layout";
import type { Category, Product } from "~/interface/index.interface";
import supabase from "~/lib/supabase";
import ProductDialog, {
  type ProductFormData,
} from "~/components/admin/ProductDialog";
import CategoryDialog, {
  type CategoryFormData,
} from "~/components/admin/CategoryDialog";
import DeleteConfirmDialog from "~/components/admin/DeleteConfirmDialog";
import { FALL_BACK_IMAGE } from "~/constants/data";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - Siarah Admin Studio" },
    {
      name: "description",
      content: "Catalogue management dashboard for Siarah luxury jewellery.",
    },
  ];
}

export type AdminLoaderData = {
  products: (Product & { categories?: Category | null })[];
  categories: Category[];
};

export async function loader({}: Route.LoaderArgs): Promise<AdminLoaderData> {
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);

    const products = (productsRes.data || []) as unknown as (Product & {
      categories?: Category | null;
    })[];
    const categories = (categoriesRes.data || []) as unknown as Category[];

    return {
      products,
      categories,
    };
  } catch (err) {
    console.error("Error loading admin data:", err);
    return {
      products: [],
      categories: [],
    };
  }
}

type ActiveTab = "products" | "categories";

export default function AdminDashboard({ loaderData }: Route.ComponentProps) {
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const layoutContext = useOutletContext<AdminLayoutContext | undefined>();
  const currentUser = layoutContext?.user || null;

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    navigate("/admin/login", { replace: true });
  };

  // Local state synced with loader
  const [products, setProducts] = useState(loaderData.products);
  const [categories, setCategories] = useState(loaderData.categories);
  const [activeTab, setActiveTab] = useState<ActiveTab>("products");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const showToast = (
    text: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keep local state in sync when revalidation runs
  useEffect(() => {
    setProducts(loaderData.products);
    setCategories(loaderData.categories);
  }, [loaderData]);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [itemToDelete, setItemToDelete] = useState<{
    type: "product" | "category";
    id: string;
    name: string;
  } | null>(null);

  // Computed Metrics
  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.published).length;
  const outOfStockProducts = products.filter(
    (p) => p.availability === "out_of_stock",
  ).length;
  const totalCategories = categories.length;

  // Filtered Products for table
  const displayedProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.categories?.name && p.categories.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)),
    );
  }, [products, searchQuery]);

  // Filtered Categories for table
  const displayedCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [categories, searchQuery]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await revalidator.revalidate();
      showToast("Catalogue refreshed from database", "info");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Open Add Product Modal
  const openAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  // Open Add Category Modal
  const openAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  // Open Edit Category Modal
  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  // Save Product (Insert or Update)
  const handleSaveProduct = async (formData: ProductFormData) => {
    const categoryObj = categories.find((c) => c.id === formData.category_id);

    if (editingProduct) {
      // Update
      const updatedFields: Partial<Product> = {
        name: formData.name,
        slug: formData.slug,
        price: formData.price,
        original_price: formData.original_price,
        category_id: formData.category_id,
        sku: formData.sku,
        images: formData.images,
        description: formData.description,
        specifications: formData.specifications,
        availability: formData.availability,
        is_new: formData.is_new,
        is_bestseller: formData.is_bestseller,
        is_featured: formData.is_featured,
        published: formData.published,
        updated_at: new Date().toISOString(),
      };

      try {
        const { error } = await (supabase as any)
          .from("products")
          .update(updatedFields)
          .eq("id", editingProduct.id);

        if (error) {
          console.warn("Supabase update error (possibly RLS):", error.message);
        }
      } catch (err) {
        console.error("Update error:", err);
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                ...updatedFields,
                categories: categoryObj || p.categories,
              }
            : p,
        ),
      );

      showToast(`Updated "${formData.name}" successfully`);
    } else {
      // Insert
      const newProductItem: Product & { categories?: Category | null } = {
        id: crypto?.randomUUID
          ? crypto.randomUUID()
          : "prod-" + Date.now().toString(),
        name: formData.name,
        slug: formData.slug,
        price: formData.price,
        original_price: formData.original_price,
        category_id: formData.category_id,
        sku: formData.sku,
        images: formData.images,
        description: formData.description,
        specifications: formData.specifications,
        availability: formData.availability,
        published: formData.published,
        is_new: formData.is_new,
        is_bestseller: formData.is_bestseller,
        is_featured: formData.is_featured,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        categories: categoryObj || null,
      };

      try {
        const { error } = await (supabase as any).from("products").insert({
          id: newProductItem.id,
          name: newProductItem.name,
          slug: newProductItem.slug,
          price: newProductItem.price,
          original_price: newProductItem.original_price,
          category_id: newProductItem.category_id,
          sku: newProductItem.sku,
          images: newProductItem.images,
          description: newProductItem.description,
          specifications: newProductItem.specifications,
          availability: newProductItem.availability,
          published: newProductItem.published,
          is_new: newProductItem.is_new,
          is_bestseller: newProductItem.is_bestseller,
          is_featured: newProductItem.is_featured,
        });

        if (error) {
          console.warn("Supabase insert error (possibly RLS):", error.message);
        }
      } catch (err) {
        console.error("Insert error:", err);
      }

      setProducts((prev) => [newProductItem, ...prev]);
      showToast(`Added "${newProductItem.name}" to catalogue`);
    }

    setIsProductModalOpen(false);
  };

  // Save Category (Insert or Update)
  const handleSaveCategory = async (formData: CategoryFormData) => {
    if (editingCategory) {
      // Update
      const updatedFields: Partial<Category> = {
        name: formData.name,
        slug: formData.slug,
        sort_order: formData.sort_order,
        active: formData.active,
        image_url: formData.image_url,
      };

      try {
        const { error } = await (supabase as any)
          .from("categories")
          .update(updatedFields)
          .eq("id", editingCategory.id);

        if (error) {
          console.warn("Supabase category update error:", error.message);
        }
      } catch (err) {
        console.error("Category update error:", err);
      }

      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id ? { ...c, ...updatedFields } : c,
        ),
      );
      showToast(`Category "${formData.name}" updated`);
    } else {
      // Insert
      const newCat: Category = {
        id: crypto?.randomUUID
          ? crypto.randomUUID()
          : "cat-" + Date.now().toString(),
        name: formData.name,
        slug: formData.slug,
        sort_order: formData.sort_order,
        active: formData.active,
        image_url: formData.image_url,
        created_at: new Date().toISOString(),
      };

      try {
        const { error } = await (supabase as any)
          .from("categories")
          .insert(newCat);
        if (error) {
          console.warn("Supabase category insert error:", error.message);
        }
      } catch (err) {
        console.error("Category insert error:", err);
      }

      setCategories((prev) => [...prev, newCat]);
      showToast(`Category "${newCat.name}" created`);
    }

    setIsCategoryModalOpen(false);
  };

  // Confirm and Execute Deletion
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "product") {
      try {
        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", itemToDelete.id);
        if (error) console.warn("Supabase delete error:", error.message);
      } catch (err) {
        console.error("Delete error:", err);
      }
      setProducts((prev) => prev.filter((p) => p.id !== itemToDelete.id));
      showToast(`Deleted "${itemToDelete.name}"`);
    } else {
      try {
        const { error } = await supabase
          .from("categories")
          .delete()
          .eq("id", itemToDelete.id);
        if (error) console.warn("Supabase delete error:", error.message);
      } catch (err) {
        console.error("Delete error:", err);
      }
      setCategories((prev) => prev.filter((c) => c.id !== itemToDelete.id));
      showToast(`Deleted category "${itemToDelete.name}"`);
    }

    setItemToDelete(null);
  };

  return (
    <div className="min-h-screen bg-[#f8f6f2] flex flex-col md:flex-row font-sans text-neutral-900 selection:bg-[#caa982] selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#1c1815] text-[#f7f4ee] border border-[#3e3832] shadow-xl text-xs uppercase tracking-wider animate-fade-in">
          <Check size={14} className="text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. DARK SIDEBAR (Responsive drawer on mobile)              */}
      {/* ========================================================= */}
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 w-64 md:w-60 lg:w-64 h-screen max-h-screen overflow-y-auto shrink-0 bg-[#2b2621] text-[#ede5d8] p-6 flex flex-col justify-between transition-transform duration-300 ease-out border-r border-[#3a342c] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#3e3831] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent ${
          mobileMenuOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between pb-8">
            <Link to="/admin" className="block group">
              <span className="font-serif text-2xl tracking-[0.2em] font-normal text-[#f4eee4] group-hover:text-white transition-colors">
                SIARAH
              </span>
              <p className="text-[10px] tracking-[0.26em] uppercase text-[#9c8e7d] font-light mt-0.5">
                ADMIN STUDIO
              </p>
            </Link>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-[#9c8e7d] hover:text-white p-1"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Primary Nav Links */}
          <nav className="space-y-1.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("products");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 text-xs tracking-[0.16em] uppercase font-medium transition-all rounded-xs cursor-pointer ${
                activeTab === "products"
                  ? "bg-[#3e3831] text-[#fbf8f4] shadow-xs"
                  : "text-[#a39483] hover:bg-[#342f28] hover:text-[#fbf8f4]"
              }`}
            >
              <Package size={17} strokeWidth={1.75} />
              <span>Products</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("categories");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 text-xs tracking-[0.16em] uppercase font-medium transition-all rounded-xs cursor-pointer ${
                activeTab === "categories"
                  ? "bg-[#3e3831] text-[#fbf8f4] shadow-xs"
                  : "text-[#a39483] hover:bg-[#342f28] hover:text-[#fbf8f4]"
              }`}
            >
              <Folder size={17} strokeWidth={1.75} />
              <span>Categories</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Actions */}
        <div className="pt-6 border-t border-[#3a342c] space-y-3 text-xs tracking-[0.16em] uppercase text-[#a39483]">
          {/* User badge */}
          {currentUser && (
            <div className="px-3 py-2 bg-[#231e19] border border-[#3b3228] flex items-center gap-2 text-[11px] normal-case text-[#caa982] rounded-xs mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="truncate text-neutral-300 font-light">
                {currentUser.email || "Admin"}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-[#a39483] hover:text-[#fbf8f4] transition-colors cursor-pointer text-left"
          >
            <LogOut size={16} strokeWidth={1.5} />
            <span>Sign out</span>
          </button>

          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 text-[#a39483] hover:text-[#fbf8f4] transition-colors"
          >
            <Eye size={16} strokeWidth={1.5} />
            <span>View website</span>
          </Link>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN ADMIN CONTENT WORKSPACE                           */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header Bar */}
        <div className="md:hidden bg-[#2b2621] text-[#ede5d8] px-4 py-3.5 flex items-center justify-between border-b border-[#3a342c] sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 text-[#ede5d8] hover:text-white"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <span className="font-serif text-lg tracking-[0.2em] font-normal text-[#f4eee4]">
              SIARAH
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="p-1.5 text-[#9c8e7d] hover:text-white"
              title="Refresh"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? "animate-spin" : ""}
              />
            </button>
            <button
              type="button"
              onClick={openAddProduct}
              className="bg-[#3e3831] text-xs text-[#fbf8f4] px-2.5 py-1 uppercase tracking-wider font-medium"
            >
              + Product
            </button>
          </div>
        </div>

        {/* Dashboard Canvas Area */}
        <main className="flex-1 p-5 sm:p-8 lg:p-12 max-w-7xl w-full mx-auto">
          {/* Top Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <p className="text-[11px] font-medium tracking-[0.24em] uppercase text-[#b59871] mb-1.5">
                CATALOGUE MANAGEMENT
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.65rem] font-normal text-neutral-900 tracking-tight leading-tight">
                Dashboard
              </h1>
            </div>

            {/* Action Buttons: Refresh, Add Category, Add Product */}
            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 bg-[#fcfbf9] hover:bg-white text-neutral-800 border border-[#e3ded6] hover:border-neutral-400 px-4 py-2.5 text-xs uppercase tracking-[0.18em] font-medium transition-all shadow-2xs cursor-pointer"
              >
                <RefreshCw
                  size={13}
                  className={`text-neutral-500 ${isRefreshing ? "animate-spin text-neutral-900" : ""}`}
                />
                <span>REFRESH</span>
              </button>

              <button
                type="button"
                onClick={openAddCategory}
                className="inline-flex items-center gap-2 bg-[#fcfbf9] hover:bg-white text-neutral-800 border border-[#e3ded6] hover:border-neutral-400 px-4 py-2.5 text-xs uppercase tracking-[0.18em] font-medium transition-all shadow-2xs cursor-pointer"
              >
                <FolderPlus size={14} className="text-neutral-500" />
                <span>ADD CATEGORY</span>
              </button>

              <button
                type="button"
                onClick={openAddProduct}
                className="inline-flex items-center gap-2 bg-[#2b2621] hover:bg-[#1a1714] text-[#f5ede3] hover:text-white px-5 py-2.5 text-xs uppercase tracking-[0.18em] font-medium transition-all shadow-xs cursor-pointer"
              >
                <Plus size={15} />
                <span>ADD PRODUCT</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. METRIC STAT CARDS MATRIX                               */}
          {/* ========================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
            {/* Card 1: Total products */}
            <div className="bg-white border border-[#eee8e0] p-5 sm:p-6 shadow-2xs">
              <p className="text-xs text-neutral-500 font-light">
                Total products
              </p>
              <p className="text-3xl sm:text-4xl font-serif text-neutral-900 mt-2 font-normal">
                {totalProducts}
              </p>
            </div>

            {/* Card 2: Published */}
            <div className="bg-white border border-[#eee8e0] p-5 sm:p-6 shadow-2xs">
              <p className="text-xs text-neutral-500 font-light">Published</p>
              <p className="text-3xl sm:text-4xl font-serif text-neutral-900 mt-2 font-normal">
                {publishedProducts}
              </p>
            </div>

            {/* Card 3: Out of stock */}
            <div className="bg-white border border-[#eee8e0] p-5 sm:p-6 shadow-2xs">
              <p className="text-xs text-neutral-500 font-light">
                Out of stock
              </p>
              <p className="text-3xl sm:text-4xl font-serif text-neutral-900 mt-2 font-normal">
                {outOfStockProducts}
              </p>
            </div>

            {/* Card 4: Categories */}
            <div className="bg-white border border-[#eee8e0] p-5 sm:p-6 shadow-2xs">
              <p className="text-xs text-neutral-500 font-light">Categories</p>
              <p className="text-3xl sm:text-4xl font-serif text-neutral-900 mt-2 font-normal">
                {totalCategories}
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. TABS ROW (Products vs Categories)                      */}
          {/* ========================================================= */}
          <div className="flex items-center gap-8 border-b border-[#ece5da] mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`inline-flex items-center gap-2 pb-3.5 text-xs sm:text-[13px] uppercase tracking-[0.16em] transition-all cursor-pointer ${
                activeTab === "products"
                  ? "border-b-2 border-neutral-900 text-neutral-900 font-medium"
                  : "text-neutral-500 hover:text-neutral-900 font-normal"
              }`}
            >
              <Package size={16} />
              <span>Products ({totalProducts})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("categories")}
              className={`inline-flex items-center gap-2 pb-3.5 text-xs sm:text-[13px] uppercase tracking-[0.16em] transition-all cursor-pointer ${
                activeTab === "categories"
                  ? "border-b-2 border-neutral-900 text-neutral-900 font-medium"
                  : "text-neutral-500 hover:text-neutral-900 font-normal"
              }`}
            >
              <Folder size={16} />
              <span>Categories ({totalCategories})</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* 5. MAIN CARD CONTAINER & TABLE                           */}
          {/* ========================================================= */}
          <div className="bg-white border border-[#eee8e0] p-6 sm:p-8 lg:p-10 shadow-2xs">
            {/* Table Header Row: Title & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-serif text-2xl font-normal text-neutral-900">
                {activeTab === "products" ? "Products" : "Categories"}
              </h2>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="w-full bg-[#fcfbf9] border border-[#e3ded6] pl-8 pr-7 py-2 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#caa982] focus:bg-white transition-all rounded-xs"
                />
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* TAB 1: PRODUCTS TABLE */}
            {activeTab === "products" && (
              <div className="overflow-x-auto scrollbar-thin">
                {displayedProducts.length > 0 ? (
                  <table className="w-full text-left border-collapse min-w-155">
                    <thead>
                      <tr className="border-b border-[#f0eae1] text-[11px] uppercase tracking-[0.16em] text-neutral-400 font-light">
                        <th className="py-3 px-3 w-7/16 font-normal">
                          Product
                        </th>
                        <th className="py-3 px-3 w-2/16 font-normal">Price</th>
                        <th className="py-3 px-3 w-3/16 font-normal">
                          Category
                        </th>
                        <th className="py-3 px-3 w-2/16 font-normal">Status</th>
                        <th className="py-3 px-3 w-2/16 font-normal text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f7f4ef]">
                      {displayedProducts.map((product) => {
                        const img =
                          product.images && product.images.length > 0
                            ? product.images[0]
                            : FALL_BACK_IMAGE;
                        const catName =
                          product.categories?.name ||
                          categories.find((c) => c.id === product.category_id)
                            ?.name ||
                          "—";

                        return (
                          <tr
                            key={product.id}
                            className="hover:bg-[#fdfcfb] transition-colors group"
                          >
                            {/* Product Info */}
                            <td className="py-4 px-3">
                              <div className="flex items-center gap-3.5">
                                <Link
                                  to={`/product/${product.slug || product.id}`}
                                  target="_blank"
                                  className="w-12 h-12 shrink-0 bg-[#faf8f5] border border-[#f0eae1] overflow-hidden"
                                >
                                  <img
                                    src={img}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </Link>

                                <div className="min-w-0">
                                  <Link
                                    to={`/product/${product.slug || product.id}`}
                                    target="_blank"
                                    className="font-serif text-sm font-normal text-neutral-900 hover:text-[#b59871] transition-colors line-clamp-1"
                                  >
                                    {product.name}
                                  </Link>
                                  {product.sku && product.sku.trim() && (
                                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mt-0.5">
                                      SKU: {product.sku.trim()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Price */}
                            <td className="py-4 px-3 text-xs sm:text-sm font-medium text-neutral-900 whitespace-nowrap">
                              ₹{product.price.toLocaleString("en-IN")}
                              {product.original_price &&
                                product.original_price > product.price && (
                                  <span className="text-xs text-neutral-400 line-through font-light ml-1.5">
                                    ₹
                                    {product.original_price.toLocaleString(
                                      "en-IN",
                                    )}
                                  </span>
                                )}
                            </td>

                            {/* Category */}
                            <td className="py-4 px-3 text-xs sm:text-[13px] text-neutral-600 font-light whitespace-nowrap">
                              {catName}
                            </td>

                            {/* Status */}
                            <td className="py-4 px-3 whitespace-nowrap">
                              {product.published ? (
                                <span className="text-xs text-neutral-800 font-medium">
                                  Published
                                </span>
                              ) : (
                                <span className="text-xs text-neutral-400 font-light">
                                  Draft
                                </span>
                              )}
                              {product.availability === "out_of_stock" && (
                                <span className="block text-[10px] text-amber-700 font-light uppercase tracking-wider mt-0.5">
                                  Out of stock
                                </span>
                              )}
                            </td>

                            {/* Actions (Pencil & Trash) */}
                            <td className="py-4 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditProduct(product)}
                                  className="p-1.5 text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
                                  title="Edit product"
                                  aria-label={`Edit ${product.name}`}
                                >
                                  <Edit2 size={16} strokeWidth={1.5} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setItemToDelete({
                                      type: "product",
                                      id: product.id,
                                      name: product.name,
                                    })
                                  }
                                  className="p-1.5 text-neutral-400 hover:text-red-700 transition-colors cursor-pointer"
                                  title="Delete product"
                                  aria-label={`Delete ${product.name}`}
                                >
                                  <Trash2 size={16} strokeWidth={1.5} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-14 text-center">
                    <p className="font-serif text-lg text-neutral-800 mb-1">
                      No products found
                    </p>
                    <p className="text-xs text-neutral-400 font-light mb-4">
                      {searchQuery
                        ? `No products match "${searchQuery}".`
                        : "Your product catalogue is empty."}
                    </p>
                    <button
                      type="button"
                      onClick={openAddProduct}
                      className="inline-flex items-center gap-1.5 bg-[#2b2621] text-[#f5ede3] px-4 py-2 text-xs uppercase tracking-wider font-medium"
                    >
                      <Plus size={14} />
                      <span>Add First Product</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CATEGORIES TABLE */}
            {activeTab === "categories" && (
              <div className="overflow-x-auto scrollbar-thin">
                {displayedCategories.length > 0 ? (
                  <table className="w-full text-left border-collapse min-w-145">
                    <thead>
                      <tr className="border-b border-[#f0eae1] text-[11px] uppercase tracking-[0.16em] text-neutral-400 font-light">
                        <th className="py-3 px-3 font-normal">Category</th>
                        <th className="py-3 px-3 font-normal">Slug</th>
                        <th className="py-3 px-3 font-normal">Sort Order</th>
                        <th className="py-3 px-3 font-normal">Status</th>
                        <th className="py-3 px-3 font-normal">Products</th>
                        <th className="py-3 px-3 font-normal text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f7f4ef]">
                      {displayedCategories.map((category) => {
                        const count = products.filter(
                          (p) => p.category_id === category.id,
                        ).length;

                        return (
                          <tr
                            key={category.id}
                            className="hover:bg-[#fdfcfb] transition-colors"
                          >
                            <td className="py-4 px-3 font-serif text-sm sm:text-[15px] font-normal text-neutral-900">
                              <Link
                                to={`/category/${category.slug || category.id}`}
                                target="_blank"
                                className="hover:text-[#b59871] transition-colors"
                              >
                                {category.name}
                              </Link>
                            </td>

                            <td className="py-4 px-3 text-xs font-mono text-neutral-500">
                              {category.slug}
                            </td>

                            <td className="py-4 px-3 text-xs text-neutral-600 font-light">
                              {category.sort_order ?? 1}
                            </td>

                            <td className="py-4 px-3 text-xs">
                              {category.active !== false ? (
                                <span className="text-emerald-700 font-medium">
                                  Active
                                </span>
                              ) : (
                                <span className="text-neutral-400 font-light">
                                  Inactive
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-3 text-xs text-neutral-700 font-medium">
                              {count} {count === 1 ? "piece" : "pieces"}
                            </td>

                            <td className="py-4 px-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditCategory(category)}
                                  className="p-1.5 text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
                                  title="Edit category"
                                >
                                  <Edit2 size={16} strokeWidth={1.5} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setItemToDelete({
                                      type: "category",
                                      id: category.id,
                                      name: category.name,
                                    })
                                  }
                                  className="p-1.5 text-neutral-400 hover:text-red-700 transition-colors cursor-pointer"
                                  title="Delete category"
                                >
                                  <Trash2 size={16} strokeWidth={1.5} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-14 text-center">
                    <p className="font-serif text-lg text-neutral-800 mb-1">
                      No categories found
                    </p>
                    <p className="text-xs text-neutral-400 font-light mb-4">
                      {searchQuery
                        ? `No categories match "${searchQuery}".`
                        : "You haven't created any categories yet."}
                    </p>
                    <button
                      type="button"
                      onClick={openAddCategory}
                      className="inline-flex items-center gap-1.5 bg-[#2b2621] text-[#f5ede3] px-4 py-2 text-xs uppercase tracking-wider font-medium"
                    >
                      <Plus size={14} />
                      <span>Add First Category</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL DIALOGS (Extracted Components)                      */}
      {/* ========================================================= */}
      <ProductDialog
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        editingProduct={editingProduct}
        categories={categories}
        onSave={handleSaveProduct}
        onOpenAddCategory={openAddCategory}
        onReloadCategories={handleRefresh}
        isReloadingCategories={isRefreshing}
      />

      <CategoryDialog
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        editingCategory={editingCategory}
        onSave={handleSaveCategory}
      />

      <DeleteConfirmDialog
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        item={itemToDelete}
      />
    </div>
  );
}
