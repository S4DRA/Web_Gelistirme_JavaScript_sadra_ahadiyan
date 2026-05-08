"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { PageShell } from "@/components/page-shell";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function SettingsPage() {
  const [accountForm, setAccountForm] = useState({
    email: "",
    phoneNumber: "",
    username: "",
  });
  const [emailForm, setEmailForm] = useState({
    code: "",
    pendingEmail: "",
  });
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    configured: boolean;
    from: string | null;
  } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const [emailResponse, userResponse] = await Promise.all([
        fetch("/api/email/status"),
        fetch("/api/auth/me"),
      ]);

      if (emailResponse.ok) {
        setEmailStatus(await emailResponse.json());
      }

      if (userResponse.ok) {
        const data = await userResponse.json();
        setProfileImage(data.user.profileImage ?? null);
        setAccountForm({
          email: data.user.email,
          phoneNumber: data.user.phoneNumber ?? "",
          username: data.user.username ?? "",
        });
      }
    }

    void loadSettings();
  }, []);

  async function saveProfileImage(nextProfileImage: string | null) {
    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileImage: nextProfileImage }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile picture.");
      }

      setProfileImage(data.user.profileImage ?? null);
      setProfileMessage("Profile picture updated.");
      window.dispatchEvent(new Event("dampener-profile-updated"));
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Failed to update profile picture.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAccountSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAccount(true);
    setAccountError("");
    setAccountMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: accountForm.phoneNumber,
          username: accountForm.username,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update account.");
      }

      setAccountForm((current) => ({
        ...current,
        phoneNumber: data.user.phoneNumber ?? "",
        username: data.user.username ?? "",
      }));
      setAccountMessage("Account details updated.");
      window.dispatchEvent(new Event("dampener-profile-updated"));
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Failed to update account.");
    } finally {
      setSavingAccount(false);
    }
  }

  async function handleSendEmailCode() {
    setSendingEmailCode(true);
    setAccountError("");
    setAccountMessage("");

    try {
      const response = await fetch("/api/profile/email/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailForm.pendingEmail }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      setAccountMessage("Verification code sent to the new email.");
    } catch (error) {
      setAccountError(
        error instanceof Error ? error.message : "Failed to send verification code.",
      );
    } finally {
      setSendingEmailCode(false);
    }
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingEmail(true);
    setAccountError("");
    setAccountMessage("");

    try {
      const response = await fetch("/api/profile/email", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailForm.pendingEmail,
          verificationCode: emailForm.code,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change email.");
      }

      setAccountForm((current) => ({
        ...current,
        email: data.user.email,
      }));
      setEmailForm({ code: "", pendingEmail: "" });
      setAccountMessage("Email changed.");
      window.dispatchEvent(new Event("dampener-profile-updated"));
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Failed to change email.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleProfileImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setProfileError("Upload a PNG, JPG, or WEBP image.");
      return;
    }

    if (file.size > 225_000) {
      setProfileError("Choose an image under 225 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        void saveProfileImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <PageShell
      title="Settings"
      description="Control your account experience and app appearance."
    >
      <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[auto_1fr] md:items-center">
        <div className="profile-picture-preview">
          {profileImage ? (
            <Image
              src={profileImage}
              alt=""
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-3xl text-slate-700">
              <AppIcon name="user" />
            </span>
          )}
        </div>
        <div>
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <AppIcon name="user-pen" />
            Profile picture
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Upload a small PNG, JPG, or WEBP image for the profile chip and sidebar.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
              {savingProfile ? "Saving..." : "Choose picture"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={savingProfile}
                onChange={handleProfileImageChange}
              />
            </label>
            {profileImage ? (
              <button
                type="button"
                disabled={savingProfile}
                onClick={() => void saveProfileImage(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Remove picture
              </button>
            ) : null}
          </div>
          {profileMessage ? (
            <p className="mt-3 text-sm font-medium text-emerald-700">{profileMessage}</p>
          ) : null}
          {profileError ? (
            <p className="mt-3 text-sm font-medium text-rose-700">{profileError}</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2">
        <form onSubmit={handleAccountSubmit}>
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
              <AppIcon name="user-gear" />
              Account details
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Username must be unique. Phone number can be changed without verification.
            </p>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Username
              <input
                required
                minLength={3}
                type="text"
                autoComplete="username"
                value={accountForm.username}
                onChange={(event) =>
                  setAccountForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="alex-finance"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Phone number
              <input
                required
                type="tel"
                autoComplete="tel"
                value={accountForm.phoneNumber}
                onChange={(event) =>
                  setAccountForm((current) => ({
                    ...current,
                    phoneNumber: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="+1 555 123 4567"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={savingAccount}
            className="mt-5 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingAccount ? "Saving..." : "Save account details"}
          </button>
        </form>

        <form onSubmit={handleEmailSubmit}>
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
              <AppIcon name="envelope" />
              Change email
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Current email: {accountForm.email || "Loading..."}
            </p>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              New email
              <input
                required
                type="email"
                autoComplete="email"
                value={emailForm.pendingEmail}
                onChange={(event) =>
                  setEmailForm((current) => ({
                    ...current,
                    pendingEmail: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="new@example.com"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={sendingEmailCode || !emailForm.pendingEmail}
                onClick={() => void handleSendEmailCode()}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingEmailCode ? "Sending..." : "Send verification code"}
              </button>
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Verification code
              <input
                required
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                type="text"
                autoComplete="one-time-code"
                value={emailForm.code}
                onChange={(event) =>
                  setEmailForm((current) => ({
                    ...current,
                    code: event.target.value.replace(/\D/g, "").slice(0, 6),
                  }))
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="123456"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={savingEmail}
            className="mt-5 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingEmail ? "Changing..." : "Change email"}
          </button>
        </form>

        <div className="lg:col-span-2">
          {accountMessage ? (
            <p className="text-sm font-medium text-emerald-700">{accountMessage}</p>
          ) : null}
          {accountError ? (
            <p className="text-sm font-medium text-rose-700">{accountError}</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_240px] md:items-center">
        <div>
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
              <AppIcon name="palette" />
              Appearance
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose your theme and switch between light and dark mode.
            </p>
          </div>

          <div className="inline-flex">
            <ThemeSwitcher />
          </div>
        </div>

        <div className="brand-lockup-card hidden rounded-2xl border border-slate-200 bg-white p-4 md:block">
          <Image
            src="/img/2.jpg"
            alt="Dampener"
            width={2048}
            height={2048}
            className="h-40 w-full object-contain"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <AppIcon name="envelope" />
            Email delivery
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Verification codes and alerts use the configured Gmail SMTP account.
          </p>
          <p
            className={`mt-5 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              emailStatus?.configured
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {emailStatus?.configured ? "Configured" : "Needs setup"}
          </p>
          {emailStatus?.from ? (
            <p className="mt-3 break-words text-sm text-slate-500">{emailStatus.from}</p>
          ) : null}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <AppIcon name="download" />
            Data export
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Download your workspace records any time for accounting or backup.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/api/exports?type=transactions"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Transactions
            </a>
            <a
              href="/api/exports?type=invoices"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
            >
              Invoices
            </a>
          </div>
        </article>

        <article className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <AppIcon name="shield-check" />
            Data control
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Reset workspace records from the dashboard when you need a clean start.
          </p>
          <a
            href="/dashboard"
            className="mt-5 inline-flex rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
          >
            Go to reset
          </a>
        </article>
      </section>

    </PageShell>
  );
}
