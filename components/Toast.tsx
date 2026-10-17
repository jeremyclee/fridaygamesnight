"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ToastMessage {
  text: string;
  action?: { label: string; onClick: () => void };
}

/** One toast at a time; a new message replaces the current one. */
export function useToast(duration = 3500) {
  const [toast, setToast] = useState<(ToastMessage & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(
    (message: ToastMessage) => {
      clearTimeout(timer.current);
      setToast({ ...message, id: Date.now() });
      timer.current = setTimeout(() => setToast(null), duration);
    },
    [duration],
  );
  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, show, dismiss };
}

export function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
    >
      {toast && (
        <div className="animate-rise pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-2.5 pr-2.5 pl-4 text-sm font-medium text-white shadow-[var(--shadow-lift)]">
          <span>{toast.text}</span>
          {toast.action ? (
            <button
              type="button"
              className="rounded-full bg-white/15 px-3 py-1 font-semibold hover:bg-white/25"
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
            >
              {toast.action.label}
            </button>
          ) : (
            <span className="w-1.5" />
          )}
        </div>
      )}
    </div>
  );
}
