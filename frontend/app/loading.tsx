export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-cream px-5 text-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-[1.5px] border-charcoal/10 border-t-charcoal"
        role="status"
        aria-label="Loading"
      />
      <p className="font-serif text-[15px] text-charcoal/60">Loading&hellip;</p>
    </div>
  );
}
