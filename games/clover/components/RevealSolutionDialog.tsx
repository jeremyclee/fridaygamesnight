import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";

interface RevealSolutionDialogProps {
  open: boolean;
  /** Waiting for the answer to load. */
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RevealSolutionDialog({ open, pending, error, onCancel, onConfirm }: RevealSolutionDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Reveal the solution?"
      actions={
        <>
          <Button variant="secondary" className="flex-[0.8] px-3" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-[1.2] px-3" onClick={onConfirm} disabled={pending}>
            {pending ? "Revealing…" : error ? "Try Again" : "Reveal Solution"}
          </Button>
        </>
      }
    >
      This will reveal the original card arrangement. Are you sure you want to see the answer?
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}
