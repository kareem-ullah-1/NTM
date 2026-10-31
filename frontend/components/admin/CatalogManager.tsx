"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CategoryList } from "@/components/admin/catalog/CategoryList";
import { FabricTypeList } from "@/components/admin/catalog/FabricTypeList";
import { HomeFeaturedCategoryList } from "@/components/admin/catalog/HomeFeaturedCategoryList";

const tabs = [
  { key: "categories", label: "Categories" },
  { key: "home-featured", label: "Home Featured" },
  { key: "fabric-types", label: "Fabric Types" }
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function CatalogManager() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("categories");

  return (
    <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5">
      <div className="mb-6 flex gap-0.5 border-b border-charcoal/[0.06]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-charcoal text-charcoal"
                : "border-transparent text-charcoal/45 hover:text-charcoal/70"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "categories" && <CategoryList />}
      {activeTab === "home-featured" && <HomeFeaturedCategoryList />}
      {activeTab === "fabric-types" && <FabricTypeList />}
    </div>
  );
}
