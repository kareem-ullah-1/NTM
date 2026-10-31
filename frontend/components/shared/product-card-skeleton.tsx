export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] border border-charcoal/[0.06] bg-white">
      <div className="aspect-[3/4] animate-pulse bg-charcoal/[0.06]" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-2 w-14 animate-pulse rounded-full bg-charcoal/[0.06]" />
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-charcoal/[0.06]" />
        <div className="h-2.5 w-20 animate-pulse rounded bg-charcoal/[0.06]" />
        <div className="mt-1 h-3 w-24 animate-pulse rounded bg-charcoal/[0.06]" />
      </div>
    </div>
  );
}
