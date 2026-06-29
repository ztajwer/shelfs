"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useLuxuryParallax, CINEMATIC_PARALLAX } from "@/hooks/useLuxuryParallax";
import styles from "./LuxuryHero.module.css";

export interface LuxuryHeroProps {
  imageSrc?: string;
  imageAlt?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** Background parallax range in px (10–20) */
  bgParallaxPx?: number;
  /** Typography parallax — slower for depth */
  textParallaxPx?: number;
}

const DEFAULT_IMAGE = "/background.png";

export default function LuxuryHero({
  imageSrc = DEFAULT_IMAGE,
  imageAlt = "MAJ Boutique interior",
  eyebrow = "MAJ Boutique",
  title = "Timeless Elegance",
  subtitle = "An immersive sanctuary of fine jewelry and couture — crafted for those who move through the world with quiet confidence.",
  bgParallaxPx = CINEMATIC_PARALLAX.bgRangePx,
  textParallaxPx = CINEMATIC_PARALLAX.textRangePx,
}: LuxuryHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgMediaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLuxuryParallax(sectionRef, bgMediaRef, contentRef, {
    ...CINEMATIC_PARALLAX,
    bgRangePx: bgParallaxPx,
    textRangePx: textParallaxPx,
  });

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealTargets = content.querySelectorAll("[data-hero-reveal]");
    if (reducedMotion) return;

    const tween = gsap.fromTo(
      revealTargets,
      { y: 48, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.45,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.35,
      },
    );

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.hero} aria-label="Hero">
      <div className={styles.media} aria-hidden>
        <div className={styles.bgLayer}>
          <div ref={bgMediaRef} className={styles.bgMedia}>
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              sizes="100vw"
              className={styles.bgImage}
              draggable={false}
            />
          </div>
        </div>
        <div className={styles.vignette} />
        <div className={styles.grain} />
      </div>

      <div ref={contentRef} className={styles.content}>
        <p className={styles.eyebrow} data-hero-reveal>
          {eyebrow}
        </p>
        <div className={styles.rule} data-hero-reveal aria-hidden />
        <h1 className={styles.title} data-hero-reveal>
          {title}
        </h1>
        <p className={styles.subtitle} data-hero-reveal>
          {subtitle}
        </p>
      </div>
    </section>
  );
}
