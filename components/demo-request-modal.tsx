"use client";

import { FormEvent, useCallback, useEffect, useId, useState } from "react";
import { AppIcon } from "@/components/app-icon";

type DemoRequestModalProps = {
  open: boolean;
  onClose: () => void;
};

const initialForm = {
  fullName: "",
  country: "",
  phoneNumber: "",
  companyName: "",
  companyWebsite: "",
  note: "",
};

export function DemoRequestModal({ open, onClose }: DemoRequestModalProps) {
  const titleId = useId();
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const hasCompany = form.companyName.trim().length > 0;

  const handleClose = useCallback(() => {
    setSubmitted(false);
    setForm(initialForm);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, open]);

  if (!open) {
    return null;
  }

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "companyName" && value.trim().length === 0 ? { companyWebsite: "" } : {}),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setForm(initialForm);
  }

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close demo request form"
        className="absolute inset-0 cursor-default"
        onClick={handleClose}
      />

      <div className="relative max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Demo request</p>
            <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Sign up for demo
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <AppIcon name="cross-small" />
          </button>
        </div>

        {submitted ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            Thanks. Your demo request has been received.
          </div>
        ) : (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Name and surname
              <input
                required
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                placeholder="Ada Lovelace"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Country
                <input
                  required
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                  placeholder="Turkey"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Phone number
                <input
                  required
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(event) => updateField("phoneNumber", event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                  placeholder="+90 555 000 0000"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Company name
              <input
                value={form.companyName}
                onChange={(event) => updateField("companyName", event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                placeholder="Company name"
              />
            </label>

            {hasCompany ? (
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Company website link
                <input
                  required
                  type="url"
                  value={form.companyWebsite}
                  onChange={(event) => updateField("companyWebsite", event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                  placeholder="https://company.com"
                />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Note
              <textarea
                value={form.note}
                onChange={(event) => updateField("note", event.target.value)}
                className="min-h-28 resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                placeholder="Anything you want us to know"
              />
            </label>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Send request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
