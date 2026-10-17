import { clueLength, MAX_CLUE_LENGTH } from "@/lib/puzzle-validation";
import { EDGES, type Clues, type Edge } from "@/types/puzzle";

const LABELS: Record<Edge, string> = {
  top: "Top clue",
  right: "Right clue",
  bottom: "Bottom clue",
  left: "Left clue",
};

/** Keep at most MAX_CLUE_LENGTH characters, counting emoji as one. */
function limit(value: string): string {
  const chars = [...value];
  return chars.length > MAX_CLUE_LENGTH ? chars.slice(0, MAX_CLUE_LENGTH).join("") : value;
}

export function clueInputId(edge: Edge) {
  return `clue-${edge}`;
}

interface ClueEditorProps {
  clues: Clues;
  /** The two words each clue connects. */
  pairs: Record<Edge, [string, string]>;
  showErrors: boolean;
  onChange: (edge: Edge, value: string) => void;
  onFocusChange: (edge: Edge | null) => void;
}

export function ClueEditor({ clues, pairs, showErrors, onChange, onFocusChange }: ClueEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      {EDGES.map((edge, index) => {
        const value = clues[edge];
        const length = clueLength(value);
        const missing = showErrors && !value.trim();
        const hintId = `${clueInputId(edge)}-hint`;
        return (
          <div key={edge}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <label htmlFor={clueInputId(edge)} className="text-[15px] font-semibold">
                <span className="mr-1.5 text-clover" aria-hidden="true">
                  {index + 1}.
                </span>
                {LABELS[edge]}
              </label>
              <span id={hintId} className="truncate text-xs font-semibold tracking-wide text-ink-soft uppercase">
                {pairs[edge][0]} + {pairs[edge][1]}
              </span>
            </div>
            <input
              id={clueInputId(edge)}
              value={value}
              onChange={(event) => onChange(edge, limit(event.target.value))}
              onFocus={() => onFocusChange(edge)}
              onBlur={() => onFocusChange(null)}
              placeholder={`Connect ${pairs[edge][0].toLowerCase()} and ${pairs[edge][1].toLowerCase()}`}
              autoComplete="off"
              autoCapitalize="sentences"
              enterKeyHint={index < EDGES.length - 1 ? "next" : "done"}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                const next = EDGES[index + 1];
                if (next) document.getElementById(clueInputId(next))?.focus();
                else event.currentTarget.blur();
              }}
              aria-describedby={hintId}
              aria-invalid={missing || undefined}
              className={`h-12 w-full rounded-2xl border bg-card px-4 text-base text-ink shadow-[0_1px_2px_rgb(32_40_32/0.04)] outline-none placeholder:text-ink-faint focus:border-clover focus:shadow-[0_0_0_3px_var(--color-clover-soft)] ${
                missing ? "border-danger" : "border-line"
              }`}
            />
            <div className="mt-1 flex min-h-4 justify-between text-xs">
              <span className="text-danger">{missing ? "Write a clue for these two words" : ""}</span>
              {length >= MAX_CLUE_LENGTH - 15 && (
                <span className={length >= MAX_CLUE_LENGTH ? "font-semibold text-danger" : "text-ink-soft"}>
                  {length}/{MAX_CLUE_LENGTH}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
