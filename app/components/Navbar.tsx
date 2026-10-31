import { Menu, Search, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { WHATSAPP_NUMBER } from "~/constants/data";
import type { Category } from "~/interface/index.interface";
import supabase from "~/lib/supabase";

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20Siarah,%20I'd%20like%20to%20enquire%20about%20your%20jewellery%20collection.`;

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("active", true)
          .order("sort_order", { ascending: true })
          .limit(5);

        if (!error && data) {
          setCategories(data as unknown as Category[]);
        }
      } catch (err) {
        console.error("Error fetching categories for Navbar:", err);
      }
    };

    fetchCategories();
  }, []);

  return (
    <header className="w-full relative z-50">
      {/* Top Announcement Bar */}
      <div className="bg-[#141210] text-[#ded7ce] text-center py-2 sm:py-2.5 px-4 text-[10px] sm:text-xs tracking-[0.24em] uppercase font-light border-b border-neutral-900 select-none">
        A little something beautiful, for every occasion
      </div>

      {/* Main Navbar Bar */}
      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-[#f0eae1]">
        <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-10 py-3 sm:py-4 flex items-center justify-between">
          {/* Mobile Menu Button (Visible on mobile/tablet) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden p-1.5 -ml-1.5 text-neutral-800 hover:text-neutral-950 transition-colors"
          >
            {mobileMenuOpen ? (
              <X size={22} strokeWidth={1.5} />
            ) : (
              <Menu size={22} strokeWidth={1.5} />
            )}
          </button>

          {/* Brand Logo */}
          <Link to="/" className="flex items-center group">
            <img
              src="/images/logo.jpg"
              alt="SIARAH"
              className="h-8 sm:h-10 md:h-11 w-auto object-contain transition-opacity duration-300 group-hover:opacity-90"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 lg:gap-11">
            <Link
              to="/"
              className={`text-xs tracking-[0.22em] uppercase transition-colors ${
                location.pathname === "/"
                  ? "text-amber-900 font-medium"
                  : "text-neutral-800 hover:text-amber-900 font-normal"
              }`}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className={`text-xs tracking-[0.22em] uppercase transition-colors ${
                location.pathname === "/shop"
                  ? "text-amber-900 font-medium"
                  : "text-neutral-800 hover:text-amber-900 font-normal"
              }`}
            >
              Shop
            </Link>
            <Link
              to="/new-arrivals"
              className={`text-xs tracking-[0.22em] uppercase transition-colors ${
                location.pathname === "/new-arrivals"
                  ? "text-amber-900 font-medium"
                  : "text-neutral-800 hover:text-amber-900 font-normal"
              }`}
            >
              New Arrivals
            </Link>
          </div>

          {/* Right Action (Search) */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/shop"
              aria-label="Search collection"
              className="p-1.5 text-neutral-700 hover:text-neutral-950 transition-colors"
            >
              <Search size={18} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Out Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[82%] max-w-sm bg-[#fcfbf9] z-50 md:hidden shadow-2xl transition-transform duration-300 ease-out flex flex-col justify-between ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div>
          <div className="px-6 py-5 border-b border-[#ece6dd] flex items-center justify-between">
            <img
              src="/images/logo.jpg"
              alt="SIARAH"
              className="h-8 w-auto object-contain"
            />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="p-1.5 text-neutral-600 hover:text-neutral-900"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="px-6 py-6 space-y-5">
            <p className="text-[11px] font-medium tracking-[0.24em] uppercase text-[#caa982]">
              Menu
            </p>

            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-serif text-lg tracking-wide transition-colors py-1 border-b border-[#f4ede4] ${
                  location.pathname === "/"
                    ? "text-amber-900 font-medium"
                    : "text-neutral-900 hover:text-amber-900"
                }`}
              >
                Home
              </Link>
              <Link
                to="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-serif text-lg tracking-wide transition-colors py-1 border-b border-[#f4ede4] ${
                  location.pathname === "/shop"
                    ? "text-amber-900 font-medium"
                    : "text-neutral-900 hover:text-amber-900"
                }`}
              >
                Shop All
              </Link>
              <Link
                to="/new-arrivals"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-serif text-lg tracking-wide transition-colors py-1 border-b border-[#f4ede4] ${
                  location.pathname === "/new-arrivals"
                    ? "text-amber-900 font-medium"
                    : "text-neutral-900 hover:text-amber-900"
                }`}
              >
                New Arrivals
              </Link>
            </nav>

            {categories.length > 0 && (
              <div className="pt-4">
                <p className="text-[11px] font-medium tracking-[0.24em] uppercase text-[#caa982] mb-3">
                  Categories
                </p>
                <div className="flex flex-col space-y-2.5 text-xs text-neutral-600 font-light">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/category/${category.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-neutral-600 hover:text-amber-900 transition-colors tracking-wide font-light"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-6 border-t border-[#ece6dd] bg-[#f7f4ee]/60">
          <p className="text-xs text-neutral-500 font-light mb-3">
            Client Styling Concierge
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center w-full py-2.5 bg-neutral-900 text-white text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-neutral-800 transition-colors"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
