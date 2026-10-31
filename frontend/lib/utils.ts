import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { siteConfig } from "./site-config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return `${siteConfig.currencySymbol} ${amount.toLocaleString("en-PK")}`;
}
