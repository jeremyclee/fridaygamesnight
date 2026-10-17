import type { HTMLAttributes, ReactNode, Ref } from "react";

/** 5 → 3+2, 4 → 2+2, otherwise a single row. */
function splitRows<T>(items: T[]): T[][] {
  if (items.length === 5) return [items.slice(0, 3), items.slice(3)];
  if (items.length === 4) return [items.slice(0, 2), items.slice(2)];
  return [items];
}

interface CardTrayProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  cards: { key: string; node: ReactNode }[];
  highlighted?: boolean;
}

/**
 * Unplaced cards. Always two card-rows tall so the board above never moves as
 * cards come and go; the remaining cards re-centre themselves.
 */
export function CardTray({ ref, cards, highlighted = false, className = "", ...props }: CardTrayProps) {
  return (
    <div
      ref={ref}
      className={`tray-area rounded-3xl transition-colors ${highlighted ? "bg-clover-wash" : ""} ${className}`}
      data-testid="tray"
      {...props}
    >
      {splitRows(cards).map((row, index) => (
        <div key={index} className="flex justify-center gap-[var(--gap)]">
          {row.map((card) => (
            <div key={card.key}>{card.node}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
