import { create } from "zustand";

type UiState = {
  isMobileNavOpen: boolean;
  isMobileFilterOpen: boolean;
  isCartPreviewOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  openMobileFilter: () => void;
  closeMobileFilter: () => void;
  openCartPreview: () => void;
  closeCartPreview: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  isMobileNavOpen: false,
  isMobileFilterOpen: false,
  isCartPreviewOpen: false,
  openMobileNav: () => set({ isMobileNavOpen: true }),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  openMobileFilter: () => set({ isMobileFilterOpen: true }),
  closeMobileFilter: () => set({ isMobileFilterOpen: false }),
  openCartPreview: () => set({ isCartPreviewOpen: true }),
  closeCartPreview: () => set({ isCartPreviewOpen: false })
}));
