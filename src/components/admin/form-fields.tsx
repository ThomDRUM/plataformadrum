"use client";

import { cn } from "@/lib/utils";

const controlClass =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none " +
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="block text-xs font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function TextField({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return <input {...props} className={cn(controlClass, "h-8", className)} />;
}

export function TextAreaField({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(controlClass, "min-h-20 py-2", className)} />;
}

/**
 * `select` nativo em vez do primitivo base-ui: os formulários do admin são
 * grandes e controlados, e o `Select` do base-ui entrega `string | null` no
 * `onValueChange`, o que espalha checagem de nulo por toda parte sem ganho.
 */
export function SelectField({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select {...props} className={cn(controlClass, "h-8 pr-8", className)}>
      {children}
    </select>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{message}</p>
  );
}
