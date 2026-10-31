import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative w-full min-h-[85vh] lg:min-h-[88vh] flex items-center overflow-hidden bg-neutral-950">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=2000&q=90"
          alt="A touch of tradition - jewellery collection"
          className="w-full h-full object-cover object-[60%_35%] md:object-[65%_35%] lg:object-center select-none"
          priority-hint="high"
        />

        {/* Studio Lighting Gradient Overlays for optimal readability */}
        {/* Horizontal gradient: deep shadow on left behind text fading smoothly to the right */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(12, 10, 9, 0.78) 0%, rgba(12, 10, 9, 0.6) 30%, rgba(12, 10, 9, 0.25) 55%, rgba(12, 10, 9, 0.05) 75%, transparent 100%)",
          }}
        />

        {/* Soft top-to-bottom shading for seamless header blend */}
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/30 pointer-events-none" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-[90%] mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
        <div className="max-w-xl">
          {/* Eyebrow / Collection Tagline */}
          <p className="text-[#caa982] text-xs sm:text-sm font-medium tracking-[0.25em] uppercase mb-4 sm:mb-6">
            THE SIARAH EDIT
          </p>

          {/* Editorial Headline */}
          <h1 className="font-serif text-white text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-normal leading-[1.08] sm:leading-[1.04] tracking-tight mb-5 sm:mb-6 drop-shadow-sm">
            A touch of
            <br />
            tradition. A
            <br />
            world of
            <br />
            elegance.
          </h1>

          {/* Subtitle / Supporting copy */}
          <p className="text-neutral-200/90 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-md mb-8 sm:mb-10">
            Discover pieces that celebrate your story, your style and every
            beautiful occasion.
          </p>

          {/* CTA Button */}
          <Link
            to="/shop"
            className="group inline-flex items-center gap-3 bg-white text-neutral-900 px-6 sm:px-8 py-3.5 sm:py-4 text-xs tracking-[0.2em] font-semibold uppercase transition-all duration-300 hover:bg-neutral-100 hover:shadow-xl hover:shadow-black/25 active:scale-[0.99]"
          >
            <span>Explore the collection</span>
            <ArrowRight className="w-4 h-4 text-neutral-900 transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
