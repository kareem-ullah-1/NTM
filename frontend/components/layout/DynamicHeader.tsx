"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/use-ui-store";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { AccountNav } from "@/components/layout/AccountNav";
import { useQuery } from "@tanstack/react-query";
import { fetchEnabledCollections } from "@/lib/api/collections";
import type { ApiCollection } from "@/lib/api/types";

const navContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } }
};
const navItemVariants: Variants = {
  hidden: { opacity: 0, y: -4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-charcoal/20">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 6c4 -3 14 -3 18 0M3 12c4 -3 14 -3 18 0M3 18c4 -3 14 -3 18 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="font-serif text-[15px] font-medium tracking-[0.06em] text-charcoal sm:text-base">
        NTM FABRICS
      </span>
    </span>
  );
}

type NavItem = {
  label: string;
  href: string;
  children: { label: string; href: string }[];
};

function buildNavItems(collections: ApiCollection[]): NavItem[] {
  if (!collections || collections.length === 0) {
    return [
      {
        label: "Shop",
        href: "/shop",
        children: [
          { label: "All Products", href: "/shop" },
          { label: "New Arrivals", href: "/shop?sort=Newest" },
          { label: "Featured", href: "/shop?featured=true" }
        ]
      }
    ];
  }

  return collections.map((collection) => {

    const activeOptions = collection.options?.filter((o) => o.isActive) ?? [];
    const customLinks = collection.navLinks?.filter((l) => l.label && l.href);

    let children: { label: string; href: string }[];

    if (activeOptions.length > 0) {

      children = activeOptions.map((opt) => ({
        label: opt.name,
        href: `/shop?collection=${encodeURIComponent(collection.slug)}&option=${encodeURIComponent(opt.slug)}`
      }));

      children.push({
        label: `All ${collection.name}`,
        href: `/shop?collection=${encodeURIComponent(collection.slug)}`
      });
    } else if (customLinks && customLinks.length > 0) {

      children = customLinks;
    } else {
      children = [
        { label: `All ${collection.name}`, href: `/shop?collection=${encodeURIComponent(collection.slug)}` },
        { label: "New Arrivals", href: `/shop?collection=${encodeURIComponent(collection.slug)}&sort=Newest` },
        { label: "View All Products", href: "/shop" }
      ];
    }

    return {
      label: collection.name,
      href: `/shop?collection=${encodeURIComponent(collection.slug)}`,
      children
    };
  });
}

export function DynamicHeader() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [hideNav, setHideNav] = React.useState(false);
  const [hoveredLink, setHoveredLink] = React.useState<string | null>(null);
  const openMobileNav = useUiStore((state) => state.openMobileNav);
  const pathname = usePathname();
  const reduced = useReducedMotion();

  const { data: collections = [] } = useQuery({
    queryKey: ["collections", "public"],
    queryFn: fetchEnabledCollections,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const navigation = React.useMemo(() => buildNavItems(collections), [collections]);

  React.useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const SHOW_ZONE = 120; // always visible near the top of the page
    const THRESHOLD = 8; // ignore tiny jitters so it never flickers

    function evaluate() {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 32);

      const delta = currentY - lastY;
      if (currentY <= SHOW_ZONE) {
        setHideNav(false);
      } else if (Math.abs(delta) > THRESHOLD) {
        setHideNav(delta > 0); // scrolling down (delta > 0) hides it
      }
      lastY = currentY;
      ticking = false;
    }

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(evaluate);
        ticking = true;
      }
    }

    evaluate();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <motion.header
      animate={{ y: !reduced && hideNav ? "-100%" : "0%" }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "fixed inset-x-0 z-50 transition-[background-color,box-shadow,top] duration-300",
        hideNav ? "top-0" : "top-8",
        isScrolled
          ? "header-glass border-b border-charcoal/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          : "bg-transparent"
      )}
    >
      <div className="relative mx-auto flex h-[72px] max-w-[1400px] items-center px-5 sm:px-8 lg:px-12">
        {}
        <motion.nav
          className="hidden items-center gap-0 lg:flex"
          aria-label="Primary navigation"
          variants={reduced ? undefined : navContainerVariants}
          initial="hidden"
          animate="show"
          onMouseLeave={() => setHoveredLink(null)}
        >
          {navigation.map((link) => {
            const showUnderline = hoveredLink === link.label;
            return (
              <motion.div
                key={link.label}
                variants={reduced ? undefined : navItemVariants}
                className="group relative"
                onMouseEnter={() => setHoveredLink(link.label)}
              >
                <Link
                  href={link.href}
                  className="relative z-10 flex items-center gap-1 px-4 py-2 text-[13px] font-medium tracking-wide text-charcoal/70 transition-colors duration-200 hover:text-charcoal"
                  aria-haspopup="menu"
                >
                  {link.label}
                  <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180 text-charcoal/40" />
                </Link>

                {}
                <div className="invisible absolute left-0 top-full z-30 w-60 translate-y-3 rounded-[10px] border border-charcoal/[0.08] bg-white p-2 opacity-0 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] transition-all duration-250 group-hover:visible group-hover:translate-y-2 group-hover:opacity-100">
                  <p className="px-3 pb-2 pt-1.5 text-overline uppercase text-charcoal/35">
                    {link.label}
                  </p>
                  <div className="border-t border-charcoal/[0.06] pt-1">
                    {link.children.map((child, index) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className={cn(
                          "block rounded-lg px-3 py-2.5 text-[13px] text-charcoal/65 transition-colors duration-200 hover:bg-forest/[0.04] hover:text-forest",
                          index === link.children.length - 1 &&
                            "mt-1 border-t border-charcoal/[0.06] pt-3 font-medium text-forest"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {showUnderline && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-4 -bottom-px h-[1.5px] rounded-full bg-charcoal"
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 400, damping: 35 }
                    }
                  />
                )}
              </motion.div>
            );
          })}
        </motion.nav>

        {}
        <button
          onClick={openMobileNav}
          aria-label="Open menu"
          className="absolute left-5 flex h-10 w-10 items-center justify-center rounded-full text-charcoal/70 transition-colors hover:bg-charcoal/5 sm:left-8 lg:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        {}
        <Link
          href="/"
          aria-label="NTM Fabrics home"
          className="absolute left-1/2 z-10 flex -translate-x-1/2 items-center whitespace-nowrap"
        >
          <BrandMark />
        </Link>

        {}
        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <HeaderSearch />
          <AccountNav />
        </div>
      </div>
    </motion.header>
  );
}
