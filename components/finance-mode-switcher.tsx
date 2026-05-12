"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AppIcon } from "@/components/app-icon";

export type FinanceType = "personal" | "business";

const storageKey = "dampener-finance-type";
const cookieName = "dampener-finance-type";
let serverModePromise: Promise<void> | null = null;

function isFinanceType(value: unknown): value is FinanceType {
  return value === "personal" || value === "business";
}

function getStoredMode(): FinanceType {
  if (typeof window === "undefined") {
    return "business";
  }

  const stored = window.localStorage.getItem(storageKey);
  return isFinanceType(stored) ? stored : "business";
}

function writeMode(mode: FinanceType) {
  window.localStorage.setItem(storageKey, mode);
  document.cookie = `${cookieName}=${mode}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.dataset.financeType = mode;
}

function emitModeChange(mode: FinanceType) {
  window.dispatchEvent(
    new CustomEvent("dampener-finance-mode-changed", {
      detail: { financeType: mode },
    }),
  );
}

function subscribeToModeChanges(onStoreChange: () => void) {
  window.addEventListener("dampener-finance-mode-changed", onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("dampener-finance-mode-changed", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useFinanceMode() {
  return useSyncExternalStore(subscribeToModeChanges, getStoredMode, () => "business");
}

function useServerFinanceMode() {
  useEffect(() => {
    const storedMode = getStoredMode();
    writeMode(storedMode);

    if (!serverModePromise) {
      serverModePromise = loadServerMode();
    }

    async function loadServerMode() {
      try {
        const response = await fetch("/api/finance-mode");

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (isFinanceType(data.financeType)) {
          writeMode(data.financeType);
          emitModeChange(data.financeType);
        }
      } catch {
        // Local mode is enough for unauthenticated or offline UI states.
      }
    }
  }, []);
}

export function FinanceModeSwitcher({ compact = false }: { compact?: boolean }) {
  const mode = useFinanceMode();
  const [saving, setSaving] = useState(false);
  useServerFinanceMode();

  async function switchMode(nextMode: FinanceType) {
    if (nextMode === mode || saving) {
      return;
    }

    writeMode(nextMode);
    setSaving(true);
    emitModeChange(nextMode);

    try {
      await fetch("/api/finance-mode", {
        body: JSON.stringify({ financeType: nextMode }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`finance-mode-switcher ${mode === "personal" ? "is-personal" : "is-business"} ${
        compact ? "is-compact" : ""
      }`}
      aria-label="Finance mode"
    >
      {(["personal", "business"] as const).map((item) => {
        const active = mode === item;

        return (
          <button
            key={item}
            type="button"
            aria-pressed={active}
            disabled={saving && !active}
            onClick={() => void switchMode(item)}
            className="finance-mode-option"
          >
            <AppIcon name={item === "personal" ? "user" : "building"} />
            <span>{item === "personal" ? "Personal" : "Business"}</span>
          </button>
        );
      })}
    </div>
  );
}
