import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <input
          type={type}
          className={`flex h-10 w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
            error ? "border-red-500/80 focus:ring-red-500/50" : "focus:border-white/20"
          } ${className || ""}`}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-red-500/90">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
