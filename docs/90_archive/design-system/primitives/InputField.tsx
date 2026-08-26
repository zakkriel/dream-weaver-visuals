/**
 * A themed text field, single-line or multiline. The play surface's beat input was a raw `<textarea>`
 * carrying inline `var(--dc-*)` styles as an accepted stand-in; this is the primitive that retires it,
 * so the field's surface, border, focus ring and type scale come from the token contract like every
 * other primitive and a skin restyles it with no code change.
 *
 * `label` is the accessible name, the same contract `IconButton` uses — these fields sit under their
 * own heading or beside their own affordances, so a visible `<label>` would duplicate what the
 * surrounding surface already says.
 *
 * `onChange` hands over the VALUE, not the event: the field owns its own event plumbing so callers
 * never reach through `e.target`, and single-line and multiline share one call signature.
 */
export function InputField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 2,
  placeholder,
  disabled = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const cls = ["dc-field", className].filter(Boolean).join(" ");
  const shared = {
    "aria-label": label,
    className: cls,
    value,
    placeholder,
    disabled,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
  };
  return multiline ? <textarea {...shared} rows={rows} /> : <input {...shared} type="text" />;
}
