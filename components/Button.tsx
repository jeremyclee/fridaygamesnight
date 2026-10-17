import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-clover text-white shadow-[0_1px_2px_rgb(17_107_41/0.25)] hover:bg-clover-dark active:bg-clover-dark disabled:bg-[#9cc7a7] disabled:shadow-none",
  secondary: "bg-mist text-ink hover:bg-mist-dark active:bg-mist-dark disabled:text-ink-faint",
  ghost: "text-clover-dark hover:bg-clover-wash active:bg-clover-wash",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clover disabled:cursor-not-allowed ${VARIANTS[variant]} ${extra}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function IconButton({ className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`grid size-10 shrink-0 place-items-center rounded-full bg-mist text-ink transition-colors hover:bg-mist-dark active:bg-mist-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clover ${className}`}
      {...props}
    />
  );
}
