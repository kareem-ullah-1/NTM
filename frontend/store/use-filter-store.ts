import { create } from "zustand";

export type SortOption = "Featured" | "Newest" | "Price low to high" | "Price high to low";

type FilterState = {
  search: string;
  categories: string[];
  fabricTypes: string[];
  collectionSlug: string | null;
  optionSlug: string | null;

  priceRange: [number, number] | null;
  inStockOnly: boolean;
  sortBy: SortOption;
  setSearch: (value: string) => void;
  toggleCategory: (value: string) => void;
  setCategories: (values: string[]) => void;
  toggleFabricType: (value: string) => void;
  setCollectionSlug: (value: string | null) => void;
  setOptionSlug: (value: string | null) => void;
  setPriceRange: (range: [number, number] | null) => void;
  setInStockOnly: (value: boolean) => void;
  setSortBy: (value: SortOption) => void;
  clearFilters: () => void;
};

export const useFilterStore = create<FilterState>((set, get) => ({
  search: "",
  categories: [],
  fabricTypes: [],
  collectionSlug: null,
  optionSlug: null,
  priceRange: null,
  inStockOnly: false,
  sortBy: "Featured",
  setSearch: (value) => set({ search: value }),
  toggleCategory: (value) => {
    const exists = get().categories.includes(value);
    set({
      categories: exists
        ? get().categories.filter((item) => item !== value)
        : [...get().categories, value]
    });
  },
  setCategories: (values) => set({ categories: values }),
  toggleFabricType: (value) => {
    const exists = get().fabricTypes.includes(value);
    set({
      fabricTypes: exists
        ? get().fabricTypes.filter((item) => item !== value)
        : [...get().fabricTypes, value]
    });
  },
  setCollectionSlug: (value) => set({ collectionSlug: value }),
  setOptionSlug: (value) => set({ optionSlug: value }),
  setPriceRange: (range) => set({ priceRange: range }),
  setInStockOnly: (value) => set({ inStockOnly: value }),
  setSortBy: (value) => set({ sortBy: value }),
  clearFilters: () =>
    set({
      search: "",
      categories: [],
      fabricTypes: [],
      collectionSlug: null,
      optionSlug: null,
      priceRange: null,
      inStockOnly: false,
      sortBy: "Featured"
    })
}));
