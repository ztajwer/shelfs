"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  activePattern: RegExp;
}

export default function TopNavBar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const navItems: NavItem[] = [
    {
      label: "Home",
      href: "/",
      activePattern: /^\/$/,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "22px", height: "22px" }}>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "Rings",
      href: "/product/pro1",
      activePattern: /^\/product\/pro(1|7)$/,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "22px", height: "22px" }}>
          <circle cx="12" cy="14" r="6" />
          <path d="M12 2l3 3-3 3-3-3z" />
        </svg>
      ),
    },
    {
      label: "Necklaces",
      href: "/product/pro4",
      activePattern: /^\/product\/pro(4|9)$/,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "22px", height: "22px" }}>
          <path d="M6 3c2 4 4 6 6 6s4-2 6-6" />
          <path d="M12 9v4" />
          <circle cx="12" cy="15" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "Bracelets",
      href: "/product/pro2",
      activePattern: /^\/product\/pro(2|3|8)$/,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "22px", height: "22px" }}>
          <ellipse cx="12" cy="12" rx="9" ry="5" />
          <circle cx="6" cy="10" r="1.2" fill="currentColor" />
          <circle cx="9" cy="13" r="1.2" fill="currentColor" />
          <circle cx="12" cy="14" r="1.2" fill="currentColor" />
          <circle cx="15" cy="13" r="1.2" fill="currentColor" />
          <circle cx="18" cy="10" r="1.2" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-auto max-w-[95%] pointer-events-auto">
      <nav className="flex items-center justify-between gap-6 sm:gap-8 px-6 py-2 rounded-full bg-white/75 border-[1.5px] border-[#D4AF37]/50 shadow-[0_10px_35px_rgba(0,0,0,0.1),0_0_20px_rgba(212,175,55,0.2),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl transition-all duration-300">
        {navItems.map((item) => {
          const isActive = item.activePattern.test(pathname);
          return (
            <Link
              key={item.label}
              href={item.href}
              className="group relative flex items-center justify-center gap-2 px-3 py-1.5 rounded-full select-none outline-none transition-all duration-200 active:scale-95"
              aria-label={item.label}
            >
              <div
                className={`transition-all duration-300 transform group-hover:scale-105 ${
                  isActive
                    ? "text-[#3E2723] drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]"
                    : "text-[#3E2723]/50 group-hover:text-[#3E2723]/80"
                }`}
              >
                {item.icon}
              </div>
              <span
                className={`font-serif text-[11px] uppercase tracking-[0.18em] transition-colors duration-300 ${
                  isActive
                    ? "text-[#3E2723] font-semibold"
                    : "text-[#3E2723]/40 group-hover:text-[#3E2723]/75"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_#D4AF37]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
