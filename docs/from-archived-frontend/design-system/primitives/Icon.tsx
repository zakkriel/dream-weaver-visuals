const PATHS = {
  timeline: <path d="M4 12h16M4 6h10M4 18h7" />,
  actor: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></>,
  location: <><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
  artifact: <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="M12 3v18" /></>,
  "known-world": <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></>,
  gem: <path d="M6 4h12l3 5-9 11L3 9l3-5Z" />,
  warn: <><path d="M12 3l10 18H2L12 3Z" /><path d="M12 10v5M12 18h.01" /></>,
  expand: <><path d="M14 4h6v6" /><path d="M10 20H4v-6" /><path d="M20 4l-7 7M4 20l7-7" /></>,
  collapse: <><path d="M20 10h-6V4" /><path d="M4 14h6v6" /><path d="M14 10l6-6M10 14l-6 6" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  label,
  ...rest
}: { name: IconName; size?: number; label?: string } & Record<string, unknown>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
