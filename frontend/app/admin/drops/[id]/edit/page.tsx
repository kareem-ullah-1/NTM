"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  getProductDrop,
  updateProductDrop,
} from "@/lib/api/product-drops";
import { queryKeys } from "@/lib/api/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToastStore } from "@/store/use-toast-store";
import { ApiRequestError } from "@/lib/api/client";

function toLocalDatetime(dateStr: string) {
  const d = new Date(dateStr);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function AdminDropEditPage() {
  const params = useParams();
  const router = useRouter();
  const dropId = params.id as string;
  const showToast = useToastStore((s) => s.showToast);
  const queryClient = useQueryClient();

  const { data: drop, isLoading: loadingDrop } = useQuery({
    queryKey: [...queryKeys.productDrops.all, dropId],
    queryFn: () => getProductDrop(dropId),
  });

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [maxQuantity, setMaxQuantity] = React.useState("");
  const [perCustomerLimit, setPerCustomerLimit] = React.useState("");
  const [specialPrice, setSpecialPrice] = React.useState("");
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");

  React.useEffect(() => {
    if (drop) {
      setName(drop.name);
      setDescription(drop.description ?? "");
      setMaxQuantity(String(drop.maxQuantity));
      setPerCustomerLimit(String(drop.perCustomerLimit));
      setSpecialPrice(drop.specialPrice ? String(drop.specialPrice) : "");
      setStartsAt(toLocalDatetime(drop.startsAt));
      setEndsAt(toLocalDatetime(drop.endsAt));
    }
  }, [drop]);

  const mutation = useMutation({
    mutationFn: () =>
      updateProductDrop(dropId, {
        name,
        description: description || undefined,
        maxQuantity: Number(maxQuantity),
        perCustomerLimit: perCustomerLimit
          ? Number(perCustomerLimit)
          : undefined,
        specialPrice: specialPrice ? Number(specialPrice) : null,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      }),
    onSuccess: () => {
      showToast("Drop updated");
      queryClient.invalidateQueries({
        queryKey: queryKeys.productDrops.all,
      });
      router.push(`/admin/drops/${dropId}`);
    },
  });

  const error =
    mutation.error instanceof ApiRequestError
      ? mutation.error.message
      : mutation.isError
        ? "Failed to update drop."
        : null;

  if (loadingDrop) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-[13px] text-charcoal/50">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading drop...
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="py-20 text-center">
        <p className="text-[13px] font-medium text-charcoal/70">Drop not found</p>
        <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => router.push("/admin/drops")}>
          Back to Drops
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href={`/admin/drops/${dropId}`}
        className="inline-flex items-center gap-1.5 text-[12px] text-charcoal/45 hover:text-charcoal"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Drop
      </Link>

      <div>
        <h1 className="font-serif text-2xl text-charcoal">Edit Drop</h1>
        <p className="text-sm text-charcoal/55">{drop.name}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="rounded-[10px] border border-charcoal/[0.06] bg-white p-6 space-y-6"
      >
        {/* Basic Information */}
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
            Basic Information
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-name" className="text-[12px]">
                Drop Name
              </Label>
              <Input
                id="edit-name"
                className="mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="text-[12px]">Product</Label>
              <div className="mt-1.5 rounded-lg border border-charcoal/15 bg-charcoal/[0.02] px-3 py-2.5 text-[13px] text-charcoal/60">
                {drop.product?.name ?? "—"} (cannot be changed)
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="edit-description" className="text-[12px]">
                Description
              </Label>
              <Input
                id="edit-description"
                className="mt-1.5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
            Pricing & Inventory
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="edit-qty" className="text-[12px]">
                Drop Quantity
              </Label>
              <Input
                id="edit-qty"
                type="number"
                className="mt-1.5"
                value={maxQuantity}
                onChange={(e) => setMaxQuantity(e.target.value)}
                min={String(drop.soldQuantity)}
                required
              />
              {drop.soldQuantity > 0 && (
                <p className="mt-1 text-[11px] text-charcoal/40">
                  Min: {drop.soldQuantity} (already sold)
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-limit" className="text-[12px]">
                Per Customer Limit
              </Label>
              <Input
                id="edit-limit"
                type="number"
                className="mt-1.5"
                value={perCustomerLimit}
                onChange={(e) => setPerCustomerLimit(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="edit-price" className="text-[12px]">
                Drop Price
              </Label>
              <Input
                id="edit-price"
                type="number"
                className="mt-1.5"
                value={specialPrice}
                onChange={(e) => setSpecialPrice(e.target.value)}
                placeholder="Regular price"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
            Schedule
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-starts" className="text-[12px]">
                Start Date & Time
              </Label>
              <Input
                id="edit-starts"
                type="datetime-local"
                className="mt-1.5"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-ends" className="text-[12px]">
                End Date & Time
              </Label>
              <Input
                id="edit-ends"
                type="datetime-local"
                className="mt-1.5"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {error && <p className="text-[12px] text-red-500">{error}</p>}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => router.push(`/admin/drops/${dropId}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            className="rounded-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
