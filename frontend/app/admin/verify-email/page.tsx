"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2, MailCheck, TriangleAlert } from "lucide-react";
import { resendAdminVerification, verifyAdminEmail } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";
import { Button } from "@/components/ui/button";

const RESEND_COOLDOWN_SECONDS = 60;

function ResendButton({
  onResend,
  isPending,
  cooldown
}: {
  onResend: () => void;
  isPending: boolean;
  cooldown: number;
}) {
  return (
    <Button className="mt-6 w-full" disabled={isPending || cooldown > 0} onClick={onResend}>
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : cooldown > 0 ? (
        `Resend in ${cooldown}s`
      ) : (
        "Resend Verification Email"
      )}
    </Button>
  );
}

function AdminVerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAdminAuthStore((state) => state.hasHydrated);
  const user = useAdminAuthStore((state) => state.user);
  const setUser = useAdminAuthStore((state) => state.setUser);
  const logout = useAdminAuthStore((state) => state.logout);

  const [cooldown, setCooldown] = React.useState(0);
  const attemptedTokenRef = React.useRef<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: (verifyToken: string) => verifyAdminEmail(verifyToken),
    onSuccess: () => {
      if (user) setUser({ ...user, emailVerified: true });
    }
  });

  const resendMutation = useMutation({
    mutationFn: () => resendAdminVerification(),
    onSuccess: () => setCooldown(RESEND_COOLDOWN_SECONDS)
  });

  React.useEffect(() => {
    if (token && attemptedTokenRef.current !== token) {
      attemptedTokenRef.current = token;
      verifyMutation.mutate(token);
    }

  }, [token]);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loader2 className="h-5 w-5 animate-spin text-charcoal/40" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.replace("/admin");
    return null;
  }

  const verifyError = verifyMutation.isError
    ? verifyMutation.error instanceof ApiRequestError
      ? verifyMutation.error.message
      : "Something went wrong verifying that link."
    : null;
  const resendError = resendMutation.isError
    ? resendMutation.error instanceof ApiRequestError
      ? resendMutation.error.message
      : "Unable to send a new verification email."
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-card border border-charcoal/10 bg-white p-8 text-center shadow-sm">
        {token && verifyMutation.isPending ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest/8 text-forest">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <h1 className="mt-4 font-serif text-2xl text-charcoal">Verifying...</h1>
            <p className="mt-2 text-sm text-charcoal/60">Confirming your admin email address.</p>
          </>
        ) : token && verifyMutation.isSuccess ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest/8 text-forest">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-serif text-2xl text-charcoal">Email Verified</h1>
            <p className="mt-2 text-sm text-charcoal/60">
              Your admin account is active. Continue to the dashboard.
            </p>
            <Button className="mt-6 w-full" onClick={() => router.replace("/admin")}>
              Go to Dashboard
            </Button>
          </>
        ) : token && verifyError ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <TriangleAlert className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-serif text-2xl text-charcoal">Verification Failed</h1>
            <p className="mt-2 text-sm text-charcoal/60">{verifyError}</p>
            <ResendButton
              onResend={() => resendMutation.mutate()}
              isPending={resendMutation.isPending}
              cooldown={cooldown}
            />
            {resendError && <p className="mt-2 text-xs text-red-500">{resendError}</p>}
            {resendMutation.isSuccess && !resendError && (
              <p className="mt-2 text-xs text-forest">A new verification link is on its way.</p>
            )}
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest/8 text-forest">
              <MailCheck className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-serif text-2xl text-charcoal">Verify Your Email</h1>
            <p className="mt-2 text-sm text-charcoal/60">
              We sent a verification link to your admin email address. Please check your inbox and click the
              link to activate your admin account.
            </p>
            <ResendButton
              onResend={() => resendMutation.mutate()}
              isPending={resendMutation.isPending}
              cooldown={cooldown}
            />
            {resendError && <p className="mt-2 text-xs text-red-500">{resendError}</p>}
            {resendMutation.isSuccess && !resendError && (
              <p className="mt-2 text-xs text-forest">A new verification link has been sent.</p>
            )}
            <p className="mt-6 text-xs text-charcoal/50">
              Wrong account?{" "}
              <button
                type="button"
                className="font-medium text-forest hover:underline"
                onClick={() => {
                  logout();
                  router.replace("/admin");
                }}
              >
                Log out
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminVerifyEmailPage() {
  return (
    <React.Suspense fallback={null}>
      <AdminVerifyEmailContent />
    </React.Suspense>
  );
}
