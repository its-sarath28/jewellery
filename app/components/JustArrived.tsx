import { ArrowRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { FALL_BACK_IMAGE } from "~/constants/data";
import type { Product } from "~/interface/index.interface";
import supabase from "~/lib/supabase";

const JustArrived: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setProducts(data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-[#faf8f5] py-16 sm:py-20 lg:py-24">
      <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <p className="text-[#caa982] text-xs sm:text-[13px] font-medium tracking-[0.24em] uppercase mb-1.5">
              JUST ARRIVED
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] font-normal text-neutral-900 tracking-tight leading-tight">
              New beginnings
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-light mt-1.5">
              Fresh finds, curated with love.
            </p>
          </div>

          <Link
            to="/new-arrivals"
            className="group inline-flex items-center gap-2 text-xs sm:text-[13px] uppercase tracking-[0.2em] font-medium text-neutral-700 hover:text-neutral-950 transition-colors self-start sm:self-end pb-1"
          >
            <span className="border-b border-neutral-300 pb-0.5 group-hover:border-neutral-900 transition-colors">
              DISCOVER ALL
            </span>
            <ArrowRight
              size={15}
              className="text-neutral-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-neutral-950"
              strokeWidth={1.5}
            />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {isLoading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square w-full bg-neutral-200/60" />
                  <div className="mt-3.5 space-y-2">
                    <div className="h-4 bg-neutral-200/60 w-3/4" />
                    <div className="h-3.5 bg-neutral-200/60 w-1/4" />
                  </div>
                </div>
              ))
            : products.map((product: Product) => {
                const imageUrl =
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : FALL_BACK_IMAGE;

                return (
                  <Link
                    key={product.id || product.slug}
                    to={`/product/${product.slug || product.id}`}
                    className="group block focus:outline-none"
                  >
                    {/* Product Card Image */}
                    <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 select-none"
                      />
                    </div>

                    {/* Product Title and Price */}
                    <div className="mt-3.5">
                      <h3 className="font-serif text-sm sm:text-[15px] font-normal text-neutral-900 tracking-wide group-hover:text-amber-900 transition-colors">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs sm:text-sm font-medium text-neutral-900">
                          ₹{product.price}
                        </span>
                        {product.original_price &&
                          product.original_price > product.price && (
                            <span className="text-xs sm:text-[13px] font-normal text-neutral-400 line-through">
                              ₹{product.original_price}
                            </span>
                          )}
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
};

export default JustArrived;
