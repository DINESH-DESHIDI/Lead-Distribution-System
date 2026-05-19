import * as React from "react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={`flex h-10 w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-all appearance-none cursor-pointer ${
              error ? "border-red-500/80 focus:ring-red-500/50" : "focus:border-white/20"
            } ${className || ""}`}
            ref={ref}
            {...props}
          >
            <option value="" disabled className="bg-neutral-900 text-muted-foreground">
              Select a service type...
            </option>
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-neutral-950 text-white"
              >
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom Arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && (
          <p className="text-xs font-medium text-red-500/90">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
