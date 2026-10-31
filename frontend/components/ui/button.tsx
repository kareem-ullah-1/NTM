import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium",
    "transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:translate-y-px"
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-forest text-cream hover:bg-forest-light",
        outline:
          "border border-forest text-forest bg-transparent hover:bg-forest hover:text-cream",
        ghost: "bg-transparent text-charcoal hover:bg-charcoal/5",
        sand: "bg-sand text-cream hover:bg-sand-dark",
        rust: "bg-rust text-cream hover:bg-rust-dark",
        whatsapp: "bg-[#25D366] text-white hover:bg-[#1DA851]",
        link: "text-forest underline-offset-4 hover:underline active:translate-y-0"
      },
      size: {
        default: "h-11 min-h-[44px] px-6",
        sm: "h-9 min-h-[36px] px-4 text-xs",
        lg: "h-12 min-h-[48px] px-8 text-base",
        icon: "h-10 w-10 min-h-[40px] min-w-[40px] rounded-full"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
