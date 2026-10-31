import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Cart",
  keywords: [
    "shopping cart",
    "fabric cart",
    "checkout fabric order",
    "review cart items",
    "unstitched fabric cart",
    "buy fabric online Pakistan"
  ],
  robots: { index: false, follow: true }
};

export default function CartLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
