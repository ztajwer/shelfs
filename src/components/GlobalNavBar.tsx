"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  activePattern: RegExp;
  label: string;
}

export default function GlobalNavBar() {
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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
    <header className="fixed top-0 left-0 right-0 z-[100] w-full bg-white/70 backdrop-blur-md border-b border-[#D4AF37]/20 px-6 py-4 flex items-center justify-between pointer-events-auto">
      <Link href="/" className="font-serif text-sm tracking-[0.25em] text-[#3E2723] uppercase font-medium">
        MAJ Boutique
      </Link>
      <nav className="flex items-center gap-6">
        {navItems.map((item) => {
          const isActive = item.activePattern.test(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`p-1.5 transition-colors duration-200 ${
                isActive
                  ? "text-[#D4AF37] filter drop-shadow-[0_0_2px_rgba(212,175,55,0.4)]"
                  : "text-[#3E2723]/50 hover:text-[#3E2723]/80"
              }`}
              aria-label={item.label}
            >
              {item.icon}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
