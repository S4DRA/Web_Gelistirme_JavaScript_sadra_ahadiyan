"use client";

import { FormEvent, useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AppIcon } from "@/components/app-icon";

type DemoRequestModalProps = {
  open: boolean;
  onClose: () => void;
  source?: "demo" | "contact";
};

const initialForm = {
  fullName: "",
  email: "",
  country: "",
  phoneNumber: "",
  companyName: "",
  companyWebsite: "",
  note: "",
};

export function DemoRequestModal({ open, onClose, source = "demo" }: DemoRequestModalProps) {
  const titleId = useId();
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const hasCompany = form.companyName.trim().length > 0;
  const isContact = source === "contact";

  const handleClose = useCallback(() => {
    setSubmitted(false);
    setSubmitting(false);
    setError("");
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          source: isContact ? "contact" : "demo",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send request.");
      }

      setSubmitted(true);
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request.");
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close demo request form"
        className="absolute inset-0 z-0 cursor-default"
        onClick={handleClose}
      />

      <div className="relative z-10 max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              {isContact ? "Contact Dampener" : "Demo request"}
            </p>
            <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              {isContact ? "Contact us" : "Request demo"}
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
            Thanks. Your request has been sent.
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

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email
              <input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                placeholder="you@example.com"
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

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? "Sending..." : "Send request"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
