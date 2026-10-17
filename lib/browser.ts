import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * False during server rendering and hydration, true afterwards. Lets
 * components read localStorage in a state initializer without a hydration
 * mismatch: render once with defaults, then remount with stored state.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** Copy text, falling back to a hidden textarea. Resolves false if both fail. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
