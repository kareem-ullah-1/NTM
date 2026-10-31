"use client";

import { Search } from "lucide-react";
import { useFilterStore } from "@/store/use-filter-store";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ShopSearchInputProps = {
  className?: string;
};

export function ShopSearchInput({ className }: ShopSearchInputProps) {
  const search = useFilterStore((state) => state.search);
  const setSearch = useFilterStore((state) => state.setSearch);

  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search fabrics..."
        className="h-11 pl-10"
        aria-label="Search fabrics"
      />
    </div>
  );
}
