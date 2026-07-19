import type { Metadata } from "next";
import DetailPageScroll from "@/components/product/DetailPageScroll";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function ProductDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DetailPageScroll />
      {children}
    </>
  );
}
