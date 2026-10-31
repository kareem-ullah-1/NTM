import { MessageCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { buildGeneralWhatsappLink } from "@/lib/whatsapp";

type WhatsAppButtonProps = ButtonProps & {
  href?: string;
  label?: string;
};

export function WhatsAppButton({ href, label = "Order on WhatsApp", className, ...props }: WhatsAppButtonProps) {
  return (
    <Button
      asChild
      variant="whatsapp"
      className={className}
      {...props}
    >
      <a href={href ?? buildGeneralWhatsappLink()} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4" />
        {label}
      </a>
    </Button>
  );
}
