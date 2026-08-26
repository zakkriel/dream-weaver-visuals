export function Divider({ className = "", ...rest }: { className?: string } & Record<string, unknown>) {
  return <hr className={`dc-divider ${className}`.trim()} {...rest} />;
}
