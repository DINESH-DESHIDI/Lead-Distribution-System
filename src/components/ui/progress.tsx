import * as React from "react";

export interface ProgressProps {
  value: number; // percentage value from 0 to 100
  className?: string;
  barClassName?: string;
}

export function Progress({ value, className, barClassName }: ProgressProps) {
  const percentage = Math.max(0, Math.min(100, value));

  // Determine progress bar fill colors dynamically based on percentage
  let defaultBarColor = "bg-emerald-500"; // full / high quota
  if (percentage <= 30) {
    defaultBarColor = "bg-rose-500 animate-pulse"; // running out of quota (<= 3/10)
  } else if (percentage <= 60) {
    defaultBarColor = "bg-amber-500"; // medium quota (<= 6/10)
  }

  return (
    <div
      className={`h-2 w-full rounded-full bg-border overflow-hidden ${
        className || ""
      }`}
    >
      <div
        className={`h-full transition-all duration-500 ease-out ${
          barClassName || defaultBarColor
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
