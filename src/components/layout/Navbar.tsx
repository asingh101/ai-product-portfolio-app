"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { mainNavLinks, isNavLinkLocked, type NavLink } from "@/data/navigation";

function NavItem({
  link,
  isActive,
  onNavigate,
  variant,
}: {
  link: NavLink;
  isActive: boolean;
  onNavigate?: () => void;
  variant: "desktop" | "mobile";
}) {
  const locked = isNavLinkLocked(link);

  const desktopClass = locked
    ? "text-on-surface-variant/60 cursor-pointer flex items-center gap-1"
    : isActive
      ? "font-bold text-primary border-b-2 border-primary"
      : "text-on-surface-variant hover:text-on-surface";

  const mobileClass = locked
    ? "text-on-surface-variant/60 flex items-center gap-2"
    : isActive
      ? "bg-primary-fixed text-on-primary-fixed font-bold"
      : "text-on-surface-variant hover:bg-surface-container-low";

  const className =
    variant === "desktop"
      ? `font-[family-name:var(--font-headline)] tracking-tight text-base font-medium transition-all duration-300 ${desktopClass}`
      : `px-4 py-3 rounded-xl text-sm font-medium font-[family-name:var(--font-headline)] transition-colors ${mobileClass}`;

  return (
    <Link href={link.href} className={className} onClick={onNavigate} aria-disabled={locked}>
      <span>{link.label}</span>
      {locked && (
        <>
          <span className="material-symbols-outlined text-[16px] opacity-70" aria-hidden>
            lock
          </span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 hidden sm:inline">
            Soon
          </span>
        </>
      )}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="fixed top-0 w-full z-50 glass-header shadow-ambient">
      <div className="flex items-center justify-between px-6 md:px-8 py-4 max-w-7xl mx-auto">
        <Link
          href="/"
          className="text-3xl font-black tracking-tighter text-on-surface font-[family-name:var(--font-headline)] hover:text-primary transition-colors"
        >
          Ankit Singh
        </Link>

        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          {mainNavLinks.map((link) => (
            <NavItem
              key={link.href}
              link={link}
              isActive={pathname === link.href}
              variant="desktop"
            />
          ))}
        </div>

        <button
          className="lg:hidden p-2 rounded-lg hover:bg-surface-container-low transition-colors"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <span className="material-symbols-outlined text-on-surface">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      <div
        className={`lg:hidden px-6 pb-6 bg-surface-container-lowest/95 backdrop-blur-lg transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-1">
          {mainNavLinks.map((link) => (
            <NavItem
              key={link.href}
              link={link}
              isActive={pathname === link.href}
              variant="mobile"
              onNavigate={() => setMobileMenuOpen(false)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
