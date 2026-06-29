"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { getAllProducts } from "@/lib/products";
import { prefetchProductGlb } from "@/lib/modelPreload";
import { getProductDetailDisplaySize } from "@/lib/productDetailDisplay";
import { getBoutiquePhoneDisplay, openWhatsAppInquiry } from "@/lib/whatsapp";

const ProductDetailCanvas = dynamic(() => import("@/components/product/ProductDetailCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[280px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-maj-gold/25 border-t-maj-gold" />
        <p className="font-display text-sm italic tracking-[0.22em] text-maj-brown/45">Presenting piece…</p>
      </div>
    </div>
  ),
});

interface ProductDetailViewProps {
  product: Product;
}

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280,
  );
  const phoneDisplay = getBoutiquePhoneDisplay();
  const displaySize = getProductDetailDisplaySize(product, viewportWidth);
  const others = getAllProducts().filter((item) => item.id !== product.id).slice(0, 3);

  useEffect(() => {
    prefetchProductGlb(product.modelFile);
    const sync = () => setViewportWidth(window.innerWidth);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [product.modelFile]);

  return (
    <div className="product-detail-immersive relative z-[60] w-full min-h-[100dvh] text-maj-brown">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Image
          src={viewportWidth < 768 ? "/main_mob_bg.png" : "/background.png"}
          alt=""
          fill
          priority
          sizes="100vw"
          className="product-detail-bg-image object-cover"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[#F3E8DC]/72 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1]/55 via-[#F5EBE0]/35 to-[#EDE0D0]/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#FAF6F1]/88 lg:to-[#FFFBF7]/92" />
      </div>

      <Link
        href="/"
        className="product-detail-back fixed left-4 top-4 z-40 inline-flex items-center gap-2 font-sans text-[9px] uppercase tracking-[0.34em] text-maj-brown/75 transition hover:text-maj-gold sm:left-6 sm:top-6 sm:text-[10px]"
      >
        <span className="text-base leading-none">←</span>
        Back to Boutique
      </Link>

      <div className="relative mx-auto flex w-full max-w-[1480px] flex-col px-0 pb-32 pt-14 sm:pt-16 lg:flex-row lg:items-start lg:gap-6 lg:px-8 lg:pb-20 lg:pt-20 xl:gap-10">
        <section className="relative w-full shrink-0 px-3 pt-0 sm:px-4 lg:sticky lg:top-20 lg:flex-1 lg:self-start lg:px-0">
          <div className="relative mx-auto h-[34dvh] min-h-[220px] max-h-[340px] w-full sm:h-[38dvh] sm:max-h-[380px] lg:h-[min(72vh,760px)] lg:max-h-[760px] lg:min-h-[420px]">
            <ProductDetailCanvas product={product} displaySize={displaySize} />
          </div>
          <p className="pointer-events-none mt-3 text-center font-sans text-[8px] uppercase tracking-[0.38em] text-maj-brown/42 sm:text-[9px]">
            Drag to rotate · Tap for details · Pinch or scroll to zoom
          </p>
        </section>

        <aside className="product-glass-panel relative z-30 mx-3 mb-10 mt-4 w-[calc(100%-1.5rem)] shrink-0 sm:mx-5 lg:mx-0 lg:mb-16 lg:mt-0 lg:w-[min(100%,460px)] xl:w-[480px]">
          <div className="animate-fade-up px-7 py-10 sm:px-9 sm:py-12 lg:px-10 lg:py-14">
            <p className="font-sans text-[10px] uppercase tracking-[0.48em] text-maj-brown/50 sm:text-[11px]">
              {product.category}
            </p>

            <h1 className="mt-4 font-display text-[clamp(2.4rem,8.5vw,3.5rem)] font-light leading-[1.08] tracking-[0.03em] text-maj-brown sm:mt-5">
              {product.title}
            </h1>

            <p className="mt-3 font-display text-[clamp(1.1rem,3.8vw,1.45rem)] font-light italic tracking-[0.1em] text-maj-brown-mid/85">
              {product.tagline}
            </p>

            <div className="my-6 h-px w-full bg-gradient-to-r from-maj-gold/45 via-maj-gold/15 to-transparent sm:my-8" />

            <p className="font-sans text-[14px] leading-[1.88] text-maj-brown/78 sm:text-[15px] sm:leading-[1.95]">
              {product.description}
            </p>

            <p className="mt-6 font-sans text-[10px] uppercase tracking-[0.36em] text-maj-brown/55 sm:mt-8 sm:text-[11px]">
              {product.materials}
            </p>

            <ul className="mt-5 space-y-3">
              {product.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 font-sans text-[14px] leading-relaxed text-maj-brown/72 sm:text-[15px]"
                >
                  <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rotate-45 border border-maj-gold/80 bg-maj-gold/30" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-9 border-t border-maj-gold/15 pt-8 sm:mt-10">
              <p className="font-sans text-[10px] uppercase tracking-[0.38em] text-maj-brown/45 sm:text-[11px]">Price</p>
              <p className="mt-3 font-display text-[clamp(1.75rem,5.5vw,2.25rem)] tracking-[0.05em] text-maj-brown">
                {product.price}
              </p>
              <p className="mt-2 font-sans text-[12px] text-maj-brown/48 sm:text-[13px]">
                Inclusive of boutique presentation · {phoneDisplay}
              </p>
            </div>

            <button
              type="button"
              onClick={() => openWhatsAppInquiry(product.title)}
              className="product-inquiry-gold mt-9 w-full px-8 py-4 font-sans text-[12px] uppercase tracking-[0.4em] transition active:scale-[0.99] sm:mt-10 sm:py-5 sm:text-[13px]"
            >
              Contact on WhatsApp
            </button>

            <div className="mt-10 border-t border-maj-gold/12 pt-8 sm:mt-12">
              <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-maj-brown/42 sm:text-[11px]">
                More from the collection
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {others.map((item) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    className="rounded-full border border-maj-gold/22 bg-white/40 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.22em] text-maj-brown/65 transition hover:border-maj-gold/45 hover:bg-white/65 hover:text-maj-gold sm:text-[11px]"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="product-detail-whatsapp-bar">
        <button
          type="button"
          onClick={() => openWhatsAppInquiry(product.title)}
          className="product-detail-whatsapp-btn"
        >
          <span className="product-detail-whatsapp-btn__icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </span>
          <span className="product-detail-whatsapp-btn__text">
            WhatsApp · {phoneDisplay}
          </span>
        </button>
      </div>
    </div>
  );
}
