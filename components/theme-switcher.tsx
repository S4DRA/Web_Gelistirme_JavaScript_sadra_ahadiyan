"use client";

import { useEffect, useState } from "react";

type ThemeName = "default" | "boys" | "men" | "girls" | "women" | "hampoiel";
type ThemeMode = "light" | "dark";
type ThemeContrast = "modern" | "high";

const themes: { value: ThemeName; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "boys", label: "Turbo" },
  { value: "men", label: "Executive" },
  { value: "girls", label: "Spark" },
  { value: "women", label: "Elegance" },
  { value: "hampoiel", label: "Hampoiel" },
];

function applyTheme(theme: ThemeName, mode: ThemeMode, contrast: ThemeContrast) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.mode = mode;
  document.documentElement.dataset.contrast = contrast;
}

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeName>("default");
  const [mode, setMode] = useState<ThemeMode>("light");
  const [contrast, setContrast] = useState<ThemeContrast>("modern");
  const [loadedPreferences, setLoadedPreferences] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("dampener-theme") as ThemeName | null;
    const savedMode = window.localStorage.getItem("dampener-mode") as ThemeMode | null;
    const savedContrast = window.localStorage.getItem(
      "dampener-contrast",
    ) as ThemeContrast | null;

    const frame = requestAnimationFrame(() => {
      setTheme(savedTheme ?? "default");
      setMode(savedMode ?? "light");
      setContrast(savedContrast ?? "modern");
      setLoadedPreferences(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!loadedPreferences) {
      return;
    }

    applyTheme(theme, mode, contrast);
  }, [loadedPreferences, theme, mode, contrast]);

  function handleThemeChange(value: ThemeName) {
    const nextMode = mode;
    setTheme(value);
    setMode(nextMode);
    setOpen(false);
    applyTheme(value, nextMode, contrast);
    window.localStorage.setItem("dampener-theme", value);
    window.localStorage.setItem("dampener-mode", nextMode);
  }

  function handleModeChange() {
    const nextMode = mode === "dark" ? "light" : "dark";

    setMode(nextMode);
    applyTheme(theme, nextMode, contrast);
    window.localStorage.setItem("dampener-mode", nextMode);
  }

  function handleContrastChange() {
    const nextContrast = contrast === "high" ? "modern" : "high";

    setContrast(nextContrast);
    applyTheme(theme, mode, nextContrast);
    window.localStorage.setItem("dampener-contrast", nextContrast);
  }

  const currentTheme = themes.find((item) => item.value === theme) ?? themes[0];

  return (
    <div
      className={`theme-switcher relative flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm ${
        compact ? "is-compact" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="theme-menu-button flex h-9 min-w-48 items-center justify-between gap-3 rounded-full px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span>Selected theme: {currentTheme.label}</span>
        <span
          aria-hidden="true"
          className={`h-2 w-2 border-b border-r border-current transition-transform ${
            open ? "-rotate-135" : "rotate-45"
          }`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="theme-menu absolute left-0 top-[calc(100%+0.5rem)] z-20 grid w-56 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
        >
          {themes.map((item) => (
            <button
              key={item.value}
              type="button"
              role="menuitemradio"
              aria-checked={theme === item.value}
              onClick={() => handleThemeChange(item.value)}
              className="group rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <span className="flex items-center justify-between gap-3">
                {item.label}
                {theme === item.value ? <span aria-hidden="true">On</span> : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleModeChange}
        className="theme-mode-button h-9 rounded-full bg-slate-900 px-3 text-sm font-medium text-white transition hover:bg-slate-700"
        aria-pressed={mode === "dark"}
      >
        {mode === "dark" ? "Light" : "Dark"}
      </button>

      <button
        type="button"
        onClick={handleContrastChange}
        className="theme-contrast-button h-9 rounded-full border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
        aria-pressed={contrast === "high"}
      >
        {contrast === "high" ? "High Contrast" : "Modern 3D"}
      </button>
    </div>
  );
}
