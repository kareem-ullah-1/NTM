"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { DynamicMobileNav } from "@/components/layout/DynamicMobileNav";
import { WhatsAppFloat } from "@/components/shared/whatsapp-float";

export function ConditionalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      <DynamicMobileNav />
      <main className={isAdmin ? "" : "pt-[104px]"}>{children}</main>
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppFloat />}
    </>
  );
}
