import { Text } from "../primitives/Text";
import { Chip } from "../primitives/Chip";

/**
 * The scene canvas — the surface that answers "where are we?" (UX doctrine §2.1, C-2: visuals make the
 * scene readable, prose makes it deep). Compact by default, and the prose is the depth.
 *
 * Everything here is a label the backend supplied and this renders verbatim: the place's own perceived
 * name, its description, its tone. Nothing is derived, nothing is looked up, and there is no map — the
 * FE holds no world truth (D-7).
 *
 * `tone` arrives as one string. It is split on the separator the world itself used only to lay the words
 * out as chips; the words are never reinterpreted, reordered or matched against a known list, because a
 * fixed tone taxonomy would be exactly the hardcoded genre vocabulary GA-3 forbids.
 */
export function SceneCanvas({
  label,
  description,
  tone,
}: {
  label: string;
  description?: string | null;
  tone?: string | null;
}) {
  const tones = (tone ?? "")
    .split(/[·,]/)
    .map((t) => t.trim())
    .filter((t) => t !== "");
  return (
    <section className="dc-scene-canvas" aria-label="Scene">
      <h1 className="dc-scene-canvas__place">{label}</h1>
      {description && (
        <Text tone="muted" italic className="dc-scene-canvas__prose">
          {description}
        </Text>
      )}
      {tones.length > 0 && (
        <div className="dc-scene-canvas__tone">
          {tones.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      )}
    </section>
  );
}
