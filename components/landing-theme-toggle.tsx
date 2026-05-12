"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/components/app-icon";

type LandingTheme = "dark" | "light";

const storageKey = "dampener-landing-theme";

function getPreferredTheme(): LandingTheme {
  const savedTheme = window.localStorage.getItem(storageKey);

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyLandingTheme(theme: LandingTheme) {
  document.documentElement.dataset.landingTheme = theme;
}

export function LandingThemeToggle() {
  const [theme, setTheme] = useState<LandingTheme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const preferredTheme = getPreferredTheme();
    applyLandingTheme(preferredTheme);

    const frame = requestAnimationFrame(() => {
      setTheme(preferredTheme);
      setReady(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  function handleToggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    applyLandingTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="landing-theme-toggle"
      aria-label={`Switch landing page to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={theme === "dark"}
      suppressHydrationWarning
    >
      <span className="landing-theme-toggle-track" aria-hidden="true">
        <span className="landing-theme-toggle-thumb">
          <AppIcon name={theme === "dark" ? "moon" : "sun"} solid={theme === "dark"} />
        </span>
      </span>
      <span className="landing-theme-toggle-label">
        {ready && theme === "light" ? "Light" : "Dark"}
      </span>
    </button>
  );
}
