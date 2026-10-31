import { ArrowRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { FALL_BACK_IMAGE } from "~/constants/data";
import type { Category } from "~/interface/index.interface";
import supabase from "~/lib/supabase";

const getCategoryImage = (cat: Category): string => {
  if (cat.image_url) return cat.image_url;
  const slug = cat.slug?.toLowerCase() || "";
  const name = cat.name?.toLowerCase() || "";
  if (slug.includes("necklace") || name.includes("necklace")) {
    return FALL_BACK_IMAGE;
  }
  return FALL_BACK_IMAGE;
};

const CategorySection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        setCategories(data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <p className="text-[#caa982] text-xs sm:text-[13px] font-medium tracking-[0.24em] uppercase mb-2">
              FIND YOUR FAVOURITE
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] font-normal text-neutral-900 tracking-tight leading-tight">
              Shop by category
            </h2>
          </div>

          <Link
            to="/shop"
            className="group inline-flex items-center gap-2 text-xs sm:text-[13px] uppercase tracking-[0.2em] font-medium text-neutral-700 hover:text-neutral-950 transition-colors self-start sm:self-end pb-1"
          >
            <span className="border-b border-neutral-300 pb-0.5 group-hover:border-neutral-900 transition-colors">
              VIEW ALL
            </span>
            <ArrowRight
              size={15}
              className="text-neutral-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-neutral-950"
              strokeWidth={1.5}
            />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
          {isLoading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-60 w-full bg-neutral-100" />
                  <div className="mt-3.5 flex items-center justify-between">
                    <div className="h-4 bg-neutral-100 w-20" />
                    <div className="h-3.5 w-3.5 bg-neutral-100" />
                  </div>
                </div>
              ))
            : categories.map((cat: Category) => (
                <Link
                  key={cat.id || cat.slug}
                  to={`/category/${cat.slug || cat.id}`}
                  className="group block focus:outline-none"
                >
                  {/* Product Card Image */}
                  <div className="relative h-60 w-full overflow-hidden bg-neutral-100">
                    <img
                      src={getCategoryImage(cat)}
                      alt={cat.name}
                      loading="lazy"
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 select-none"
                    />
                  </div>

                  {/* Title & Arrow */}
                  <div className="mt-3.5 flex items-center justify-between">
                    <p className="font-serif text-sm sm:text-[15px] font-normal text-neutral-900 tracking-wide group-hover:text-amber-900 transition-colors">
                      {cat.name}
                    </p>
                    <ArrowRight
                      size={15}
                      className="text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all duration-300"
                      strokeWidth={1.5}
                    />
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
