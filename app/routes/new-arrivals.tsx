import {
  ArrowRight,
  Check,
  ChevronDown,
  MessageCircle,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/new-arrivals";
import Footer from "~/components/Footer";
import Navbar from "~/components/Navbar";
import type { Category, Product } from "~/interface/index.interface";
import supabase from "~/lib/supabase";
import { FALL_BACK_IMAGE, WHATSAPP_NUMBER } from "~/constants/data";

export function meta({}: Route.MetaArgs) {
  return [
    {
      title:
        "New Arrivals - Custom-Made & Handcrafted Luxury Jewellery | Siarah",
    },
    {
      name: "description",
      content:
        "Discover freshly unveiled handcrafted jewellery from Siarah. Custom-made bespoke necklaces, new bridal harams, designer earrings, and masterfully crafted heirloom pieces made to order.",
    },
    {
      name: "keywords",
      content:
        "new arrivals jewellery, custom made new jewellery, bespoke new designs, latest handcrafted jewellery, newly unveiled bridal jewellery, fresh artisan jewellery, custom made gold finish jewellery, Siarah new arrivals, bespoke jewellery brand",
    },
    {
      property: "og:title",
      content:
        "New Arrivals - Custom-Made & Handcrafted Luxury Jewellery | Siarah",
    },
    {
      property: "og:description",
      content:
        "Discover freshly unveiled handcrafted jewellery from Siarah. Custom-made bespoke necklaces, new bridal harams, designer earrings, and masterfully crafted heirloom pieces made to order.",
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:site_name",
      content: "Siarah Luxury Jewellery",
    },
  ];
}

export type NewArrivalsLoaderData = {
  products: (Product & { categories?: Category | null })[];
  categories: Category[];
  whatsappNumber: string;
};

type SortOption =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Newest Arrivals" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "name-asc", label: "Name: A to Z" },
  { id: "name-desc", label: "Name: Z to A" },
];

export async function loader({}: Route.LoaderArgs): Promise<NewArrivalsLoaderData> {
  try {
    // 1. Fetch categories
    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    const categories = (catData || []) as Category[];

    // 2. Fetch products tagged as is_new = true
    const { data: taggedProducts } = await supabase
      .from("products")
      .select("*, categories(*)")
      .eq("published", true)
      .eq("is_new", true)
      .order("created_at", { ascending: false });

    let products = (taggedProducts || []) as unknown as (Product & {
      categories?: Category | null;
    })[];

    // 3. Fallback: If no products have been tagged is_new in the admin dashboard yet,
    // show the latest published products with the NEW tag so the page has fresh content
    if (products.length === 0) {
      const { data: latestProducts } = await supabase
        .from("products")
        .select("*, categories(*)")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(12);

      products = (
        (latestProducts || []) as unknown as (Product & {
          categories?: Category | null;
        })[]
      ).map((p) => ({
        ...p,
        is_new: true,
      }));
    }

    return {
      products,
      categories,
      whatsappNumber: WHATSAPP_NUMBER,
    };
  } catch (error) {
    console.error("Error loading new arrivals:", error);
    return {
      products: [],
      categories: [],
      whatsappNumber: WHATSAPP_NUMBER,
    };
  }
}

export default function NewArrivals({ loaderData }: Route.ComponentProps) {
  const {
    products = [],
    categories = [],
    whatsappNumber = WHATSAPP_NUMBER,
  } = (loaderData || {}) as NewArrivalsLoaderData;

  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state from URL or defaults
  const activeCategoryParam = searchParams.get("category") || "all";
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [onlyInStock, setOnlyInStock] = useState(
    searchParams.get("inStock") === "true",
  );
  const [sortOption, setSortOption] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "newest",
  );

  // Sort dropdown state
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Sync state with URL params
  const updateQueryParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all" || value === "newest" || value === "false") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const handleCategorySelect = (slug: string) => {
    updateQueryParam("category", slug === "all" ? null : slug);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateQueryParam("search", value.trim() ? value.trim() : null);
  };

  const handleInStockToggle = () => {
    const next = !onlyInStock;
    setOnlyInStock(next);
    updateQueryParam("inStock", next ? "true" : null);
  };

  const handleSortSelect = (id: SortOption) => {
    setSortOption(id);
    setIsSortOpen(false);
    updateQueryParam("sort", id === "newest" ? null : id);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setOnlyInStock(false);
    setSortOption("newest");
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Filtered & Sorted Products computation
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Filter by category
    if (activeCategoryParam !== "all") {
      result = result.filter((p) => {
        const catSlug = p.categories?.slug?.toLowerCase();
        const catId = p.category_id;
        const target = activeCategoryParam.toLowerCase();
        return catSlug === target || catId === target;
      });
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.categories?.name?.toLowerCase().includes(q),
      );
    }

    // 3. Filter by In Stock
    if (onlyInStock) {
      result = result.filter((p) => p.availability === "available");
    }

    // 4. Sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "newest":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    return result;
  }, [products, activeCategoryParam, searchQuery, onlyInStock, sortOption]);

  const hasActiveFilters =
    activeCategoryParam !== "all" ||
    searchQuery.trim() !== "" ||
    onlyInStock ||
    sortOption !== "newest";

  const generalWhatsAppMessage = encodeURIComponent(
    "Hi Siarah, I'm exploring your New Arrivals collection and would love to enquire about your newest jewellery pieces.",
  );
  const generalWhatsAppUrl = `https://wa.me/${whatsappNumber}?text=${generalWhatsAppMessage}`;

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans selection:bg-[#caa982] selection:text-white">
      <Navbar />

      <main className="flex-1">
        <section className="bg-linear-to-b from-white via-[#fcfbf9] to-white py-12 sm:py-16 border-t border-[#f2ede6]">
          <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-[#caa982] text-xs sm:text-[13px] font-medium tracking-[0.28em] uppercase mb-2.5 flex items-center gap-1.5 justify-center">
                <Sparkles size={11} />
                FRESHLY UNVEILED
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-[2.85rem] font-normal text-neutral-900 tracking-tight leading-tight">
                New Arrivals
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 font-light mt-3 max-w-md mx-auto leading-relaxed">
                Be the first to adorn yourself in our newest handcrafted
                creations, embodying timeless royal metallurgy and antique
                lustre.
              </p>
            </div>
          </div>
        </section>

        {categories.length > 0 && (
          <section className="bg-white border-b border-[#f0eae1] py-3.5 px-4 sm:px-6 lg:px-12 sticky top-0 z-30 shadow-2xs backdrop-blur-md">
            <div className="max-w-[92%] mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
              <button
                type="button"
                onClick={() => handleCategorySelect("all")}
                className={`shrink-0 px-3.5 py-1.5 text-xs uppercase tracking-[0.16em] font-medium transition-colors border cursor-pointer ${
                  activeCategoryParam === "all"
                    ? "bg-[#2b2621] text-[#fbf8f4] border-[#2b2621]"
                    : "bg-white text-neutral-600 border-[#e8dfd3] hover:text-neutral-950 hover:bg-[#faf8f5]"
                }`}
              >
                All Pieces ({products.length})
              </button>

              {categories.map((cat) => {
                const isSelected =
                  activeCategoryParam.toLowerCase() ===
                    cat.slug?.toLowerCase() ||
                  activeCategoryParam.toLowerCase() === cat.id.toLowerCase();

                // Count of new arrival products in this category
                const catCount = products.filter(
                  (p) =>
                    p.category_id === cat.id ||
                    p.categories?.slug?.toLowerCase() ===
                      cat.slug?.toLowerCase(),
                ).length;

                return (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => handleCategorySelect(cat.slug || cat.id)}
                    className={`shrink-0 px-3.5 py-1.5 text-xs uppercase tracking-[0.16em] font-medium transition-colors border cursor-pointer ${
                      isSelected
                        ? "bg-[#2b2621] text-[#fbf8f4] border-[#2b2621]"
                        : "bg-white text-neutral-600 border-[#e8dfd3] hover:text-neutral-950 hover:bg-[#faf8f5]"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {catCount > 0 && (
                      <span className="ml-1.5 text-[10px] opacity-70 font-normal">
                        ({catCount})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input Box */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search new arrivals..."
                className="w-full bg-[#faf8f5] border border-[#e8dfd3] focus:border-[#caa982] focus:bg-white pl-10 pr-9 py-2 text-xs sm:text-[13px] text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors rounded-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* In-Stock Toggle & Sort Dropdown */}
            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 self-end md:self-auto w-full md:w-auto justify-between md:justify-end">
              {/* In-Stock Filter Toggle */}
              <button
                type="button"
                onClick={handleInStockToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider transition-colors border rounded-xs cursor-pointer ${
                  onlyInStock
                    ? "bg-[#faf8f5] border-[#caa982] text-amber-950 font-medium"
                    : "bg-white border-[#e8dfd3] text-neutral-600 hover:text-neutral-900 hover:bg-[#faf8f5]"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    onlyInStock ? "bg-emerald-600" : "bg-neutral-300"
                  }`}
                />
                <span>In Stock Only</span>
              </button>

              {/* Sort Popover Dropdown */}
              <div className="relative" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={isSortOpen}
                  className="inline-flex items-center justify-between gap-2 bg-white border border-[#e8dfd3] px-3.5 py-2 text-xs sm:text-[13px] text-neutral-800 hover:border-[#caa982] transition-colors rounded-xs cursor-pointer min-w-42.5"
                >
                  <span className="text-neutral-500 font-light text-[11px] uppercase tracking-wider">
                    Sort:
                  </span>
                  <span className="font-medium truncate">
                    {SORT_OPTIONS.find((o) => o.id === sortOption)?.label}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-neutral-400 transition-transform duration-200 ${
                      isSortOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isSortOpen && (
                  <div
                    role="listbox"
                    className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-[#e8dfd3] shadow-xl shadow-black/8 z-50 py-1.5 max-h-80 overflow-y-auto"
                  >
                    {SORT_OPTIONS.map((opt) => {
                      const isSelected = sortOption === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSortSelect(opt.id)}
                          className={`w-full text-left px-4 py-2.5 text-xs sm:text-[13px] tracking-wide flex items-center justify-between transition-colors ${
                            isSelected
                              ? "bg-[#faf8f5] text-amber-950 font-medium"
                              : "text-neutral-700 hover:bg-[#fcfbf9] hover:text-neutral-950"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && (
                            <Check
                              size={14}
                              className="text-[#caa982]"
                              strokeWidth={2}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Indicators Bar */}
          <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#f2ede6] pb-3 text-xs sm:text-[13px]">
            <div className="flex items-center gap-2 text-neutral-600 font-light">
              <span className="font-medium text-neutral-900">
                {filteredProducts.length}
              </span>
              <span>
                {filteredProducts.length === 1 ? "piece" : "pieces"} in{" "}
                <strong className="font-medium text-neutral-800">
                  {activeCategoryParam === "all"
                    ? "New Arrivals"
                    : categories.find(
                        (c) =>
                          c.slug?.toLowerCase() ===
                            activeCategoryParam.toLowerCase() ||
                          c.id.toLowerCase() ===
                            activeCategoryParam.toLowerCase(),
                      )?.name || activeCategoryParam}
                </strong>
              </span>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {activeCategoryParam !== "all" && (
                  <span className="inline-flex items-center gap-1.5 bg-[#faf8f5] border border-[#e8dfd3] text-neutral-800 px-2.5 py-1 text-xs">
                    <span className="text-neutral-400 text-[11px] uppercase tracking-wider">
                      Category:
                    </span>
                    <span className="font-medium">
                      {categories.find(
                        (c) =>
                          c.slug?.toLowerCase() ===
                            activeCategoryParam.toLowerCase() ||
                          c.id.toLowerCase() ===
                            activeCategoryParam.toLowerCase(),
                      )?.name || activeCategoryParam}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect("all")}
                      className="text-neutral-400 hover:text-neutral-900 ml-0.5"
                      aria-label="Remove category filter"
                    >
                      <X size={13} />
                    </button>
                  </span>
                )}

                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1.5 bg-[#faf8f5] border border-[#e8dfd3] text-neutral-800 px-2.5 py-1 text-xs">
                    <span className="text-neutral-400 text-[11px] uppercase tracking-wider">
                      Search:
                    </span>
                    <span className="font-medium">"{searchQuery.trim()}"</span>
                    <button
                      type="button"
                      onClick={() => handleSearchChange("")}
                      className="text-neutral-400 hover:text-neutral-900 ml-0.5"
                      aria-label="Remove search filter"
                    >
                      <X size={13} />
                    </button>
                  </span>
                )}

                {onlyInStock && (
                  <span className="inline-flex items-center gap-1.5 bg-[#faf8f5] border border-[#e8dfd3] text-neutral-800 px-2.5 py-1 text-xs">
                    <span className="font-medium">In Stock Only</span>
                    <button
                      type="button"
                      onClick={handleInStockToggle}
                      className="text-neutral-400 hover:text-neutral-900 ml-0.5"
                      aria-label="Remove in-stock filter"
                    >
                      <X size={13} />
                    </button>
                  </span>
                )}

                {sortOption !== "newest" && (
                  <span className="inline-flex items-center gap-1.5 bg-[#faf8f5] border border-[#e8dfd3] text-neutral-800 px-2.5 py-1 text-xs">
                    <span className="text-neutral-400 text-[11px] uppercase tracking-wider">
                      Sort:
                    </span>
                    <span className="font-medium">
                      {SORT_OPTIONS.find((o) => o.id === sortOption)?.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSortSelect("newest")}
                      className="text-neutral-400 hover:text-neutral-900 ml-0.5"
                      aria-label="Reset sort"
                    >
                      <X size={13} />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-neutral-500 hover:text-neutral-950 underline underline-offset-4 transition-colors ml-1 cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Clear all</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* PRODUCTS GRID SECTION                                     */}
        {/* ========================================================= */}
        <section className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-10 pb-20 sm:pb-24">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
              {filteredProducts.map((product) => {
                const imageUrl =
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : FALL_BACK_IMAGE;

                const isOnSale = Boolean(
                  product.original_price &&
                  product.original_price > product.price,
                );

                const discountPercentage =
                  isOnSale && product.original_price
                    ? Math.round(
                        ((product.original_price - product.price) /
                          product.original_price) *
                          100,
                      )
                    : 0;

                const skuPart =
                  product.sku && product.sku.trim()
                    ? ` (SKU: ${product.sku.trim()})`
                    : "";

                const productCategoryName =
                  product.categories?.name || "New Arrival";

                const productEnquiryMessage = encodeURIComponent(
                  `Hi Siarah, I would like to enquire about / order the new arrival "${product.name}"${skuPart} (Price: ₹${product.price.toLocaleString("en-IN")}).`,
                );
                const productWhatsAppUrl = `https://wa.me/${whatsappNumber}?text=${productEnquiryMessage}`;

                return (
                  <div
                    key={product.id || product.slug}
                    className="group flex flex-col justify-between bg-white border border-[#f0eae1] hover:border-[#caa982] transition-all duration-300 hover:shadow-md"
                  >
                    <div>
                      {/* Product Image Frame */}
                      <Link
                        to={`/product/${product.slug || product.id}`}
                        className="relative block aspect-4/5 w-full overflow-hidden bg-[#faf8f5] focus:outline-none"
                      >
                        <img
                          src={imageUrl}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 select-none"
                        />

                        {/* Top Badges (NEW tag prominently displayed) */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                          <span className="bg-[#141210] text-[#ded7ce] text-[10px] tracking-[0.22em] uppercase font-medium px-2.5 py-1 shadow-sm flex items-center gap-1">
                            <Sparkles size={10} className="text-[#caa982]" />
                            <span>NEW</span>
                          </span>

                          {isOnSale && (
                            <span className="bg-[#8b261e] text-white text-[10px] tracking-[0.18em] uppercase font-medium px-2 py-0.5 shadow-sm">
                              {discountPercentage}% OFF
                            </span>
                          )}

                          {product.is_bestseller && (
                            <span className="bg-[#caa982] text-white text-[10px] tracking-[0.18em] uppercase font-medium px-2 py-0.5 shadow-sm">
                              BESTSELLER
                            </span>
                          )}
                        </div>

                        {/* Out of Stock Overlay */}
                        {product.availability === "out_of_stock" && (
                          <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex items-center justify-center">
                            <span className="bg-neutral-900 text-white text-[11px] tracking-[0.2em] uppercase px-3 py-1 font-medium">
                              Made to Order
                            </span>
                          </div>
                        )}
                      </Link>

                      {/* Details Area */}
                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] tracking-[0.22em] uppercase text-[#caa982] font-medium">
                            {productCategoryName}
                          </span>
                          {product.sku && product.sku.trim() && (
                            <span className="text-[10px] font-mono text-neutral-400">
                              {product.sku.trim()}
                            </span>
                          )}
                        </div>

                        <Link
                          to={`/product/${product.slug || product.id}`}
                          className="block font-serif text-sm sm:text-[15px] font-normal text-neutral-900 tracking-wide hover:text-[#b59871] transition-colors line-clamp-1"
                        >
                          {product.name}
                        </Link>

                        <div className="flex items-baseline gap-2 pt-0.5">
                          <span className="text-sm font-medium text-neutral-900">
                            ₹{product.price.toLocaleString("en-IN")}
                          </span>
                          {isOnSale && product.original_price && (
                            <span className="text-xs font-light text-neutral-400 line-through">
                              ₹{product.original_price.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Quick Actions */}
                    <div className="px-4 pb-4 pt-1 flex items-center gap-2 border-t border-[#f7f4ef]">
                      <Link
                        to={`/product/${product.slug || product.id}`}
                        className="flex-1 py-2 text-center text-[11px] uppercase tracking-[0.18em] font-medium text-neutral-800 bg-[#faf8f5] hover:bg-[#f2ede6] transition-colors border border-[#e8dfd3]"
                      >
                        View Piece
                      </Link>

                      <a
                        href={productWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Enquire about ${product.name} on WhatsApp`}
                        className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-colors shrink-0"
                        title="Enquire on WhatsApp"
                      >
                        <MessageCircle size={15} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 sm:py-20 px-6 max-w-lg mx-auto border border-[#e8dfd3] bg-[#fcfbf9] my-6">
              <div className="w-12 h-12 rounded-full bg-[#f4ede4] text-[#caa982] flex items-center justify-center mx-auto mb-4">
                <Sparkles size={22} strokeWidth={1.5} />
              </div>

              <h2 className="font-serif text-2xl sm:text-[1.75rem] font-normal text-neutral-900 mb-2">
                No matching new arrivals found
              </h2>

              <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed mb-6 max-w-sm mx-auto">
                {searchQuery.trim()
                  ? `No new arrivals found matching "${searchQuery.trim()}". Try adjusting your keywords or clearing your active filters.`
                  : "No new arrivals match your active filter criteria. Clear your filters or explore our full boutique collection."}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 bg-[#3d3731] text-[#ded7ce] hover:text-white px-5 py-2.5 text-xs tracking-[0.2em] font-medium uppercase transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reset filters</span>
                  </button>
                )}

                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 text-xs tracking-[0.2em] font-medium uppercase transition-colors"
                >
                  <span>Explore All Pieces</span>
                  <ArrowRight size={13} />
                </Link>

                <a
                  href={generalWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fae53] text-white px-5 py-2.5 text-xs tracking-[0.2em] font-medium uppercase transition-colors"
                >
                  <MessageCircle size={14} />
                  <span>Bespoke Enquiry</span>
                </a>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
