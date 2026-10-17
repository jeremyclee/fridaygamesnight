import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";

interface RevealSolutionDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RevealSolutionDialog({ open, onCancel, onConfirm }: RevealSolutionDialogProps) {
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
          <Button className="flex-[1.2] px-3" onClick={onConfirm}>
            Reveal Solution
          </Button>
        </>
      }
    >
      This will reveal the original card arrangement. Are you sure you want to see the answer?
    </Modal>
  );
}
