import { useState } from "react";

/**
 * A face, or the silhouette that stands in for one (D-8).
 *
 * No picture is the ordinary state, so it gets a drawn silhouette — never a spinner, never a broken
 * glyph, never a hole that shifts the layout when art arrives. The frame keeps its size either way.
 *
 * Decorative: wherever this is drawn the name is the adjacent text, so labelling the image would
 * make a screen reader say it twice.
 */
export function Portrait({
  src,
  className = "",
  active = false,
}: {
  src?: string | undefined;
  className?: string;
  active?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const show = src !== undefined && !broken;

  return (
    <span
      className={`dc-portrait relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${
        active ? "dc-portrait-active" : ""
      } ${className}`}
    >
      {show ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <svg aria-hidden viewBox="0 0 64 64" className="size-full">
          <defs>
            <linearGradient id="dc-sil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(233,227,211,0.16)" />
              <stop offset="100%" stopColor="rgba(233,227,211,0.05)" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="24" r="11" fill="url(#dc-sil)" />
          <path d="M10 62c0-13 10-21 22-21s22 8 22 21z" fill="url(#dc-sil)" />
        </svg>
      )}
    </span>
  );
}
