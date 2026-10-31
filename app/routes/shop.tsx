import {
  Check,
  ChevronDown,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/shop";
import Footer from "~/components/Footer";
import Navbar from "~/components/Navbar";
import type { Category, Product } from "~/interface/index.interface";
import supabase from "~/lib/supabase";
import { FALL_BACK_IMAGE } from "~/constants/data";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Shop Handcrafted & Custom-Made Jewellery | Siarah Collection" },
    {
      name: "description",
      content:
        "Explore Siarah's exclusive catalogue of handcrafted and custom-made jewellery. Bespoke necklaces, bridal harams, antique gold polish earrings, artisan bangles, and heirloom ornaments made to order.",
    },
    {
      name: "keywords",
      content:
        "shop custom jewellery, buy handcrafted jewellery online, custom made necklaces, bespoke bridal jewellery, antique gold finish earrings, artisan bangles, handcrafted harams, luxury Indian jewellery, made to order jewellery, bespoke ornaments, Siarah shop",
    },
    {
      property: "og:title",
      content: "Shop Handcrafted & Custom-Made Jewellery | Siarah Collection",
    },
    {
      property: "og:description",
      content:
        "Explore Siarah's exclusive catalogue of handcrafted and custom-made jewellery. Bespoke necklaces, bridal harams, antique gold polish earrings, and artisan bangles made to order.",
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

type SortOption =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest Arrivals" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "name-asc", label: "Name: A to Z" },
  { id: "name-desc", label: "Name: Z to A" },
];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || "",
  );
  const selectedCategoryParam = searchParams.get("category") || "all";
  const [sortOption, setSortOption] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "featured",
  );

  // Dropdown Open States
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Dropdown Refs for Click Outside
  const categoryRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCategoryOpen(false);
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

  // Fetch Categories & Products from Supabase
  useEffect(() => {
    async function loadShopData() {
      setIsLoading(true);
      try {
        // Fetch Categories
        const { data: catData, error: catError } = await supabase
          .from("categories")
          .select("*")
          .eq("active", true)
          .order("sort_order", { ascending: true });

        if (!catError && catData && catData.length > 0) {
          setCategories(catData as unknown as Category[]);
        } else {
          setCategories([]);
        }

        // Fetch Products
        const { data: prodData, error: prodError } = await supabase
          .from("products")
          .select("*")
          .eq("published", true)
          .order("created_at", { ascending: false });

        if (!prodError && prodData) {
          setProducts(prodData as unknown as Product[]);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Error loading shop data:", err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadShopData();
  }, []);

  // Update Category in URL search params
  const handleCategorySelect = (categorySlugOrId: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (categorySlugOrId === "all") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", categorySlugOrId);
    }
    setSearchParams(nextParams, { replace: true });
    setIsCategoryOpen(false);
  };

  // Update Sort in URL search params
  const handleSortSelect = (option: SortOption) => {
    setSortOption(option);
    const nextParams = new URLSearchParams(searchParams);
    if (option === "featured") {
      nextParams.delete("sort");
    } else {
      nextParams.set("sort", option);
    }
    setSearchParams(nextParams, { replace: true });
    setIsSortOpen(false);
  };

  // Clear all filters
  const handleClearAll = () => {
    setSearchQuery("");
    const nextParams = new URLSearchParams();
    setSearchParams(nextParams, { replace: true });
  };

  // Find active category object
  const activeCategory = useMemo(() => {
    if (selectedCategoryParam === "all") return null;
    return (
      categories.find(
        (c) =>
          c.slug.toLowerCase() === selectedCategoryParam.toLowerCase() ||
          c.id === selectedCategoryParam,
      ) || null
    );
  }, [categories, selectedCategoryParam]);

  // Active sort label
  const activeSortLabel = useMemo(() => {
    const match = SORT_OPTIONS.find((s) => s.id === sortOption);
    return match ? match.label : "Featured";
  }, [sortOption]);

  // Compute item counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    categories.forEach((cat) => {
      counts[cat.id] = products.filter((p) => p.category_id === cat.id).length;
    });
    return counts;
  }, [categories, products]);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // 1. Category Filter
        if (activeCategory) {
          if (product.category_id !== activeCategory.id) {
            return false;
          }
        }

        // 2. Search Query Filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const nameMatch = product.name?.toLowerCase().includes(query);
          const descMatch = product.description?.toLowerCase().includes(query);
          const specMatch = product.specifications
            ?.toLowerCase()
            .includes(query);
          const skuMatch = product.sku?.toLowerCase().includes(query);
          if (!nameMatch && !descMatch && !specMatch && !skuMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case "newest":
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          case "price-asc":
            return a.price - b.price;
          case "price-desc":
            return b.price - a.price;
          case "name-asc":
            return a.name.localeCompare(b.name);
          case "name-desc":
            return b.name.localeCompare(a.name);
          case "featured":
          default:
            // Featured items first, then newer items
            if (a.is_featured && !b.is_featured) return -1;
            if (!a.is_featured && b.is_featured) return 1;
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
        }
      });
  }, [products, activeCategory, searchQuery, sortOption]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedCategoryParam !== "all";

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* Editorial Collection Header */}
        <section className="bg-linear-to-b from-white via-[#fcfbf9] to-white py-12 sm:py-16 border-t border-[#f2ede6]">
          <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-[#caa982] text-xs sm:text-[13px] font-medium tracking-[0.28em] uppercase mb-2.5">
                {activeCategory ? activeCategory.name : "THE COLLECTION"}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-[2.85rem] font-normal text-neutral-900 tracking-tight leading-tight">
                {activeCategory
                  ? `Discover handcrafted ${activeCategory.name.toLowerCase()}`
                  : "Discover the latest collection from Siarah"}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 font-light mt-3 max-w-md mx-auto leading-relaxed">
                {activeCategory
                  ? `Curated ${activeCategory.name.toLowerCase()} crafted to reflect pure heritage and contemporary sophistication.`
                  : "Discover our latest collection of jewellery, inspired by the beauty of nature and designed to complement your natural elegance."}
              </p>
            </div>
          </div>
        </section>

        {/* Filter Controls Bar */}
        <section className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-10 mb-8 sm:mb-12">
          {/* Main Controls Wrapper */}
          <div className="bg-[#faf8f5]/90 border border-[#eee7dd] p-3 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            {/* Search Input Box */}
            <div className="relative flex-1 w-full md:max-w-md">
              <div className="relative flex items-center bg-white border border-[#e8dfd3] focus-within:border-[#caa982] focus-within:ring-2 focus-within:ring-[#caa982]/20 transition-all">
                <Search
                  size={17}
                  className="text-neutral-400 shrink-0 ml-3.5 mr-2.5 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jewellery, haram, necklace, gold..."
                  className="w-full bg-transparent text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 placeholder:font-light outline-none tracking-wide py-2.5 sm:py-3 pr-8"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 text-neutral-400 hover:text-neutral-800 p-1 transition-colors"
                    aria-label="Clear search text"
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>

            {/* Dropdowns Row */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
              {/* Category Dropdown */}
              <div className="relative flex-1 sm:flex-none" ref={categoryRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryOpen(!isCategoryOpen);
                    setIsSortOpen(false);
                  }}
                  aria-expanded={isCategoryOpen}
                  aria-haspopup="listbox"
                  className={`w-full sm:w-auto min-w-42.5 sm:min-w-48.75 flex items-center justify-between gap-3 bg-white border text-xs sm:text-[13px] tracking-wider uppercase font-medium px-4 py-2.5 sm:py-3 transition-all cursor-pointer select-none ${
                    isCategoryOpen || activeCategory
                      ? "border-[#caa982] text-neutral-950 shadow-xs"
                      : "border-[#e8dfd3] hover:border-[#caa982] text-neutral-800"
                  }`}
                >
                  <span className="truncate">
                    {activeCategory ? activeCategory.name : "All Categories"}
                  </span>
                  <ChevronDown
                    size={15}
                    strokeWidth={1.75}
                    className={`text-neutral-400 transition-transform duration-200 shrink-0 ${
                      isCategoryOpen ? "rotate-180 text-[#caa982]" : ""
                    }`}
                  />
                </button>

                {/* Category Popover Menu */}
                {isCategoryOpen && (
                  <div
                    role="listbox"
                    className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-full sm:w-64 bg-white border border-[#e8dfd3] shadow-xl shadow-black/8 z-50 py-1.5 divide-y divide-[#faf6f0] max-h-80 overflow-y-auto"
                  >
                    {/* All Categories Option */}
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedCategoryParam === "all"}
                      onClick={() => handleCategorySelect("all")}
                      className={`w-full text-left px-4 py-2.5 text-xs sm:text-[13px] tracking-wide flex items-center justify-between transition-colors ${
                        selectedCategoryParam === "all"
                          ? "bg-[#faf8f5] text-amber-950 font-medium"
                          : "text-neutral-700 hover:bg-[#fcfbf9] hover:text-neutral-950"
                      }`}
                    >
                      <span className="uppercase tracking-wider">
                        All Categories
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-neutral-400 font-light">
                          {products.length}
                        </span>
                        {selectedCategoryParam === "all" && (
                          <Check
                            size={14}
                            className="text-[#caa982]"
                            strokeWidth={2}
                          />
                        )}
                      </div>
                    </button>

                    {/* Dynamic Categories */}
                    <div className="py-1">
                      {categories.map((cat) => {
                        const isSelected =
                          activeCategory?.id === cat.id ||
                          activeCategory?.slug === cat.slug;
                        const count = categoryCounts[cat.id] ?? 0;

                        return (
                          <button
                            key={cat.id || cat.slug}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() =>
                              handleCategorySelect(cat.slug || cat.id)
                            }
                            className={`w-full text-left px-4 py-2.5 text-xs sm:text-[13px] tracking-wide flex items-center justify-between transition-colors ${
                              isSelected
                                ? "bg-[#faf8f5] text-amber-950 font-medium"
                                : "text-neutral-700 hover:bg-[#fcfbf9] hover:text-neutral-950"
                            }`}
                          >
                            <span className="truncate">{cat.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-neutral-400 font-light">
                                {count}
                              </span>
                              {isSelected && (
                                <Check
                                  size={14}
                                  className="text-[#caa982]"
                                  strokeWidth={2}
                                />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="relative flex-1 sm:flex-none" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSortOpen(!isSortOpen);
                    setIsCategoryOpen(false);
                  }}
                  aria-expanded={isSortOpen}
                  aria-haspopup="listbox"
                  className={`w-full sm:w-auto min-w-43.75 sm:min-w-48.75 flex items-center justify-between gap-3 bg-white border text-xs sm:text-[13px] tracking-wider uppercase font-medium px-4 py-2.5 sm:py-3 transition-all cursor-pointer select-none ${
                    isSortOpen || sortOption !== "featured"
                      ? "border-[#caa982] text-neutral-950 shadow-xs"
                      : "border-[#e8dfd3] hover:border-[#caa982] text-neutral-800"
                  }`}
                >
                  <span className="truncate">Sort: {activeSortLabel}</span>
                  <ChevronDown
                    size={15}
                    strokeWidth={1.75}
                    className={`text-neutral-400 transition-transform duration-200 shrink-0 ${
                      isSortOpen ? "rotate-180 text-[#caa982]" : ""
                    }`}
                  />
                </button>

                {/* Sort Popover Menu */}
                {isSortOpen && (
                  <div
                    role="listbox"
                    className="absolute right-0 top-full mt-1.5 w-full sm:w-56 bg-white border border-[#e8dfd3] shadow-xl shadow-black/8 z-50 py-1.5 max-h-80 overflow-y-auto"
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

          {/* Active Filter Indicators & Results Count */}
          <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#f2ede6] pb-3 text-xs sm:text-[13px]">
            <div className="flex items-center gap-2 text-neutral-600 font-light">
              <span className="font-medium text-neutral-900">
                {filteredProducts.length}
              </span>
              <span>
                {filteredProducts.length === 1 ? "piece" : "pieces"} found
              </span>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {activeCategory && (
                  <span className="inline-flex items-center gap-1.5 bg-[#faf8f5] border border-[#e8dfd3] text-neutral-800 px-2.5 py-1 text-xs">
                    <span className="text-neutral-400 text-[11px] uppercase tracking-wider">
                      Category:
                    </span>
                    <span className="font-medium">{activeCategory.name}</span>
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
                      Query:
                    </span>
                    <span className="font-medium">"{searchQuery.trim()}"</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-neutral-400 hover:text-neutral-900 ml-0.5"
                      aria-label="Remove search query"
                    >
                      <X size={13} />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-neutral-500 hover:text-neutral-950 underline underline-offset-4 transition-colors ml-1"
                >
                  <RotateCcw size={11} />
                  Clear all
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Product Grid Section */}
        <section className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-10 pb-20 sm:pb-24">
          {isLoading ? (
            /* Shimmer Loading Skeleton */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-3.5">
                  <div className="aspect-4/5 w-full bg-neutral-100" />
                  <div className="h-4 bg-neutral-100 w-3/4" />
                  <div className="h-3.5 bg-neutral-100 w-1/3" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            /* Product Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
              {filteredProducts.map((product) => {
                const imageUrl =
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : FALL_BACK_IMAGE;

                const isOnSale =
                  product.original_price &&
                  product.original_price > product.price;

                const discountPercentage = isOnSale
                  ? Math.round(
                      ((product.original_price! - product.price) /
                        product.original_price!) *
                        100,
                    )
                  : 0;

                const productCategory = categories.find(
                  (c) => c.id === product.category_id,
                );

                return (
                  <div
                    key={product.id || product.slug}
                    className="group flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Image Frame */}
                      <Link
                        to={`/product/${product.slug || product.id}`}
                        className="relative block aspect-4/5 w-full overflow-hidden bg-neutral-100 focus:outline-none"
                      >
                        <img
                          src={imageUrl}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 select-none"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                          {product.is_new && (
                            <span className="bg-[#141210] text-[#caa982] text-[10px] tracking-[0.2em] uppercase font-medium px-2 py-0.5 shadow-sm">
                              NEW
                            </span>
                          )}
                          {isOnSale && (
                            <span className="bg-[#caa982] text-white text-[10px] tracking-[0.18em] uppercase font-medium px-2 py-0.5 shadow-sm">
                              {discountPercentage}% OFF
                            </span>
                          )}
                          {product.is_bestseller && (
                            <span className="bg-white/95 text-neutral-800 text-[10px] tracking-[0.18em] uppercase font-medium px-2 py-0.5 border border-[#eee7dd] shadow-sm">
                              BESTSELLER
                            </span>
                          )}
                        </div>

                        {/* Out of Stock Overlay */}
                        {product.availability === "out_of_stock" && (
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                            <span className="bg-neutral-900 text-white text-[11px] tracking-[0.2em] uppercase px-3 py-1 font-medium">
                              SOLD OUT
                            </span>
                          </div>
                        )}
                      </Link>

                      {/* Details */}
                      <div className="mt-3.5 space-y-1">
                        {productCategory && (
                          <p className="text-[10px] tracking-[0.22em] uppercase text-[#caa982] font-medium">
                            {productCategory.name}
                          </p>
                        )}

                        <Link
                          to={`/product/${product.slug || product.id}`}
                          className="block font-serif text-sm sm:text-[15px] font-normal text-neutral-900 tracking-wide group-hover:text-amber-900 transition-colors line-clamp-1"
                        >
                          {product.name}
                        </Link>

                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-xs sm:text-sm font-medium text-neutral-900">
                            ₹{product.price.toLocaleString("en-IN")}
                          </span>
                          {isOnSale && (
                            <span className="text-xs sm:text-[13px] font-normal text-neutral-400 line-through">
                              ₹{product.original_price?.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Elegant Empty State */
            <div className="text-center py-16 sm:py-20 px-6 max-w-lg mx-auto border border-[#e8dfd3] bg-[#fcfbf9] my-6">
              <div className="w-12 h-12 rounded-full bg-[#f4ede4] text-[#caa982] flex items-center justify-center mx-auto mb-4">
                <Sparkles size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-2xl sm:text-[1.75rem] font-normal text-neutral-900 mb-2">
                {products.length === 0
                  ? "Collection Coming Soon"
                  : "No jewellery found"}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed mb-6 max-w-sm mx-auto">
                {products.length === 0
                  ? "Our jewellery collection is currently being updated. Please check back shortly or enquire with us on WhatsApp for bespoke pieces."
                  : activeCategory && searchQuery.trim()
                    ? `No pieces found in "${activeCategory.name}" matching "${searchQuery.trim()}". Try refining your search or clearing filters.`
                    : activeCategory
                      ? `No pieces currently listed under "${activeCategory.name}". Explore another category or reset filters.`
                      : searchQuery.trim()
                        ? `No jewellery matching "${searchQuery.trim()}" found. Try searching with different keywords.`
                        : "We couldn't find any pieces matching your current filters."}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex items-center gap-2 bg-[#141210] text-[#ded7ce] hover:text-white px-5 py-2.5 text-xs tracking-[0.2em] font-medium uppercase transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reset all filters</span>
                  </button>
                )}
                {activeCategory && (
                  <button
                    type="button"
                    onClick={() => handleCategorySelect("all")}
                    className="inline-flex items-center gap-2 border border-neutral-300 hover:border-neutral-900 text-neutral-800 hover:text-neutral-950 px-5 py-2.5 text-xs tracking-[0.2em] font-medium uppercase transition-colors cursor-pointer"
                  >
                    <span>View all categories</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
