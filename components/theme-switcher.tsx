"use client";

import { useEffect, useState } from "react";

type ThemeName = "boys" | "men" | "girls" | "women";
type ThemeMode = "light" | "dark";

const themes: { value: ThemeName; label: string }[] = [
  { value: "boys", label: "Boys" },
  { value: "men", label: "Men" },
  { value: "girls", label: "Girls" },
  { value: "women", label: "Women" },
];

function applyTheme(theme: ThemeName, mode: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.mode = mode;
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    if (typeof window === "undefined") {
      return "men";
    }

    return (window.localStorage.getItem("dampener-theme") as ThemeName | null) ?? "men";
  });
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return (window.localStorage.getItem("dampener-mode") as ThemeMode | null) ?? "light";
  });

  useEffect(() => {
    applyTheme(theme, mode);
  }, [theme, mode]);

  function handleThemeChange(value: ThemeName) {
    setTheme(value);
    window.localStorage.setItem("dampener-theme", value);
  }

  function handleModeChange() {
    const nextMode = mode === "dark" ? "light" : "dark";

    setMode(nextMode);
    window.localStorage.setItem("dampener-mode", nextMode);
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      <label className="sr-only" htmlFor="theme-select">
        Theme
      </label>
      <select
        id="theme-select"
        value={theme}
        onChange={(event) => handleThemeChange(event.target.value as ThemeName)}
        className="h-9 rounded-full border-0 bg-transparent px-3 text-sm font-medium text-slate-700 outline-none"
      >
        {themes.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleModeChange}
        className="h-9 rounded-full bg-slate-900 px-3 text-sm font-medium text-white transition hover:bg-slate-700"
        aria-pressed={mode === "dark"}
      >
        {mode === "dark" ? "Light" : "Dark"}
      </button>
    </div>
  );
}
