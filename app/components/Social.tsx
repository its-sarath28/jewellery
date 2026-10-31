import React from "react";

const INSTAGRAM_URL =
  "https://www.instagram.com/siarahstudio?utm_source=ig_web_button_share_sheet&cplk=ZDNlZDc0MzIxNw==";

const InstagramIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
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

const Social: React.FC = () => {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24 border-t border-[#f2ede6]">
      <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Editorial Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <p className="text-[#caa982] text-xs sm:text-[13px] font-medium tracking-[0.25em] uppercase mb-2">
            A LITTLE MORE SIARAH
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] font-normal text-neutral-900 tracking-tight leading-tight">
            Follow along on Instagram
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-light mt-2 max-w-md mx-auto">
            Discover styling inspiration, new arrivals and moments from our
            world.
          </p>

          <div className="mt-6">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 px-7 py-3 text-xs tracking-[0.22em] font-medium uppercase border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all duration-300"
            >
              <InstagramIcon
                size={14}
                className="transition-transform duration-300 group-hover:scale-110"
              />
              <span>FOLLOW @SIARAHSTUDIO</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Social;
