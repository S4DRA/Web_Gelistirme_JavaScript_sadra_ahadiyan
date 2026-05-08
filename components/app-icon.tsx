type AppIconProps = {
  name: string;
  className?: string;
  solid?: boolean;
};

export function AppIcon({ name, className = "", solid = false }: AppIconProps) {
  return (
    <i
      aria-hidden="true"
      className={`app-icon fi-${solid ? "sr" : "rr"}-${name} ${className}`}
    />
  );
}
