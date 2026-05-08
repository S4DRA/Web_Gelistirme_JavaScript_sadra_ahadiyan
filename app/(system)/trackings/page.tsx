"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";

type TrackingFolder = {
  id: string;
  name: string;
  createdAt: string;
};

export default function TrackingsPage() {
  const [folders, setFolders] = useState<TrackingFolder[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFolders() {
      try {
        setError("");

        const response = await fetch("/api/trackings");

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load trackings.");
        }

        setFolders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trackings.");
      } finally {
        setLoading(false);
      }
    }

    void loadFolders();
  }, []);

  async function handleCreateFolder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");

    try {
      const response = await fetch("/api/trackings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create folder.");
      }

      setFolders((current) => [data, ...current]);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder.");
    } finally {
      setCreating(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <PageShell
      title="Trackings"
      description="Keep separate folders for different financial tracking spaces."
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-slate-900">Create folder</h2>
          <p className="mt-1 text-sm text-slate-500">
            Optional folders let you separate personal, client, or project finances.
          </p>
        </div>

        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleCreateFolder}>
          <input
            required
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            placeholder="Personal cash flow"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {creating ? "Creating..." : "Add folder"}
          </button>
        </form>

        {error ? <div className="mt-4 text-sm text-rose-600">{error}</div> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-medium text-slate-900">Financial folders</h2>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">Loading folders...</div>
        ) : folders.length === 0 ? (
          <div className="px-6 py-10">
            <p className="text-sm font-medium text-slate-900">No folders yet.</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              This section stays empty until you add a tracking folder. You can keep
              using the main dashboard, transactions, and invoices without one.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Open dashboard
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <article
                key={folder.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-lg font-semibold tracking-tight text-slate-900">
                  {folder.name}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Created {formatDate(folder.createdAt)}
                </p>
                <Link
                  href="/dashboard"
                  className="mt-5 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Open tracking
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
