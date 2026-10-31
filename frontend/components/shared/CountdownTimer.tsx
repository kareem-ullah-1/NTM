"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CountdownTimerProps = {
  targetDate: string | Date;
  label?: string;
  expiredLabel?: string;
  onComplete?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

function calculateTimeLeft(target: Date) {
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CountdownTimer({
  targetDate,
  label = "ENDS IN",
  expiredLabel = "OFFER ENDED",
  onComplete,
  className,
  size = "md",
  showLabel = true
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState(() =>
    calculateTimeLeft(new Date(targetDate))
  );
  const [completed, setCompleted] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      const next = calculateTimeLeft(new Date(targetDate));
      setTimeLeft(next);
      if (next.total <= 0 && !completed) {
        setCompleted(true);
        onComplete?.();
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate, completed, onComplete]);

  if (completed || timeLeft.total <= 0) {
    return (
      <div className={cn("text-center", className)}>
        {showLabel && (
          <p className="text-overline uppercase text-charcoal/40">{expiredLabel}</p>
        )}
      </div>
    );
  }

  const segments = [
    { value: timeLeft.days > 0 ? timeLeft.days : timeLeft.hours, label: timeLeft.days > 0 ? "D" : "H" },
    { value: timeLeft.days > 0 ? timeLeft.hours : timeLeft.minutes, label: timeLeft.days > 0 ? "H" : "M" },
    { value: timeLeft.days > 0 ? timeLeft.minutes : timeLeft.seconds, label: timeLeft.days > 0 ? "M" : "S" }
  ];

  const sizeClasses = {
    sm: "gap-1.5",
    md: "gap-2",
    lg: "gap-3"
  };

  const digitClasses = {
    sm: "text-sm font-medium w-7 h-7",
    md: "text-lg font-medium w-10 h-10",
    lg: "text-2xl font-medium w-14 h-14"
  };

  const labelClasses = {
    sm: "text-[8px]",
    md: "text-[9px]",
    lg: "text-[10px]"
  };

  return (
    <div className={cn("text-center", className)}>
      {showLabel && (
        <p className="text-overline uppercase text-charcoal/40 mb-2">{label}</p>
      )}
      <div className={cn("inline-flex items-center", sizeClasses[size])}>
        {segments.map((segment, index) => (
          <React.Fragment key={segment.label}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center rounded-lg bg-charcoal/[0.04] text-charcoal font-serif",
                  digitClasses[size]
                )}
              >
                {pad(segment.value)}
              </div>
              <span className={cn("mt-1 text-charcoal/35 uppercase tracking-wider", labelClasses[size])}>
                {segment.label}
              </span>
            </div>
            {index < segments.length - 1 && (
              <span className={cn("text-charcoal/20 font-medium self-start mt-1", size === "lg" ? "text-lg" : "text-sm")}>:</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function InlineCountdown({ targetDate }: { targetDate: string | Date }) {
  const [timeLeft, setTimeLeft] = React.useState(() =>
    calculateTimeLeft(new Date(targetDate))
  );

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(new Date(targetDate)));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.total <= 0) return null;

  return (
    <span className="text-[10px] font-medium text-rust-dark">
      ENDS {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
      {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
    </span>
  );
}
