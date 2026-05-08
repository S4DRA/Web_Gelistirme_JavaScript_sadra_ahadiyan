type AppIconProps = {
  name: string;
  className?: string;
  solid?: boolean;
};

export function AppIcon({ name, className = "", solid = false }: AppIconProps) {
  if (name === "linkedin") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`app-icon ${className}`}
        fill="currentColor"
      >
        <path d="M6.94 8.98H3.9v9.78h3.04V8.98ZM5.42 4.2a1.76 1.76 0 1 0 0 3.52 1.76 1.76 0 0 0 0-3.52Zm13.68 8.95c0-2.95-1.57-4.32-3.66-4.32a3.16 3.16 0 0 0-2.86 1.57h-.04V8.98H9.62v9.78h3.04v-4.84c0-1.28.24-2.52 1.83-2.52 1.56 0 1.58 1.46 1.58 2.6v4.76h3.03v-5.61Z" />
      </svg>
    );
  }

  if (name === "instagram") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`app-icon ${className}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="12" cy="12" r="3.4" />
        <path d="M17.4 6.7h.01" />
      </svg>
    );
  }

  return (
    <i
      aria-hidden="true"
      className={`app-icon fi-${solid ? "sr" : "rr"}-${name} ${className}`}
    />
  );
}
