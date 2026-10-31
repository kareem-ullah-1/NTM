"use client";

import * as React from "react";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { buildGeneralWhatsappLink } from "@/lib/whatsapp";

export function WhatsAppFloat() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => setShowTooltip(true), 4000);
    return () => clearTimeout(timer);
  }, [isVisible]);

  React.useEffect(() => {
    if (!showTooltip) return;
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, [showTooltip]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-3 w-56 rounded-[10px] border border-charcoal/[0.08] bg-white p-4 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)]"
          >
            <button
              onClick={() => setShowTooltip(false)}
              aria-label="Close tooltip"
              className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-charcoal/30 hover:text-charcoal/60"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="text-[13px] font-medium text-charcoal">
              Need help choosing fabric?
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-charcoal/50">
              Chat with our team on WhatsApp for personalised recommendations.
            </p>
            {}
            <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-charcoal/[0.08] bg-white" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={buildGeneralWhatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_-2px_rgba(37,211,102,0.4)] transition-shadow duration-300 hover:shadow-[0_6px_28px_-2px_rgba(37,211,102,0.5)]"
      >
        {}
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20" />

        <MessageCircle className="h-6 w-6 relative z-10 transition-transform duration-200 group-hover:rotate-12" />
      </motion.a>
    </div>
  );
}
