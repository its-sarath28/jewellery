import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/category";
import Footer from "~/components/Footer";
import Navbar from "~/components/Navbar";
import type { Category, Product } from "~/interface/index.interface";
import supabase from "~/lib/supabase";
import { FALL_BACK_IMAGE, WHATSAPP_NUMBER } from "~/constants/data";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData?.category) {
    return [
      { title: "Category Not Found - Siarah Luxury Jewellery" },
      {
        name: "description",
        content:
          "Explore bespoke handcrafted and custom-made luxury jewellery collections from Siarah.",
      },
      {
        name: "keywords",
        content:
          "custom made jewellery, bespoke jewellery, handcrafted luxury jewellery, made to order jewellery, Siarah",
      },
    ];
  }

  const categoryName = loaderData.category.name;
  const categoryLower = categoryName.toLowerCase();

  return [
    {
      title: `${categoryName} - Handcrafted & Custom-Made Luxury Jewellery | Siarah`,
    },
    {
      name: "description",
      content: `Explore bespoke handcrafted ${categoryLower} by Siarah. Custom-made royal heirloom designs, antique gold polish, and artisan bridal ${categoryLower} tailored to your personal style.`,
    },
    {
      name: "keywords",
      content: `custom made ${categoryLower}, bespoke ${categoryLower}, handcrafted ${categoryLower}, custom ${categoryLower} designs, luxury ${categoryLower}, bridal ${categoryLower}, artisan ${categoryLower}, antique gold ${categoryLower}, made to order ${categoryLower}, Siarah ${categoryLower}, bespoke jewellery`,
    },
    {
      property: "og:title",
      content: `${categoryName} - Handcrafted & Custom-Made Luxury Jewellery | Siarah`,
    },
    {
      property: "og:description",
      content: `Explore bespoke handcrafted ${categoryLower} by Siarah. Custom-made royal heirloom designs, antique gold polish, and artisan bridal ${categoryLower}.`,
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:site_name",
      content: "Siarah Luxury Jewellery",
    },
    ...(loaderData.category.image_url
      ? [{ property: "og:image", content: loaderData.category.image_url }]
      : []),
  ];
}

export type CategoryLoaderData = {
  category: Category | null;
  products: Product[];
  categories: Category[];
  whatsappNumber: string;
};

const CATEGORY_EDITORIAL_DESCRIPTIONS: Record<string, string> = {
  necklaces:
    "Adorn yourself in timeless regal splendour. From heritage harams to intricately studded chokers, explore heirloom necklaces crafted with master metallurgy and antique gold lustre.",
  earrings:
    "Frame your face with breathtaking radiance. Discover traditional jhumkas, modern studs, and regal chandbalis handset with authentic stones and lustrous pearls.",
  bangles:
    "Grace your wrists with exquisite craftsmanship. Classic kadas, temple bangles, and delicate daily wear bracelets hand-finished to perfection.",
  "traditional-jewellery":
    "Preserving generational art forms. Authentic South Indian temple motifs, divine carvings, and antique handcrafted masterpieces designed for weddings and festivities.",
  "daily-wear":
    "Understated luxury for your everyday moments. Lightweight, comfortable, and skin-safe pieces crafted to bring effortless charm to daily life.",
};

export async function loader({
  params,
}: Route.LoaderArgs): Promise<CategoryLoaderData> {
  const slug = params.slug?.trim();
  if (!slug) {
    return {
      category: null,
      products: [],
      categories: [],
      whatsappNumber: WHATSAPP_NUMBER,
    };
  }

  try {
    // 1. Try finding category by slug (case-insensitive)
    let { data: category } = await supabase
      .from("categories")
      .select("*")
      .ilike("slug", slug)
      .maybeSingle();

    // 2. Fallback to finding by id
    if (!category) {
      const res = await supabase
        .from("categories")
        .select("*")
        .eq("id", slug)
        .maybeSingle();
      category = res.data;
    }

    // 3. Fallback to finding by name (case-insensitive)
    if (!category) {
      const res = await supabase
        .from("categories")
        .select("*")
        .ilike("name", slug.replace(/-/g, " "))
        .maybeSingle();
      category = res.data;
    }

    const currentCategory = category as unknown as Category | null;

    // 4. Fetch products for this category
    let products: Product[] = [];
    if (currentCategory) {
      const { data: prodData } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", currentCategory.id)
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (prodData) {
        products = prodData as unknown as Product[];
      }
    }

    // 5. Fetch all active categories for category pills / switcher
    let allCategories: Category[] = [];
    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (catData && catData.length > 0) {
      allCategories = catData as unknown as Category[];
    }

    // 6. Fetch whatsapp_number from site_settings
    let whatsappNumber = WHATSAPP_NUMBER;
    try {
      const res = (await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle()) as { data: { value: string } | null };
      if (res?.data?.value && res.data.value.trim()) {
        whatsappNumber = res.data.value.trim();
      }
    } catch {
      // fallback
    }

    return {
      category: currentCategory,
      products,
      categories: allCategories,
      whatsappNumber,
    };
  } catch (err) {
    console.error("Error loading category page in loader:", err);
    return {
      category: null,
      products: [],
      categories: [],
      whatsappNumber: WHATSAPP_NUMBER,
    };
  }
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

export default function CategoryPage({ loaderData }: Route.ComponentProps) {
  const {
    category,
    products,
    categories,
    whatsappNumber = WHATSAPP_NUMBER,
  } = loaderData;

  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [sortOption, setSortOption] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "featured",
  );
  const [onlyInStock, setOnlyInStock] = useState<boolean>(
    searchParams.get("in_stock") === "true",
  );

  // Sort dropdown open state
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape
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

  // Sync state to URL search parameters
  const updateUrlParams = (
    newSearch: string,
    newSort: SortOption,
    newInStock: boolean,
  ) => {
    const params = new URLSearchParams();
    if (newSearch.trim()) params.set("search", newSearch.trim());
    if (newSort !== "featured") params.set("sort", newSort);
    if (newInStock) params.set("in_stock", "true");
    setSearchParams(params, { replace: true });
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    updateUrlParams(val, sortOption, onlyInStock);
  };

  const handleSortSelect = (sort: SortOption) => {
    setSortOption(sort);
    setIsSortOpen(false);
    updateUrlParams(searchQuery, sort, onlyInStock);
  };

  const handleInStockToggle = () => {
    const nextVal = !onlyInStock;
    setOnlyInStock(nextVal);
    updateUrlParams(searchQuery, sortOption, nextVal);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSortOption("featured");
    setOnlyInStock(false);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Filtered and Sorted Products computation
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)),
      );
    }

    // Availability filter
    if (onlyInStock) {
      result = result.filter((p) => p.availability !== "out_of_stock");
    }

    // Sorting
    switch (sortOption) {
      case "newest":
        return result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      case "price-asc":
        return result.sort((a, b) => a.price - b.price);
      case "price-desc":
        return result.sort((a, b) => b.price - a.price);
      case "name-asc":
        return result.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return result.sort((a, b) => b.name.localeCompare(a.name));
      case "featured":
      default:
        return result.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          if (a.is_bestseller && !b.is_bestseller) return -1;
          if (!a.is_bestseller && b.is_bestseller) return 1;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
    }
  }, [products, searchQuery, sortOption, onlyInStock]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || sortOption !== "featured" || onlyInStock,
  );

  // If Category Not Found State
  if (!category) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] text-neutral-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-lg mx-auto border border-[#e8dfd3] bg-[#fcfbf9] p-8 sm:p-12 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#f4ede4] text-[#caa982] flex items-center justify-center mx-auto mb-4">
              <Sparkles size={22} strokeWidth={1.5} />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-neutral-900 mb-2">
              Category Not Found
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed mb-6">
              The jewellery category you are looking for may have been updated,
              renamed, or is currently unavailable.
            </p>

            {categories.length > 0 && (
              <div className="mb-6 pt-2 border-t border-[#f0eae1]">
                <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#caa982] mb-3">
                  Browse Popular Categories
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {categories.slice(0, 5).map((cat) => (
                    <Link
                      key={cat.id || cat.slug}
                      to={`/category/${cat.slug || cat.id}`}
                      className="px-3 py-1.5 bg-white hover:bg-[#faf8f5] border border-[#e8dfd3] text-xs text-neutral-700 hover:text-neutral-950 transition-colors uppercase tracking-wider"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#3d3731] hover:bg-[#231f1c] text-[#ded7ce] hover:text-white px-6 py-3 text-xs tracking-[0.2em] font-medium uppercase transition-colors"
            >
              <span>Explore All Pieces</span>
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Editorial description for category
  const editorialDescription =
    CATEGORY_EDITORIAL_DESCRIPTIONS[category.slug?.toLowerCase() || ""] ||
    `Explore our signature collection of handcrafted ${category.name.toLowerCase()}, designed with timeless royal heritage, antique micro gold plating, and artisanal precision.`;

  // WhatsApp concierge enquiry URL for category
  const categoryWhatsAppMessage = encodeURIComponent(
    `Hi Siarah, I'm exploring the "${category.name}" collection on your website and would like styling assistance or a video view of available pieces.`,
  );
  const categoryWhatsAppUrl = `https://wa.me/${whatsappNumber}?text=${categoryWhatsAppMessage}`;

  return (
    <div className="min-h-screen bg-[#fdfcfb] text-neutral-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="border-b border-[#f0eae1] bg-white py-3 px-4 sm:px-6 lg:px-12 text-xs text-neutral-500 font-light"
        >
          <div className="max-w-[92%] mx-auto flex items-center flex-wrap gap-1.5 sm:gap-2">
            <Link
              to="/"
              className="hover:text-neutral-900 transition-colors uppercase tracking-[0.16em] text-[11px]"
            >
              Home
            </Link>
            <ChevronRight size={12} className="text-neutral-300 shrink-0" />
            <Link
              to="/shop"
              className="hover:text-neutral-900 transition-colors uppercase tracking-[0.16em] text-[11px]"
            >
              Collection
            </Link>
            <ChevronRight size={12} className="text-neutral-300 shrink-0" />
            <span className="text-neutral-900 font-medium uppercase tracking-[0.16em] text-[11px]">
              {category.name}
            </span>
          </div>
        </nav>

        {/* Category Header Banner */}
        <header className="bg-linear-to-b from-[#faf8f5] to-white border-b border-[#f0eae1] py-6 sm:py-8 text-center">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-[#e8dfd3] shadow-2xs mb-2">
              <Sparkles size={11} className="text-[#caa982]" />
              <span className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#caa982]">
                Curated Collection
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-neutral-900 tracking-tight leading-tight mb-1.5">
              {category.name}
            </h1>

            <p className="text-neutral-500 text-xs sm:text-[13px] font-light leading-relaxed max-w-lg mx-auto">
              {editorialDescription}
            </p>

            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 font-light">
              <span className="font-medium text-neutral-700">
                {products.length}
              </span>
              <span>
                {products.length === 1 ? "curated piece" : "handcrafted pieces"}
              </span>
            </div>
          </div>
        </header>

        {/* Category Switcher Navigation Bar (Scrollable Pills) */}
        {categories.length > 0 && (
          <section className="bg-white border-b border-[#f0eae1] py-3.5 px-4 sm:px-6 lg:px-12 sticky top-0 z-30 shadow-2xs backdrop-blur-md">
            <div className="max-w-[92%] mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
              <Link
                to="/shop"
                className="shrink-0 px-3.5 py-1.5 text-xs uppercase tracking-[0.16em] font-medium transition-colors border border-[#e8dfd3] text-neutral-600 hover:text-neutral-950 hover:bg-[#faf8f5] bg-white"
              >
                All Pieces
              </Link>

              {categories.map((cat) => {
                const isActive =
                  cat.id === category.id ||
                  cat.slug?.toLowerCase() === category.slug?.toLowerCase();

                return (
                  <Link
                    key={cat.id || cat.slug}
                    to={`/category/${cat.slug || cat.id}`}
                    className={`shrink-0 px-3.5 py-1.5 text-xs uppercase tracking-[0.16em] transition-all border ${
                      isActive
                        ? "bg-[#141210] text-[#f7f5f2] border-[#141210] font-medium shadow-xs"
                        : "bg-white text-neutral-600 hover:text-neutral-950 hover:bg-[#faf8f5] border-[#e8dfd3]"
                    }`}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Search, Filter & Sort Controls Section */}
        <section className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input within this category */}
            <div className="relative w-full md:w-80 lg:w-96">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={`Search in ${category.name}...`}
                className="w-full bg-[#fcfbf9] border border-[#e8dfd3] pl-9 pr-9 py-2.5 text-xs sm:text-[13px] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#caa982] focus:bg-white transition-all rounded-xs"
              />
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
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

            {/* Right Controls: In-Stock Toggle & Sort Dropdown */}
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
                  {category.name}
                </strong>
              </span>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
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

                {sortOption !== "featured" && (
                  <span className="inline-flex items-center gap-1.5 bg-[#faf8f5] border border-[#e8dfd3] text-neutral-800 px-2.5 py-1 text-xs">
                    <span className="text-neutral-400 text-[11px] uppercase tracking-wider">
                      Sort:
                    </span>
                    <span className="font-medium">
                      {SORT_OPTIONS.find((o) => o.id === sortOption)?.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSortSelect("featured")}
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
                  className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-neutral-500 hover:text-neutral-950 underline underline-offset-4 transition-colors ml-1"
                >
                  <RotateCcw size={11} />
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Product Grid Section */}
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

                const productEnquiryMessage = encodeURIComponent(
                  `Hi Siarah, I would like to enquire about / order "${product.name}"${skuPart} (Price: ₹${product.price.toLocaleString("en-IN")}) from your ${category.name} collection.`,
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

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                          {product.is_new && (
                            <span className="bg-[#141210] text-[#ded7ce] text-[10px] tracking-[0.2em] uppercase font-medium px-2 py-0.5 shadow-sm">
                              NEW
                            </span>
                          )}
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
                            {category.name}
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
            /* Empty Category State */
            <div className="text-center py-16 sm:py-20 px-6 max-w-lg mx-auto border border-[#e8dfd3] bg-[#fcfbf9] my-6">
              <div className="w-12 h-12 rounded-full bg-[#f4ede4] text-[#caa982] flex items-center justify-center mx-auto mb-4">
                <Sparkles size={22} strokeWidth={1.5} />
              </div>

              <h2 className="font-serif text-2xl sm:text-[1.75rem] font-normal text-neutral-900 mb-2">
                {products.length === 0
                  ? `New ${category.name} Arriving Soon`
                  : `No matching ${category.name.toLowerCase()} found`}
              </h2>

              <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed mb-6 max-w-sm mx-auto">
                {products.length === 0
                  ? `Our master artisans are currently handcrafting new pieces for the ${category.name} collection. Speak with our stylist for bespoke commissions.`
                  : searchQuery.trim()
                    ? `No pieces found matching "${searchQuery.trim()}" in ${category.name}. Try adjusting your keywords or clearing filters.`
                    : "No pieces match your active filters. Try clearing your filters to see all pieces."}
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

                <a
                  href={categoryWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fae53] text-white px-5 py-2.5 text-xs tracking-[0.2em] font-medium uppercase transition-colors"
                >
                  <MessageCircle size={14} />
                  <span>Custom Order Enquiry</span>
                </a>
              </div>
            </div>
          )}
        </section>

        {/* WhatsApp Personal Stylist Concierge Banner */}
        <section className="bg-[#faf8f5] border-t border-[#f0eae1] py-14 sm:py-16">
          <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="bg-white border border-[#e8dfd3] p-8 sm:p-10 lg:p-12 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-2.5 max-w-xl">
                <span className="text-[11px] uppercase tracking-[0.22em] text-[#caa982] font-medium">
                  PERSONAL JEWELLERY CONCIERGE
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-normal text-neutral-900 tracking-tight leading-tight">
                  Need customisation or video view in {category.name}?
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
                  Our dedicated styling consultants can share close-up video
                  previews of jewellery pieces, verify lengths, and assist you
                  with custom bridal matching via WhatsApp.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <a
                  href={categoryWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1fae53] text-white py-3.5 px-6 uppercase tracking-[0.2em] text-xs font-medium transition-all duration-300 shadow-sm"
                >
                  <MessageCircle size={16} />
                  <span>Chat on WhatsApp</span>
                </a>

                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center gap-2 border border-neutral-300 hover:border-neutral-900 text-neutral-800 hover:text-neutral-950 py-3.5 px-6 uppercase tracking-[0.2em] text-xs font-medium transition-colors"
                >
                  <span>Explore All Pieces</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
