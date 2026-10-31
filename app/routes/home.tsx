import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import Hero from "../components/Hero";
import CategorySection from "~/components/CategorySection";
import JustArrived from "~/components/JustArrived";
import Story from "~/components/Story";
import Social from "~/components/Social";
import Footer from "~/components/Footer";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "~/constants/data";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Siarah | Handcrafted & Custom-Made Luxury Jewellery" },
    {
      name: "description",
      content:
        "Discover Siarah's bespoke handcrafted jewellery. From custom-made bridal necklaces and regal harams to artisan earrings and bangles, each heirloom piece is thoughtfully made to order.",
    },
    {
      name: "keywords",
      content:
        "custom made jewellery, bespoke jewellery, handcrafted luxury jewellery, custom bridal jewellery, artisan jewellery, made to order jewellery, personalized jewellery, heirloom necklaces, bridal harams, antique gold polish jewellery, designer Indian jewellery, Siarah, Siarah jewellery",
    },
    {
      property: "og:title",
      content: "Siarah | Handcrafted & Custom-Made Luxury Jewellery",
    },
    {
      property: "og:description",
      content:
        "Discover Siarah's bespoke handcrafted jewellery. From custom-made bridal necklaces and regal harams to artisan earrings and bangles, each heirloom piece is thoughtfully made to order.",
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

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans relative">
      <Navbar />

      <main className="flex-1">
        <Hero />
        <CategorySection />
        <JustArrived />
        <Story />
        <Social />
      </main>

      <Footer />

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20SIARAH!%20I%20would%20like%20to%20know%20more%20about%20your%20collection.`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors"
      >
        <MessageCircle className="size-5" />
      </a>
    </div>
  );
}
