import type { Metadata } from "next";
import LuxuryHero from "@/components/LuxuryHero";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `Hero | ${siteConfig.name}`,
  description: "Luxury hero experience with cinematic parallax and motion.",
  alternates: { canonical: "/hero" },
};

export default function HeroPage() {
  return (
    <main className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-[#1a1410]">
      <LuxuryHero />
    </main>
  );
}
