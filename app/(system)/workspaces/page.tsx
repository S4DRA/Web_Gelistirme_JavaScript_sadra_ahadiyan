"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";

type Workspace = {
  id: string;
  name: string;
  currency: string;
  startingBalance: number;
  monthlyFixedExpenses: number;
  role: string;
};

const currencies = ["USD", "EUR", "TRY", "GBP", "IRR", "AED", "CAD", "AUD", "JPY", "CHF", "SAR", "CNY", "INR"];

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const response = await fetch("/api/workspaces");

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load workspaces.");
        }

        setWorkspaces(data.workspaces);
        setActiveWorkspaceId(data.activeWorkspaceId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workspaces.");
      } finally {
        setLoading(false);
      }
    }

    void loadWorkspaces();
  }, []);

  async function createWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currency }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create workspace.");
      }

      setWorkspaces((current) => [...current, data]);
      setActiveWorkspaceId(data.id);
      setName("");
      setSuccessMessage("Workspace created and selected.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace.");
    } finally {
      setSaving(false);
    }
  }

  async function switchWorkspace(workspaceId: string) {
    setError("");

    const response = await fetch("/api/workspaces/active", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Failed to switch workspace.");
      return;
    }

    setActiveWorkspaceId(workspaceId);
  }

  return (
    <PageShell
      title="Workspaces"
      description="Separate personal, company, client, or project finances without mixing the data."
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-slate-900">Create workspace</h2>
          <p className="mt-1 text-sm text-slate-500">
            Each workspace has its own transactions, invoices, budgets, and team.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-[1fr_10rem_auto]" onSubmit={createWorkspace}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Workspace name
            <input
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="Acme Studio"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Currency
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            >
              {currencies.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create"}
          </button>
        </form>

        {successMessage ? (
          <div className="mt-4 text-sm font-medium text-emerald-700">{successMessage}</div>
        ) : null}
        {error ? <div className="mt-4 text-sm font-medium text-rose-600">{error}</div> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-medium text-slate-900">Workspace list</h2>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">Loading workspaces...</div>
        ) : workspaces.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            No workspaces yet. Create your first workspace above.
          </div>
        ) : (
          <div className="grid gap-4 p-6 md:grid-cols-2">
            {workspaces.map((workspace) => (
              <article
                key={workspace.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {workspace.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {workspace.currency} | {workspace.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={workspace.id === activeWorkspaceId}
                    onClick={() => void switchWorkspace(workspace.id)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {workspace.id === activeWorkspaceId ? "Active" : "Switch"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
