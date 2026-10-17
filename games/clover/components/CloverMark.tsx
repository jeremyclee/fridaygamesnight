import type { SVGProps } from "react";

/** A plain four-leaf mark. Not the So Clover! logo. */
export function CloverMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <g fill="currentColor">
        <rect x="3" y="3" width="12" height="12" rx="6" ry="6" />
        <rect x="17" y="3" width="12" height="12" rx="6" ry="6" />
        <rect x="3" y="17" width="12" height="12" rx="6" ry="6" />
        <rect x="17" y="17" width="12" height="12" rx="6" ry="6" />
      </g>
      <rect x="13" y="13" width="6" height="6" rx="1.5" fill="#fafaf7" />
    </svg>
  );
}
