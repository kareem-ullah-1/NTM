import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest/8 text-forest">
        <SearchX className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-serif text-3xl text-charcoal">Page Not Found</h1>
      <p className="mt-3 max-w-md text-charcoal/60">
        This admin page doesn&apos;t exist or may have been moved.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/admin">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
