import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type V = "primary" | "glass" | "ghost";
const v: Record<V, string> = {
  primary: "bg-accent text-accent-foreground ring-1 ring-accent hover:scale-[1.02]",
  glass: "bg-glass-strong text-foreground ring-1 ring-border hover:bg-glass",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-glass",
};

export function Btn({ variant = "glass", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: V }) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] px-3.5 py-2 text-[13px] font-medium transition disabled:pointer-events-none disabled:opacity-50",
        v[variant],
        className,
      )}
    />
  );
}

export function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "rounded-full px-3 py-1 text-[12px] ring-1 transition-colors",
            o === value ? "bg-accent/20 text-foreground ring-accent/50" : "text-muted-foreground ring-border hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{children}</div>;
}
