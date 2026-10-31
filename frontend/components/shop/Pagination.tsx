"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function buildPageWindow(page: number, totalPages: number): (number | "ellipsis")[] {
  const siblingCount = 1;
  const totalVisible = siblingCount * 2 + 5; // first, last, current, 2 siblings, 2 ellipses

  if (totalPages <= totalVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const leftSiblingIndex = Math.max(page - siblingCount, 1);
  const rightSiblingIndex = Math.min(page + siblingCount, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  const pages: (number | "ellipsis")[] = [1];

  if (showLeftEllipsis) {
    pages.push("ellipsis");
  } else {
    for (let i = 2; i < leftSiblingIndex; i++) pages.push(i);
  }

  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    if (i !== 1 && i !== totalPages) pages.push(i);
  }

  if (showRightEllipsis) {
    pages.push("ellipsis");
  } else {
    for (let i = rightSiblingIndex + 1; i < totalPages; i++) pages.push(i);
  }

  pages.push(totalPages);

  return pages;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageWindow = buildPageWindow(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-lg border border-charcoal/15 px-2.5 text-xs font-medium text-charcoal/70 transition-colors sm:px-3 sm:text-sm",
          "hover:bg-charcoal/5 disabled:pointer-events-none disabled:opacity-40"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <div className="flex items-center gap-1 sm:gap-1.5">
        {pageWindow.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="inline-flex h-9 w-9 items-center justify-center text-charcoal/40"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors sm:text-sm",
                item === page
                  ? "bg-forest text-cream"
                  : "text-charcoal/70 hover:bg-charcoal/5"
              )}
            >
              {item}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-lg border border-charcoal/15 px-2.5 text-xs font-medium text-charcoal/70 transition-colors sm:px-3 sm:text-sm",
          "hover:bg-charcoal/5 disabled:pointer-events-none disabled:opacity-40"
        )}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
