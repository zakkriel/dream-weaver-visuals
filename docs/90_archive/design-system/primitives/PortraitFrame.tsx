import type { CSSProperties } from "react";

/**
 * A face, or the silhouette that stands in for one (D-8). `src` absent is the ordinary state — a
 * picture arriving later is a payload change, never something this client subscribes to.
 *
 * An EMPTY `alt` marks the portrait decorative: use it wherever the subject's name is already
 * adjacent text, so a screen reader is not handed the same name twice. The silhouette follows suit —
 * an `img` role with no accessible name is worse than no role at all.
 */
export function PortraitFrame({
  src,
  alt,
  active = false,
  size = 64,
  className = "",
  style,
  ...rest
}: { src?: string; alt: string; active?: boolean; size?: number; className?: string; style?: CSSProperties } & Record<string, unknown>) {
  const cls = ["dc-portrait", active && "dc-portrait--active", className].filter(Boolean).join(" ");
  return (
    <span className={cls} style={{ width: size, height: size, ...style }} {...rest}>
      {src
        ? <img className="dc-portrait__img" src={src} alt={alt} />
        : <span className="dc-portrait__empty" {...(alt === "" ? { "aria-hidden": true } : { role: "img", "aria-label": alt })} />}
    </span>
  );
}
