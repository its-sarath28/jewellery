import { ArrowRight, MessageCircle } from "lucide-react";
import React from "react";
import { Link } from "react-router";
import { WHATSAPP_NUMBER } from "~/constants/data";

const InstagramIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20Siarah,%20I'd%20like%20to%20enquire%20about%20your%20jewellery%20collection.`;
const INSTAGRAM_URL =
  "https://www.instagram.com/siarahstudio?utm_source=ig_web_button_share_sheet&cplk=ZDNlZDc0MzIxNw==";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#fcfbf9] text-neutral-800 border-t border-[#ece6dd]">
      {/* Main Footer Navigation & Brand Section */}
      <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand Identity Column */}
          <div className="lg:col-span-8 space-y-5">
            <Link to="/" className="inline-block group">
              <div className="flex items-center gap-3">
                <img
                  src="/images/logo.jpg"
                  alt="SIARAH Logo"
                  className="w-28 h-auto object-contain transition-opacity duration-300 group-hover:opacity-90"
                />
              </div>
            </Link>

            <p className="text-xs sm:text-[13px] text-neutral-600 font-light leading-relaxed max-w-sm">
              Thoughtfully chosen pieces to make every moment feel a little more
              special. A touch of tradition, a world of understated elegance.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow SIARAH on Instagram"
                className="w-9 h-9 rounded-full bg-[#f4ede4] text-neutral-800 flex items-center justify-center hover:bg-neutral-900 hover:text-white transition-all duration-300"
              >
                <InstagramIcon size={16} />
              </a>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Enquire on WhatsApp"
                className="w-9 h-9 rounded-full bg-[#f4ede4] text-neutral-800 flex items-center justify-center hover:bg-emerald-700 hover:text-white transition-all duration-300"
              >
                <MessageCircle size={16} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Explore Links */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-serif text-xs uppercase tracking-[0.22em] font-medium text-neutral-900">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-[13px]">
              <li>
                <Link
                  to="/shop"
                  className="text-neutral-600 hover:text-amber-900 transition-colors tracking-wide font-light"
                >
                  Shop All
                </Link>
              </li>
              <li>
                <Link
                  to="/category/necklaces"
                  className="text-neutral-600 hover:text-amber-900 transition-colors tracking-wide font-light"
                >
                  Necklaces
                </Link>
              </li>
              <li>
                <Link
                  to="/category/earrings"
                  className="text-neutral-600 hover:text-amber-900 transition-colors tracking-wide font-light"
                >
                  Earrings
                </Link>
              </li>
              <li>
                <Link
                  to="/category/traditional-jewellery"
                  className="text-neutral-600 hover:text-amber-900 transition-colors tracking-wide font-light"
                >
                  Traditional Jewellery
                </Link>
              </li>
              <li>
                <Link
                  to="/category/bangles"
                  className="text-neutral-600 hover:text-amber-900 transition-colors tracking-wide font-light"
                >
                  Bangles
                </Link>
              </li>
              <li>
                <Link
                  to="/category/daily-wear"
                  className="text-neutral-600 hover:text-amber-900 transition-colors tracking-wide font-light"
                >
                  Daily Wear
                </Link>
              </li>
            </ul>
          </div>

          {/* Client Care & Inquiries */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-serif text-xs uppercase tracking-[0.22em] font-medium text-neutral-900">
              Client Care
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-[13px]">
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-neutral-600 hover:text-amber-900 transition-colors tracking-wide font-light"
                >
                  <span>WhatsApp Enquiries</span>
                  <ArrowRight
                    size={12}
                    className="text-neutral-400 group-hover:translate-x-1 group-hover:text-amber-900 transition-all duration-300"
                  />
                </a>
              </li>
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-neutral-600 hover:text-amber-900 transition-colors tracking-wide font-light"
                >
                  <span>Instagram Direct</span>
                  <ArrowRight
                    size={12}
                    className="text-neutral-400 group-hover:translate-x-1 group-hover:text-amber-900 transition-all duration-300"
                  />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className="border-t border-[#ece6dd] py-6">
        <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-light">
          <p>
            © {new Date().getFullYear()} SIARAH. All rights reserved.
            Handcrafted for timeless moments.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
