"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";

type TeamMember = {
  id: string;
  email: string;
  role: "owner" | "admin" | "accountant" | "viewer";
  createdAt: string;
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMembers() {
      try {
        const response = await fetch("/api/team");

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load team.");
        }

        setMembers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load team.");
      } finally {
        setLoading(false);
      }
    }

    void loadMembers();
  }, []);

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add member.");
      }

      setMembers((current) => {
        const withoutSame = current.filter((member) => member.email !== data.email);
        return [...withoutSame, data];
      });
      setEmail("");
      setRole("viewer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Team"
      description="Give company workspaces shared access with owner, admin, accountant, and viewer roles."
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-slate-900">Add existing user</h2>
          <p className="mt-1 text-sm text-slate-500">
            The person must already have a Dampener account.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-[1fr_12rem_auto]" onSubmit={addMember}>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            placeholder="teammate@example.com"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
          >
            <option value="admin">Admin</option>
            <option value="accountant">Accountant</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {saving ? "Adding..." : "Add member"}
          </button>
        </form>
        {error ? <div className="mt-4 text-sm text-rose-600">{error}</div> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-medium text-slate-900">Members</h2>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">Loading team...</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {members.map((member) => (
              <article
                key={member.id}
                className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="font-medium text-slate-900">{member.email}</p>
                <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                  {member.role}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
