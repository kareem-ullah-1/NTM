import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center bg-cream px-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest/[0.06] text-forest">
        <SearchX className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-serif text-display-lg text-charcoal">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-[14px] text-charcoal/55">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved.
      </p>
      <Button
        asChild
        size="lg"
        className="mt-8 rounded-full px-8"
      >
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  );
}
