"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-maroon/8 text-maroon">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-serif text-3xl text-charcoal">Something Went Wrong</h1>
      <p className="mt-3 max-w-md text-charcoal/60">
        We hit an unexpected error loading this admin page. You can try again or return to the dashboard.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Button size="lg" onClick={reset}>
          Try Again
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
