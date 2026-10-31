"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center bg-cream px-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-maroon/[0.06] text-maroon">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-serif text-display-lg text-charcoal">
        Something Went Wrong
      </h1>
      <p className="mt-3 max-w-md text-[14px] text-charcoal/55">
        We hit an unexpected error loading this page. You can try again or head
        back home.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Button
          size="lg"
          onClick={reset}
          className="rounded-full px-8"
        >
          Try Again
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="rounded-full px-8"
        >
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
