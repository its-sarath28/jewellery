import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Info,
  MessageCircle,
  Share2,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
  ZoomIn,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import type { Route } from "./+types/product";
import Footer from "~/components/Footer";
import Navbar from "~/components/Navbar";
import type { Category, Product } from "~/interface/index.interface";
import supabase from "~/lib/supabase";
import { FALL_BACK_IMAGE, WHATSAPP_NUMBER } from "~/constants/data";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData?.product) {
    return [
      { title: "Piece Not Found - Siarah Luxury Jewellery" },
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

  const { product } = loaderData;
  const categoryName = product.categories?.name;
  const categoryLower = categoryName ? categoryName.toLowerCase() : "jewellery";
  const productName = product.name;

  const pageTitle = `${productName}${categoryName ? ` | ${categoryName}` : ""} - Custom-Made Luxury Jewellery | Siarah`;
  const pageDescription =
    product.description ||
    `Order ${productName} custom-made by Siarah. Handcrafted ${categoryLower} piece shaped with heirloom craftsmanship, antique gold finish, and bespoke luxury tailoring.`;
  const pageKeywords = `custom made ${productName}, bespoke ${productName}, handcrafted ${categoryLower}, custom ${categoryLower}, made to order ${productName}, bespoke jewellery, luxury bridal jewellery, Siarah ${productName}, antique gold jewellery, artisan handcrafted jewellery`;

  return [
    {
      title: pageTitle,
    },
    {
      name: "description",
      content: pageDescription,
    },
    {
      name: "keywords",
      content: pageKeywords,
    },
    {
      property: "og:title",
      content: pageTitle,
    },
    {
      property: "og:description",
      content: pageDescription,
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:site_name",
      content: "Siarah Luxury Jewellery",
    },
    ...(product.images?.[0]
      ? [{ property: "og:image", content: product.images[0] }]
      : []),
  ];
}

export type ProductWithCategory = Product & {
  categories?: Category | null;
};

export type ProductLoaderData = {
  product: ProductWithCategory | null;
  relatedProducts: ProductWithCategory[];
  whatsappNumber: string;
};

export async function loader({
  params,
}: Route.LoaderArgs): Promise<ProductLoaderData> {
  const slug = params.slug;
  if (!slug) {
    return {
      product: null,
      relatedProducts: [],
      whatsappNumber: WHATSAPP_NUMBER,
    };
  }

  try {
    // 1. Try finding product by slug
    let { data: product } = await supabase
      .from("products")
      .select("*, categories(*)")
      .eq("slug", slug)
      .maybeSingle();

    // 2. Fallback to finding by id
    if (!product) {
      const res = await supabase
        .from("products")
        .select("*, categories(*)")
        .eq("id", slug)
        .maybeSingle();
      product = res.data;
    }

    const currentProduct = product as unknown as ProductWithCategory | null;

    // 3. Fetch related products (other published pieces)
    let relatedProducts: ProductWithCategory[] = [];
    if (currentProduct) {
      const { data: related } = await supabase
        .from("products")
        .select("*, categories(*)")
        .eq("published", true)
        .neq("id", currentProduct.id)
        .limit(4);

      if (related) {
        relatedProducts = related as unknown as ProductWithCategory[];
      }
    }

    // 4. Fetch whatsapp_number from site_settings
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
      // fallback to WHATSAPP_NUMBER
    }

    return {
      product: currentProduct,
      relatedProducts,
      whatsappNumber,
    };
  } catch (err) {
    console.error("Error loading product detail in loader:", err);
    return {
      product: null,
      relatedProducts: [],
      whatsappNumber: WHATSAPP_NUMBER,
    };
  }
}

interface SpecItem {
  label: string | null;
  value: string;
}

function parseSpecifications(raw?: string | null): SpecItem[] {
  if (!raw || !raw.trim()) return [];
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0 && colonIndex < line.length - 1) {
      return {
        label: line
          .substring(0, colonIndex)
          .replace(/^[-*•]\s*/, "")
          .trim(),
        value: line.substring(colonIndex + 1).trim(),
      };
    }
    return {
      label: null,
      value: line.replace(/^[-*•]\s*/, "").trim(),
    };
  });
}

export default function ProductDetail({ loaderData }: Route.ComponentProps) {
  const {
    product,
    relatedProducts,
    whatsappNumber = WHATSAPP_NUMBER,
  } = loaderData;
  const location = useLocation();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Accordion state - Overview and Specifications open by default
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    overview: true,
    specifications: true,
    craftsmanship: false,
    care: false,
    shipping: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Reset selected image when route changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setIsLightboxOpen(false);
  }, [location.pathname]);

  // Handle ESC key for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };
    if (isLightboxOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isLightboxOpen]);

  const handleCopyLink = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2200);
      }
    } catch (e) {
      console.error("Failed to copy link:", e);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-md mx-auto border border-[#e8dfd3] bg-[#fcfbf9] p-8 sm:p-12 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#f4ede4] text-[#caa982] flex items-center justify-center mx-auto mb-4">
              <Sparkles size={22} strokeWidth={1.5} />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-neutral-900 mb-2">
              Piece Not Found
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed mb-6">
              The jewellery piece you are looking for may have been updated,
              renamed, or is currently unlisted.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#3d3731] hover:bg-[#2c2722] text-[#ded7ce] hover:text-white px-6 py-3 text-xs tracking-[0.2em] font-medium uppercase transition-colors"
            >
              <span>Explore Collection</span>
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [FALL_BACK_IMAGE];

  const currentImage = images[selectedImageIndex] || images[0];

  const isOnSale = Boolean(
    product.original_price && product.original_price > product.price,
  );

  const discountPercentage =
    isOnSale && product.original_price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) *
            100,
        )
      : 0;

  const savingsAmount =
    isOnSale && product.original_price
      ? product.original_price - product.price
      : 0;

  const categoryName = product.categories?.name || "Jewellery";
  const categorySlug = product.categories?.slug || "all";

  // SKU handling: only display if actually provided
  const hasSku = Boolean(product.sku && product.sku.trim());
  const productSku = hasSku ? product.sku.trim() : null;

  // Derive concise summary (either from product.summary or generated from description/highlights)
  const productSummary =
    product.summary && product.summary.trim()
      ? product.summary.trim()
      : product.description && product.description.trim()
        ? product.description.trim().split(/\r?\n/)[0]
        : `Handcrafted ${categoryName.toLowerCase()} featuring antique micro gold plating, exquisite detailing, and timeless heritage elegance.`;

  const customSpecs = parseSpecifications(product.specifications);

  // Build WhatsApp enquiry & order links
  const productUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://siarah.com/product/${product.slug || product.id}`;

  const skuSnippet = hasSku ? ` (SKU: ${productSku})` : "";

  const whatsappEnquiryMessage = encodeURIComponent(
    `Hi Siarah, I would like to enquire about "${product.name}"${skuSnippet} (Price: ₹${product.price.toLocaleString("en-IN")}) from your luxury collection.\n\nProduct Link: ${productUrl}`,
  );
  const whatsappEnquiryUrl = `https://wa.me/${whatsappNumber}?text=${whatsappEnquiryMessage}`;

  const whatsappOrderMessage = encodeURIComponent(
    `Hi Siarah, I would like to order "${product.name}"${skuSnippet} (Price: ₹${product.price.toLocaleString("en-IN")}). Please assist me with payment and dispatch.\n\nProduct Link: ${productUrl}`,
  );
  const whatsappOrderUrl = `https://wa.me/${whatsappNumber}?text=${whatsappOrderMessage}`;

  return (
    <div className="min-h-screen bg-[#fdfcfb] text-neutral-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pb-20 lg:pb-0">
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
            <Link
              to={`/category/${categorySlug}`}
              className="hover:text-neutral-900 transition-colors uppercase tracking-[0.16em] text-[11px] text-[#b59871] font-medium"
            >
              {categoryName}
            </Link>
            <ChevronRight size={12} className="text-neutral-300 shrink-0" />
            <span className="text-neutral-800 font-normal truncate max-w-50 sm:max-w-xs text-[11px] tracking-wide">
              {product.name}
            </span>
          </div>
        </nav>

        {/* Main Product Showcase Section */}
        <section className="bg-white py-8 sm:py-12 lg:py-16">
          <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-20 items-start">
              {/* Left Column: Product Imagery (Sticky on desktop) */}
              <div className="lg:col-span-6 xl:col-span-6 lg:sticky lg:top-24">
                <div className="relative w-full overflow-hidden select-none bg-[#faf8f5] border border-[#f0eae1] group">
                  {/* Badges Overlay */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start pointer-events-none">
                    {product.is_new && (
                      <span className="bg-[#141210] text-[#f7f5f2] text-[10px] tracking-[0.22em] uppercase font-medium px-2.5 py-1">
                        New Arrival
                      </span>
                    )}
                    {product.is_bestseller && (
                      <span className="bg-[#b59871] text-white text-[10px] tracking-[0.22em] uppercase font-medium px-2.5 py-1">
                        Bestseller
                      </span>
                    )}
                    {isOnSale && (
                      <span className="bg-[#8b261e] text-white text-[10px] tracking-[0.22em] uppercase font-medium px-2.5 py-1">
                        {discountPercentage}% Off
                      </span>
                    )}
                  </div>

                  {/* Enlarge / Zoom button */}
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 hover:bg-white text-neutral-800 backdrop-blur-xs border border-[#e8dfd3] shadow-xs rounded-full transition-all duration-300 hover:scale-105 cursor-pointer opacity-90 hover:opacity-100"
                    title="Click to expand high-resolution view"
                    aria-label="View enlarged image"
                  >
                    <ZoomIn size={16} strokeWidth={1.5} />
                  </button>

                  {/* Main Image with clickable zoom preview */}
                  <div
                    onClick={() => setIsLightboxOpen(true)}
                    className="cursor-zoom-in overflow-hidden"
                  >
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="w-full h-auto object-cover object-center max-h-160 transition-transform duration-700 ease-out group-hover:scale-103"
                    />
                  </div>

                  {/* Image Counter Pill */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-[11px] text-neutral-600 font-light px-2.5 py-1 rounded-full border border-[#f0eae1] pointer-events-none">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>

                {/* Multiple Images Thumbnails */}
                {images.length > 1 && (
                  <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-2 scrollbar-thin">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative aspect-square w-18 sm:w-20 shrink-0 overflow-hidden border transition-all cursor-pointer ${
                          selectedImageIndex === idx
                            ? "border-[#b59871] ring-2 ring-[#b59871]/40"
                            : "border-[#e8dfd3] opacity-70 hover:opacity-100"
                        }`}
                        aria-label={`View image ${idx + 1}`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} preview thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover object-center"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Artisanal Heritage Mini Banner below image */}
                <div className="mt-6 border border-[#f2ede6] bg-[#faf8f5] p-4 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#e8dfd3] flex items-center justify-center shrink-0 text-[#b59871]">
                    <Sparkles size={18} strokeWidth={1.5} />
                  </div>
                  <div className="text-xs">
                    <p className="font-serif text-neutral-900 font-medium tracking-wide">
                      Handcrafted Heirloom Elegance
                    </p>
                    <p className="text-neutral-500 font-light leading-relaxed text-[11px] mt-0.5">
                      Each piece undergoes multi-stage artisanal handcrafting
                      and rigorous quality inspection.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Editorial Product Information & Enhanced Details */}
              <div className="lg:col-span-6 xl:col-span-6">
                {/* Category Eyebrow & SKU Info (if available) */}
                <div className="flex items-center justify-between flex-wrap gap-2.5 mb-2.5">
                  <Link
                    to={`/category/${categorySlug}`}
                    className="inline-flex items-center gap-1.5 text-[#b59871] hover:text-[#8f714b] text-xs sm:text-[13px] font-semibold tracking-[0.25em] uppercase transition-colors"
                  >
                    <span>{categoryName}</span>
                  </Link>

                  {hasSku && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-neutral-600 uppercase bg-[#faf8f5] border border-[#e8dfd3] px-2.5 py-1 rounded-xs">
                      <span className="text-neutral-400 font-sans text-[10px] tracking-widest">
                        SKU:
                      </span>
                      <span className="font-semibold text-neutral-800">
                        {productSku}
                      </span>
                    </span>
                  )}
                </div>

                {/* Product Title */}
                <h1 className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] font-normal text-neutral-900 tracking-tight leading-[1.15] mb-4">
                  {product.name}
                </h1>

                {/* Pricing Display */}
                <div className="bg-[#fcfbf9] border border-[#f2ede6] p-4 sm:p-5 rounded-xs mb-6">
                  <div className="flex items-baseline flex-wrap gap-3">
                    <span className="font-sans text-2xl sm:text-3xl font-medium text-neutral-900">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>

                    {isOnSale && product.original_price && (
                      <span className="font-sans text-base sm:text-lg font-light text-neutral-400 line-through">
                        ₹{product.original_price.toLocaleString("en-IN")}
                      </span>
                    )}

                    {isOnSale && (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium tracking-wider uppercase bg-[#f4ede4] text-[#8b261e] border border-[#e8dfd3]">
                        Save ₹{savingsAmount.toLocaleString("en-IN")} (
                        {discountPercentage}% Off)
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-500 font-light mt-2 flex items-center gap-1.5">
                    <Info size={13} className="text-[#caa982] shrink-0" />
                    <span>Price inclusive of all taxes.</span>
                  </p>
                </div>

                {/* Product Summary Box */}
                <div className="bg-[#faf8f5] border border-[#ede5d8] p-4 sm:p-5 rounded-xs mb-6">
                  <div className="flex items-center gap-2 mb-2 text-[#b59871]">
                    <Sparkles size={15} strokeWidth={1.5} />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b59871]">
                      Summary
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-700 font-normal leading-relaxed">
                    {productSummary}
                  </p>

                  {/* Summary Highlights */}
                  <div className="mt-3.5 pt-3 border-t border-[#ede5d8] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#b59871] shrink-0" />
                      <span>
                        <strong className="font-medium text-neutral-800">
                          Category:
                        </strong>{" "}
                        {categoryName}
                      </span>
                    </div>
                    {hasSku && (
                      <div className="flex items-center gap-2 text-neutral-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#b59871] shrink-0" />
                        <span>
                          <strong className="font-medium text-neutral-800">
                            SKU Code:
                          </strong>{" "}
                          {productSku}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-neutral-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#b59871] shrink-0" />
                      <span>
                        <strong className="font-medium text-neutral-800">
                          Availability:
                        </strong>{" "}
                        {product.availability === "out_of_stock"
                          ? "Made to Order"
                          : "In Stock"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Description Section */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900 mb-2 flex items-center gap-2">
                    <span>Description</span>
                  </h3>
                  <div className="text-xs sm:text-sm text-neutral-600 font-light leading-relaxed">
                    {product.description && product.description.trim() ? (
                      <p className="text-neutral-700 whitespace-pre-line leading-relaxed font-normal">
                        {product.description}
                      </p>
                    ) : (
                      <p className="text-neutral-600 leading-relaxed italic">
                        Handcrafted with meticulous artistry, this piece
                        embodies the regal charm of heritage Indian jewellery.
                        Designed to be treasured across seasons and
                        celebrations.
                      </p>
                    )}
                  </div>
                </div>

                {/* Availability Status */}
                <div className="flex items-center gap-2 mb-6 text-xs tracking-wider uppercase">
                  {product.availability === "out_of_stock" ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200/60 px-3 py-1 font-medium text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                      Made to Order / Limited Availability
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-3 py-1 font-medium text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      In Stock & Ready to Dispatch
                    </span>
                  )}
                </div>

                {/* Primary CTA Buttons: Enquiry Button & WhatsApp Order Button */}
                <div className="space-y-3 mb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Primary Enquiry Button */}
                    <a
                      href={whatsappEnquiryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      id="product-enquire-button"
                      className="inline-flex items-center justify-center gap-2.5 bg-[#3d3731] hover:bg-[#231f1c] text-[#f7f5f2] hover:text-white py-4 px-6 uppercase tracking-[0.2em] text-xs font-medium transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group"
                    >
                      <MessageCircle
                        size={18}
                        strokeWidth={1.75}
                        className="shrink-0 transition-transform group-hover:scale-110 text-[#25D366]"
                      />
                      <span>Enquire Now</span>
                    </a>

                    {/* Order via WhatsApp Button */}
                    <a
                      href={whatsappOrderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      id="product-order-whatsapp-button"
                      className="inline-flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1fae53] text-white py-4 px-6 uppercase tracking-[0.2em] text-xs font-medium transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group"
                    >
                      <MessageCircle
                        size={18}
                        strokeWidth={1.75}
                        className="shrink-0 transition-transform group-hover:scale-110"
                      />
                      <span>Order via WhatsApp</span>
                    </a>
                  </div>

                  {/* Secondary Quick Action Bar: Share & Direct Help */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-950 font-light py-1.5 px-3 border border-[#e8dfd3] bg-white hover:bg-[#faf8f5] transition-colors cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check size={14} className="text-emerald-600" />
                          <span className="text-emerald-700 font-medium">
                            Link Copied!
                          </span>
                        </>
                      ) : (
                        <>
                          <Share2 size={13} className="text-neutral-500" />
                          <span>Share Piece</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-light">
                      <ShieldCheck
                        size={14}
                        className="text-[#caa982] shrink-0"
                      />
                      <span>
                        Zero-obligation enquiry • Direct stylist assistance
                      </span>
                    </div>
                  </div>
                </div>

                {/* How to Order (via WhatsApp) Section */}
                <div className="mb-8 border border-[#e8dfd3] bg-[#faf8f5] p-5 sm:p-6 rounded-xs">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0 mt-0.5">
                      <MessageCircle size={20} />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-medium text-neutral-900 leading-snug">
                        How to Order (via WhatsApp)
                      </h3>
                      <p className="text-xs text-neutral-500 font-light mt-0.5">
                        Bespoke personal shopping experience with our dedicated
                        stylists
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Step 1 */}
                    <div className="bg-white p-3.5 border border-[#ede5d8] rounded-xs">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#3d3731] text-[#ded7ce] text-[10px] font-bold flex items-center justify-center shrink-0">
                          1
                        </span>
                        <h4 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                          Enquire or Order
                        </h4>
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed font-light pl-7">
                        Click{" "}
                        <strong className="font-medium text-neutral-700">
                          "Enquire Now"
                        </strong>{" "}
                        or{" "}
                        <strong className="font-medium text-neutral-700">
                          "Order via WhatsApp"
                        </strong>
                        . A pre-filled message with the piece name
                        {hasSku ? " and SKU" : ""} opens directly on WhatsApp.
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white p-3.5 border border-[#ede5d8] rounded-xs">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#3d3731] text-[#ded7ce] text-[10px] font-bold flex items-center justify-center shrink-0">
                          2
                        </span>
                        <h4 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                          Video View & Details
                        </h4>
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed font-light pl-7">
                        Our stylist can share real-time close-up videos, verify
                        necklace lengths, or answer customization queries.
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white p-3.5 border border-[#ede5d8] rounded-xs">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#3d3731] text-[#ded7ce] text-[10px] font-bold flex items-center justify-center shrink-0">
                          3
                        </span>
                        <h4 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                          Secure Payment
                        </h4>
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed font-light pl-7">
                        Pay securely via UPI (Google Pay, PhonePe, Paytm), Net
                        Banking, or Credit/Debit Card links.
                      </p>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-white p-3.5 border border-[#ede5d8] rounded-xs">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#3d3731] text-[#ded7ce] text-[10px] font-bold flex items-center justify-center shrink-0">
                          4
                        </span>
                        <h4 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                          Insured Dispatch
                        </h4>
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed font-light pl-7">
                        Packaged in our signature keepsake gift box and
                        dispatched within 24–48 hours with full courier
                        tracking.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#ede5d8] flex flex-wrap items-center justify-end gap-3">
                    <a
                      href={whatsappOrderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#25D366] hover:text-[#1fae53] transition-colors"
                    >
                      <span>Order On WhatsApp Now</span>
                      <ChevronRight size={14} />
                    </a>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* ENHANCED PRODUCT DETAILS SECTION (Structured Accordions)   */}
                {/* ========================================================= */}
                <div className="border-t border-[#e8dfd3] pt-2 space-y-0 divide-y divide-[#f0eae1]">
                  {/* 1. Description & Story */}
                  <div className="py-4">
                    <button
                      type="button"
                      onClick={() => toggleSection("overview")}
                      className="w-full flex items-center justify-between text-left group py-1 cursor-pointer"
                      aria-expanded={openSections.overview}
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles
                          size={16}
                          strokeWidth={1.5}
                          className="text-[#b59871]"
                        />
                        <span className="font-serif text-base sm:text-lg text-neutral-900 group-hover:text-[#b59871] transition-colors">
                          Story & Design Overview
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-neutral-400 transition-transform duration-300 ${
                          openSections.overview
                            ? "rotate-180 text-neutral-800"
                            : ""
                        }`}
                      />
                    </button>

                    {openSections.overview && (
                      <div className="pt-3.5 pb-2 text-xs sm:text-sm text-neutral-600 font-light leading-relaxed space-y-3">
                        {product.description ? (
                          <p className="text-neutral-700 leading-relaxed font-normal">
                            {product.description}
                          </p>
                        ) : (
                          <p className="text-neutral-600 leading-relaxed italic">
                            Handcrafted with impeccable artistry, this piece
                            embodies the regal charm of heritage Indian
                            jewellery. Designed to be treasured across seasons
                            and celebrations.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Packaging & Shipping */}
                  <div className="py-4">
                    <button
                      type="button"
                      onClick={() => toggleSection("shipping")}
                      className="w-full flex items-center justify-between text-left group py-1 cursor-pointer"
                      aria-expanded={openSections.shipping}
                    >
                      <div className="flex items-center gap-2.5">
                        <Truck
                          size={16}
                          strokeWidth={1.5}
                          className="text-[#b59871]"
                        />
                        <span className="font-serif text-base sm:text-lg text-neutral-900 group-hover:text-[#b59871] transition-colors">
                          Packaging & Dispatch Information
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-neutral-400 transition-transform duration-300 ${
                          openSections.shipping
                            ? "rotate-180 text-neutral-800"
                            : ""
                        }`}
                      />
                    </button>

                    {openSections.shipping && (
                      <div className="pt-3.5 pb-2 text-xs sm:text-sm text-neutral-600 font-light leading-relaxed space-y-2">
                        <p>
                          Each order is inspected by our quality assurance team
                          before being safely packaged in our signature
                          velvet-lined Siarah jewellery box, making it ready for
                          gifting.
                        </p>
                        <div className="bg-[#faf8f5] border border-[#f0eae1] p-3 text-xs space-y-1.5 mt-2">
                          <p className="flex items-center gap-2 text-neutral-800 font-medium">
                            <Clock size={14} className="text-[#caa982]" />
                            <span>
                              Dispatch: Within 24 to 48 business hours
                            </span>
                          </p>
                          <p className="text-neutral-500 font-light pl-5.5">
                            Tracking details sent directly via SMS and WhatsApp
                            upon courier pickup.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Concierge Assistance Banner */}
                <div className="mt-8 p-5 bg-[#faf8f5] border border-[#e8dfd3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-serif text-sm font-medium text-neutral-900">
                      Need customisation or video view?
                    </h4>
                    <p className="text-xs text-neutral-500 font-light mt-0.5">
                      Our styling consultants can share close-up video previews
                      of this piece via WhatsApp.
                    </p>
                  </div>
                  <a
                    href={whatsappEnquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-medium text-[#3d3731] hover:text-black border-b border-[#3d3731] pb-0.5 shrink-0 self-start sm:self-auto"
                  >
                    <span>Connect Now</span>
                    <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* LIGHTBOX MODAL FOR HIGH-RES IMAGE ZOOM                    */}
        {/* ========================================================= */}
        {isLightboxOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-5 right-5 z-50 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Close image zoom"
            >
              <X size={24} />
            </button>

            {/* Lightbox Main Image */}
            <div
              className="relative max-w-4xl max-h-[82vh] overflow-hidden flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentImage}
                alt={`${product.name} zoomed high resolution view`}
                className="max-h-[80vh] w-auto max-w-full object-contain select-none"
              />
            </div>

            {/* Thumbnail switcher in lightbox */}
            {images.length > 1 && (
              <div
                className="flex items-center gap-2 mt-4 overflow-x-auto p-1 bg-black/40 rounded-full border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedImageIndex === idx
                        ? "border-[#caa982] scale-105"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Related Pieces Section (if other products exist) */}
        {relatedProducts.length > 0 && (
          <section className="bg-[#faf8f5] py-16 sm:py-20 border-t border-[#f2ede6]">
            <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
                <div>
                  <p className="text-[#caa982] text-xs sm:text-[13px] font-medium tracking-[0.24em] uppercase mb-1.5">
                    CURATED FOR YOU
                  </p>
                  <h2 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-900 tracking-tight leading-tight">
                    You May Also Love
                  </h2>
                </div>

                <Link
                  to="/shop"
                  className="text-xs sm:text-[13px] uppercase tracking-[0.2em] font-medium text-neutral-700 hover:text-neutral-950 border-b border-neutral-300 hover:border-neutral-900 pb-0.5 transition-colors self-start sm:self-end"
                >
                  VIEW ALL PIECES
                </Link>
              </div>

              {/* Related Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                {relatedProducts.map((relProduct) => {
                  const relImage =
                    relProduct.images && relProduct.images.length > 0
                      ? relProduct.images[0]
                      : FALL_BACK_IMAGE;

                  return (
                    <Link
                      key={relProduct.id || relProduct.slug}
                      to={`/product/${relProduct.slug || relProduct.id}`}
                      className="group block focus:outline-none"
                    >
                      <div className="relative aspect-square sm:aspect-4/5 w-full overflow-hidden bg-neutral-100 border border-[#f0eae1]">
                        <img
                          src={relImage}
                          alt={relProduct.name}
                          loading="lazy"
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 select-none"
                        />
                      </div>

                      <div className="mt-3.5 space-y-1">
                        {relProduct.categories?.name && (
                          <p className="text-[10px] tracking-[0.22em] uppercase text-[#caa982] font-medium">
                            {relProduct.categories.name}
                          </p>
                        )}
                        <h3 className="font-serif text-sm sm:text-[15px] font-normal text-neutral-900 tracking-wide group-hover:text-[#b59871] transition-colors line-clamp-1">
                          {relProduct.name}
                        </h3>
                        <p className="text-xs sm:text-sm font-medium text-neutral-900">
                          ₹{relProduct.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e8dfd3] p-3 px-4 shadow-lg flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-serif font-medium text-neutral-900 truncate">
              {product.name}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-neutral-900">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {isOnSale && product.original_price && (
                <span className="text-[11px] text-neutral-400 line-through">
                  ₹{product.original_price.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={whatsappEnquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#3d3731] text-[#f7f5f2] px-3.5 py-2 text-xs uppercase tracking-wider font-medium shadow-xs"
            >
              <MessageCircle size={14} className="text-[#25D366]" />
              <span>Enquire</span>
            </a>
            <a
              href={whatsappOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1fae53] text-white px-3.5 py-2 text-xs uppercase tracking-wider font-medium shadow-xs"
            >
              <span>Order</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
