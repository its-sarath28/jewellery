import { ArrowRight, Sparkles } from "lucide-react";
import React from "react";
import { Link } from "react-router";

const Story: React.FC = () => {
  return (
    <section className="bg-[#fcfbf9] py-16 sm:py-20 lg:py-28 border-t border-[#f2ede6] overflow-hidden">
      <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Story Visual Side */}
          <div className="lg:col-span-6 relative">
            {/* Subtle warm architectural backdrop */}
            <div className="absolute -inset-4 bg-[#f4ede4]/60 rounded-sm -rotate-1 pointer-events-none -z-10" />

            {/* Editorial Image Frame */}
            <div className="relative aspect-4/5 w-full overflow-hidden bg-neutral-100 group shadow-2xl shadow-black/5">
              <img
                src="/images/chain.avif"
                alt="The Siarah Story - Handcrafted jewellery and design"
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105 select-none"
              />
              {/* Soft bottom vignette */}
              <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating Luxury Signature Badge */}
            <div className="absolute -bottom-5 right-4 sm:right-8 bg-white/95 backdrop-blur-sm border border-[#e8dfd3] px-5 py-3 shadow-lg shadow-black/5 flex items-center gap-2.5">
              <Sparkles size={16} className="text-[#caa982]" />
              <span className="font-serif text-xs uppercase tracking-[0.2em] text-neutral-800">
                Crafted with intention
              </span>
            </div>
          </div>

          {/* Story Narrative Side */}
          <div className="lg:col-span-6 lg:ps-6 xl:ps-10">
            <div className="max-w-xl">
              {/* Eyebrow */}
              <p className="text-[#caa982] text-xs sm:text-[13px] font-medium tracking-[0.25em] uppercase mb-3">
                THE SIARAH STORY
              </p>

              {/* Main Heading */}
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-neutral-900 tracking-tight leading-[1.14] mb-6">
                Beauty in every detail.
              </h2>

              {/* Narrative Copy */}
              <div className="space-y-4 text-neutral-600 font-light text-sm sm:text-base leading-relaxed mb-8 sm:mb-10">
                <p>
                  At SIARAH, we believe jewellery is more than an accessory. It
                  is a little expression of who you are, a memory you carry and
                  a detail that makes a moment yours.
                </p>
                <p className="text-neutral-500 text-xs sm:text-sm">
                  Each piece is curated with a delicate balance of traditional
                  Indian motifs and timeless, modern sophistication — made to be
                  celebrated, cherished, and worn for every occasion.
                </p>
              </div>

              {/* CTA Button */}
              <div>
                <Link
                  to="/shop"
                  className="group inline-flex items-center gap-3.5 bg-neutral-900 text-white px-7 sm:px-8 py-3.5 sm:py-4 text-xs tracking-[0.22em] font-medium uppercase transition-all duration-300 hover:bg-neutral-800 hover:shadow-xl hover:shadow-black/15 active:scale-[0.99]"
                >
                  <span>EXPLORE SIARAH</span>
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-300 group-hover:translate-x-1.5"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Story;
