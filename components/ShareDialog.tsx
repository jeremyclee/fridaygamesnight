"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { CheckIcon, LinkIcon } from "@/components/icons";
import { Modal } from "@/components/Modal";
import { copyText } from "@/lib/browser";

interface ShareDialogProps {
  open: boolean;
  url: string;
  /** "created" right after publishing; "fallback" when automatic copying failed. */
  reason: "created" | "fallback";
  onClose: () => void;
}

export function ShareDialog({ open, url, reason, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(reason === "fallback");

  async function copy() {
    const ok = await copyText(url);
    setCopied(ok);
    setFailed(!ok);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={reason === "created" ? "Your puzzle is ready" : "Copy this link"}
      actions={
        reason === "created" ? (
          <>
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Done
            </Button>
            <Button className="flex-[1.4]" onClick={copy}>
              {copied ? <CheckIcon className="size-5" /> : <LinkIcon className="size-5" />}
              {copied ? "Copied" : "Copy Link"}
            </Button>
          </>
        ) : (
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Done
          </Button>
        )
      }
    >
      {reason === "created" && <p>Send this link to your group. Everyone gets their own board to solve.</p>}
      <input
        readOnly
        value={url}
        aria-label="Puzzle link"
        onFocus={(event) => event.currentTarget.select()}
        className="mt-3 w-full truncate rounded-xl border border-line bg-paper px-3 py-2.5 font-mono text-[13px] text-ink"
      />
      {failed && <p className="mt-2 text-sm">Couldn’t copy automatically. Tap the link above, then copy it.</p>}
    </Modal>
  );
}
