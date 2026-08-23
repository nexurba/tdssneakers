"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import Logo from "./Logo";

export default function Header() {
  const { openCart, totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Read the query string from the browser instead of useSearchParams(), which
  // would force every page out of static prerendering.
  const [query, setQuery] = useState("");
  useEffect(() => {
    setQuery(window.location.search);
  }, [pathname]);

  /** Highlights the entry matching the current path *and* query string. */
  function isActive(href: string): boolean {
    const [path, hrefQuery] = href.split("?");
    if (path !== pathname) return false;
    const current = new URLSearchParams(query);
    if (!hrefQuery) {
      // Plain /boutique is only active when no category/new filter is applied.
      return !current.get("cat") && !current.get("new");
    }
    const [key, val] = hrefQuery.split("=");
    return current.get(key) === val;
  }

  const navLinks = [
    { href: "/", label: "ACCUEIL" },
    { href: "/boutique", label: "BOUTIQUE" },
    { href: "/boutique?cat=sneakers", label: "SNEAKERS" },
    { href: "/boutique?cat=vetements", label: "VÊTEMENTS" },
    { href: "/boutique?cat=accessoires", label: "ACCESSOIRES" },
    { href: "/boutique?new=true", label: "NOUVEAUTÉS" },
    { href: "/promotions", label: "PROMOTIONS" },
    { href: "/a-propos", label: "À PROPOS" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0" aria-label="TDSSNEAKERS — accueil">
          <Logo width={150} priority className="h-auto w-[120px] sm:w-[150px]" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-[13px] font-medium transition-colors hover:text-primary whitespace-nowrap ${
                isActive(link.href)
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-gray-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <Link href="/recherche" className="p-2 hover:text-primary transition-colors" aria-label="Rechercher">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>

          {/* Account */}
          <button className="p-2 hover:text-primary transition-colors" aria-label="Mon compte">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          {/* Cart */}
          <button
            onClick={openCart}
            className="p-2 hover:text-primary transition-colors relative"
            aria-label="Panier"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`block text-sm font-medium ${
                isActive(link.href) ? "text-primary" : "text-gray-800"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
