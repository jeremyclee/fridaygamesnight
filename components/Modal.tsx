"use client";

import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Buttons, laid out side by side. */
  actions: ReactNode;
}

/** A native <dialog>, so focus trapping, Escape and the backdrop come for free. */
export function Modal({ open, onClose, title, children, actions }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Close if the page is hidden by a navigation, so it isn't open when the user comes back.
  useLayoutEffect(() => {
    const dialog = ref.current;
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="animate-rise rounded-3xl bg-card p-5 shadow-[var(--shadow-lift)]">
          <h2 id={titleId} className="text-lg font-bold tracking-tight text-ink">
            {title}
          </h2>
          <div className="mt-2 text-[15px] leading-relaxed text-ink-soft">{children}</div>
          <div className="mt-5 flex gap-2.5">{actions}</div>
        </div>
      )}
    </dialog>
  );
}
