import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";

interface CheckBoardDialogProps {
  open: boolean;
  /** Waiting for the server to check the board. */
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CheckBoardDialog({ open, pending, error, onCancel, onConfirm }: CheckBoardDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Check your board?"
      actions={
        <>
          <Button variant="secondary" className="flex-[0.8] px-3" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-[1.2] px-3" onClick={onConfirm} disabled={pending}>
            {pending ? "Checking…" : error ? "Try Again" : "Check Board"}
          </Button>
        </>
      }
    >
      Cards in the right spot and orientation stay put. The rest go back to the tray for a second try. You can only
      check once, and after that you can reveal the full solution.
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}
