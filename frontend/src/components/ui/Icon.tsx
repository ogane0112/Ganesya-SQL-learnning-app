import type { SVGProps } from "react";

/**
 * Small inline icon set (20×20, 1.75 stroke). Kept in-repo so the app has no
 * icon-library dependency and every icon shares one visual weight.
 */
type IconName =
  | "play"
  | "check"
  | "x"
  | "alert"
  | "info"
  | "chevronLeft"
  | "chevronDown"
  | "database"
  | "table"
  | "lightbulb"
  | "globe"
  | "lock"
  | "bolt"
  | "shield"
  | "spinner";

const PATHS: Record<IconName, React.ReactNode> = {
  play: <path d="M7 4.5v11l9-5.5-9-5.5z" fill="currentColor" stroke="none" />,
  check: <path d="M4 10.5l4 4 8-9" />,
  x: <path d="M5 5l10 10M15 5L5 15" />,
  alert: (
    <>
      <path d="M10 3.5 2.5 16.5h15L10 3.5z" />
      <path d="M10 8v4M10 14.5h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9v5M10 6.5h.01" />
    </>
  ),
  chevronLeft: <path d="M12.5 4.5 7 10l5.5 5.5" />,
  chevronDown: <path d="M4.5 7.5 10 13l5.5-5.5" />,
  database: (
    <>
      <ellipse cx="10" cy="5" rx="6.5" ry="2.5" />
      <path d="M3.5 5v10c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V5" />
      <path d="M3.5 10c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="14" height="12" rx="1.5" />
      <path d="M3 8.5h14M8 8.5V16" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M7 14.5h6M8 17h4" />
      <path d="M6 8.5a4 4 0 1 1 8 0c0 1.8-1 2.6-1.6 3.5-.3.5-.4 1-.4 1.5H8c0-.5-.1-1-.4-1.5C7 11.1 6 10.3 6 8.5z" />
    </>
  ),
  globe: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M2.5 10h15M10 2.5c2.3 2.3 3.2 5 3.2 7.5s-.9 5.2-3.2 7.5c-2.3-2.3-3.2-5-3.2-7.5S7.7 4.8 10 2.5z" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
    </>
  ),
  bolt: <path d="M11 2.5 4.5 11H10l-1 6.5L15.5 9H10l1-6.5z" />,
  shield: <path d="M10 2.5 4 5v5c0 3.5 2.5 6.3 6 7.5 3.5-1.2 6-4 6-7.5V5l-6-2.5z" />,
  spinner: (
    <path
      d="M10 3a7 7 0 0 1 7 7"
      className="origin-center animate-spin"
      strokeLinecap="round"
    />
  ),
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
