"use client";

import { useEffect, useState } from "react";

type ThemeName = "default" | "boys" | "men" | "girls" | "women";
type ThemeMode = "light" | "dark";

const themes: { value: ThemeName; label: string; hint: string }[] = [
  { value: "default", label: "Default", hint: "The original Dampener theme" },
  { value: "boys", label: "Turbo", hint: "Exciting style for boys" },
  { value: "men", label: "Executive", hint: "Formal style for men" },
  { value: "girls", label: "Spark", hint: "Exciting style for girls" },
  { value: "women", label: "Elegance", hint: "Formal style for women" },
];

function applyTheme(theme: ThemeName, mode: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.mode = mode;
}

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeName>("default");
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("dampener-theme") as ThemeName | null;
    const savedMode = window.localStorage.getItem("dampener-mode") as ThemeMode | null;

    requestAnimationFrame(() => {
      setTheme(savedTheme ?? "default");
      setMode(savedMode ?? "light");
    });
  }, []);

  useEffect(() => {
    applyTheme(theme, mode);
  }, [theme, mode]);

  function handleThemeChange(value: ThemeName) {
    setTheme(value);
    setOpen(false);
    window.localStorage.setItem("dampener-theme", value);
  }

  function handleModeChange() {
    const nextMode = mode === "dark" ? "light" : "dark";

    setMode(nextMode);
    window.localStorage.setItem("dampener-mode", nextMode);
  }

  const currentTheme = themes.find((item) => item.value === theme) ?? themes[0];

  return (
    <div className="theme-switcher relative flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="theme-menu-button flex h-9 min-w-48 items-center justify-between gap-3 rounded-full px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        aria-expanded={open}
        aria-haspopup="menu"
        title={currentTheme.hint}
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
              title={item.hint}
              onClick={() => handleThemeChange(item.value)}
              className="group rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <span className="flex items-center justify-between gap-3">
                {item.label}
                {theme === item.value ? <span aria-hidden="true">On</span> : null}
              </span>
              <span className="mt-1 block text-xs text-slate-500 opacity-0 transition group-hover:opacity-100">
                {item.hint}
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
    </div>
  );
}
