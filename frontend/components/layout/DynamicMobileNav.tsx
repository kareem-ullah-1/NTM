"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { drawerTransition, overlayTransition } from "@/lib/motion";
import { ChevronRight, LogOut, X } from "lucide-react";
import { useUiStore } from "@/store/use-ui-store";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { fetchEnabledCollections } from "@/lib/api/collections";
import type { ApiCollection } from "@/lib/api/types";

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } }
};
const itemVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

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

export function DynamicMobileNav() {
  const { isMobileNavOpen, closeMobileNav } = useUiStore();
  const router = useRouter();
  const reduced = useReducedMotion();
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const role = useAdminAuthStore((state) => state.user?.role);
  const logout = useAdminAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const isAdmin = isAuthenticated && role === "admin";

  const { data: collections = [] } = useQuery({
    queryKey: ["collections", "public"],
    queryFn: fetchEnabledCollections,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const navigation = buildNavItems(collections);

  function handleLogout() {
    logout();
    queryClient.clear();
    closeMobileNav();
    router.replace("/");
  }

  return (
    <AnimatePresence>
      {isMobileNavOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0 } : overlayTransition}
            className="fixed inset-0 z-[70] bg-charcoal/40 backdrop-blur-sm"
            onClick={closeMobileNav}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: reduced ? 0 : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: reduced ? 0 : "100%" }}
            transition={reduced ? { duration: 0 } : drawerTransition}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="fixed inset-y-0 right-0 z-[80] flex w-[85vw] max-w-sm flex-col bg-cream"
          >
            {}
            <div className="flex items-center justify-between border-b border-charcoal/[0.06] px-6 py-5">
              <span className="font-serif text-lg text-charcoal">Menu</span>
              <button
                onClick={closeMobileNav}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal/60 transition-colors hover:bg-charcoal/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {}
            <motion.nav
              className="flex-1 overflow-y-auto px-6 pt-4"
              variants={reduced ? undefined : listVariants}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={reduced ? undefined : itemVariants}>
                <Link
                  href="/"
                  onClick={closeMobileNav}
                  className="block border-b border-charcoal/[0.06] py-4 font-serif text-xl text-charcoal transition-colors hover:text-forest"
                >
                  Home
                </Link>
              </motion.div>

              <Accordion type="single" collapsible>
                {navigation.map((link) => (
                  <motion.div key={link.label} variants={reduced ? undefined : itemVariants}>
                    <AccordionItem value={link.label} className="border-b border-charcoal/[0.06]">
                      <AccordionTrigger className="font-serif text-xl font-normal py-4 hover:text-forest">
                        {link.label}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1 border-l border-forest/20 pl-4 pb-3">
                          <Link
                            href={link.href}
                            onClick={closeMobileNav}
                            className="flex items-center justify-between py-2 text-sm font-medium text-forest"
                          >
                            Shop {link.label}
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                          {link.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              onClick={closeMobileNav}
                              className="block py-2 text-sm text-charcoal/60 transition-colors hover:text-forest"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>

              {}
              <motion.div variants={reduced ? undefined : itemVariants}>
                <Link
                  href="/shop"
                  onClick={closeMobileNav}
                  className="block border-b border-charcoal/[0.06] py-4 font-serif text-xl text-charcoal transition-colors hover:text-forest"
                >
                  Shop All
                </Link>
              </motion.div>
            </motion.nav>

            {isAdmin && (
              <div className="border-t border-charcoal/[0.06] px-6 pt-5 pb-3">
                <Link
                  href="/admin"
                  onClick={closeMobileNav}
                  className="flex items-center gap-3 py-2.5 text-sm font-medium text-forest"
                >
                  Admin Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 py-2.5 text-sm text-charcoal/65 transition-colors hover:text-maroon"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            )}

            <div className="px-6 pb-6 pt-2">
              <WhatsAppButton className="w-full justify-center" size="default" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
