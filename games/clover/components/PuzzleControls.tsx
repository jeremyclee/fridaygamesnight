import { Button } from "@/components/Button";
import { ArrowLeftIcon, BulbIcon, CheckIcon, ResetIcon } from "@/components/icons";

type PuzzleControlsProps =
  | {
      mode: "play";
      canReset: boolean;
      onReset: () => void;
      /** Players check first; the full solution unlocks after that. */
      checked: boolean;
      canCheck: boolean;
      onCheck: () => void;
      onReveal: () => void;
    }
  | { mode: "solution"; onBack: () => void };

export function PuzzleControls(props: PuzzleControlsProps) {
  return (
    <div className="flex shrink-0 gap-2.5 pt-2 whitespace-nowrap">
      {props.mode === "play" ? (
        <>
          <Button key="reset" variant="secondary" onClick={props.onReset} disabled={!props.canReset} className="px-4">
            <ResetIcon className="size-[18px]" />
            Reset
          </Button>
          {props.checked ? (
            <Button key="reveal" onClick={props.onReveal} className="flex-1 px-4">
              <BulbIcon className="size-5 max-[350px]:hidden" />
              Reveal Solution
            </Button>
          ) : (
            <Button key="check" onClick={props.onCheck} disabled={!props.canCheck} className="flex-1 px-4">
              <CheckIcon className="size-5 max-[350px]:hidden" strokeWidth={2.6} />
              Check Board
            </Button>
          )}
        </>
      ) : (
        <Button key="back" onClick={props.onBack} className="flex-1">
          <ArrowLeftIcon className="size-5" strokeWidth={2.4} />
          Back to Puzzle
        </Button>
      )}
    </div>
  );
}
