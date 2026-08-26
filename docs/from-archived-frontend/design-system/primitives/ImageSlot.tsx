import { useState } from "react";
import type { CSSProperties } from "react";

/** D-8: placeholder first, swap on load. Never blocks layout on image arrival. */
export function ImageSlot({
  src,
  alt,
  ratio = "16 / 9",
  className = "",
  style,
  ...rest
}: { src?: string; alt: string; ratio?: string; className?: string; style?: CSSProperties } & Record<string, unknown>) {
  const [loaded, setLoaded] = useState(false);
  const cls = ["dc-imageslot", loaded && "dc-imageslot--loaded", className].filter(Boolean).join(" ");
  return (
    <div className={cls} style={{ aspectRatio: ratio, ...style }} {...rest}>
      <div className="dc-imageslot__placeholder" aria-hidden="true" />
      {src && (
        <img className="dc-imageslot__img" src={src} alt={alt} onLoad={() => setLoaded(true)} />
      )}
    </div>
  );
}
