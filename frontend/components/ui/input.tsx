import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-lg border border-charcoal/15 bg-white px-4 text-sm text-charcoal shadow-[0_1px_0_rgba(26,26,24,0.02)]",
      "placeholder:text-charcoal/40",
      "transition-[border-color,box-shadow] duration-150",
      "hover:border-charcoal/25",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-cream focus-visible:border-forest/40",
      "disabled:cursor-not-allowed disabled:bg-charcoal/[0.03] disabled:opacity-60",
      "aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus-visible:ring-red-400/40",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
