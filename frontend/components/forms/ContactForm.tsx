"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { contactFormSchema, type ContactFormValues } from "@/lib/validations";
import { useToastStore } from "@/store/use-toast-store";
import { submitContactMessage } from "@/lib/api/contact";
import { ApiRequestError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FieldProps = {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  registration: ReturnType<
    ReturnType<typeof useForm<ContactFormValues>>["register"]
  >;
};

function FloatingField({
  id,
  label,
  type = "text",
  placeholder,
  error,
  multiline,
  registration
}: FieldProps) {
  const Comp = multiline ? "textarea" : "input";
  return (
    <div className="relative">
      <Comp
        id={id}
        type={multiline ? undefined : type}
        placeholder={placeholder ?? " "}
        rows={multiline ? 5 : undefined}
        className={cn(
          "peer w-full rounded-field border bg-white px-4 pb-2 pt-5 text-[14px] text-charcoal placeholder-transparent transition-colors focus:outline-none focus:ring-2",
          multiline ? "min-h-[130px] resize-none" : "h-14",
          error
            ? "border-rust/50 focus:border-rust focus:ring-rust/20"
            : "border-charcoal/15 focus:border-forest focus:ring-forest/15"
        )}
        {...registration}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-4 top-4 origin-left text-[14px] text-charcoal/40 transition-all",
          "peer-placeholder-shown:top-4 peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-charcoal/40",
          "peer-focus:top-2 peer-focus:text-[11px] peer-focus:tracking-wide peer-focus:text-forest",
          "top-2 text-[11px] tracking-wide"
        )}
      >
        {label}
      </label>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1.5 flex items-center gap-1 text-[12px] text-rust-dark"
          >
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ContactForm() {
  const showToast = useToastStore((state) => state.showToast);
  const [submitted, setSubmitted] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactFormSchema) });

  const submitMutation = useMutation({
    mutationFn: submitContactMessage,
    onSuccess: () => {
      showToast("Message sent — we'll reply soon.");
      reset();
      setSubmitted(true);
    },
    onError: (error) => {
      showToast(
        error instanceof ApiRequestError
          ? error.message
          : "Failed to send message. Please try again.",
        "error"
      );
    }
  });

  function onSubmit(values: ContactFormValues) {
    submitMutation.mutate(values);
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center justify-center px-6 py-16 text-center"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 18 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-forest/10"
        >
          <Check className="h-6 w-6 text-forest" strokeWidth={3} />
        </motion.span>
        <h3 className="mt-5 font-serif text-display-sm font-medium text-charcoal">
          Message sent
        </h3>
        <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-charcoal/55">
          Thank you for reaching out. Our team usually replies within one
          business day.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-6 rounded-full"
          onClick={() => setSubmitted(false)}
        >
          Send another message
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <FloatingField
          id="name"
          label="Full name"
          error={errors.name?.message}
          registration={register("name")}
        />
        <FloatingField
          id="email"
          label="Email address"
          type="email"
          error={errors.email?.message}
          registration={register("email")}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FloatingField
          id="phone"
          label="Phone (03XXXXXXXXX)"
          error={errors.phone?.message}
          registration={register("phone")}
        />
        <FloatingField
          id="subject"
          label="Subject"
          error={errors.subject?.message}
          registration={register("subject")}
        />
      </div>
      <FloatingField
        id="message"
        label="Your message"
        multiline
        error={errors.message?.message}
        registration={register("message")}
      />
      <Button
        type="submit"
        size="lg"
        disabled={submitMutation.isPending}
        className="h-12 w-full rounded-full text-[14px] font-semibold tracking-wide sm:w-auto sm:px-10"
      >
        {submitMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Message"
        )}
      </Button>
    </form>
  );
}
