"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { PageShell } from "@/components/page-shell";
import { ThemeSwitcher } from "@/components/theme-switcher";

const RESET_CONFIRMATION_PHRASE = "I WOULD LIKE TO RESET THE DATA";
const CURRENCIES = ["USD", "EUR", "TRY", "GBP", "IRR", "AED", "CAD", "AUD", "JPY", "CHF"];

type PredictionSettings = {
  includePlannedExpenses: boolean;
  includeRecurring: boolean;
  includeUnpaidInvoices: boolean;
  mode: "conservative" | "balanced" | "optimistic";
  periodDays: 7 | 30 | 90 | 180 | 365;
};

const defaultPredictionSettings: PredictionSettings = {
  includePlannedExpenses: true,
  includeRecurring: true,
  includeUnpaidInvoices: true,
  mode: "balanced",
  periodDays: 30,
};

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
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resettingData, setResettingData] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [currencyMessage, setCurrencyMessage] = useState("");
  const [currencyError, setCurrencyError] = useState("");
  const [predictionSettings, setPredictionSettings] = useState<PredictionSettings>(
    defaultPredictionSettings,
  );
  const [savingPrediction, setSavingPrediction] = useState(false);
  const [predictionMessage, setPredictionMessage] = useState("");
  const [predictionError, setPredictionError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const [
        emailResponse,
        userResponse,
        currencyResponse,
        predictionResponse,
      ] = await Promise.all([
        fetch("/api/email/status"),
        fetch("/api/auth/me"),
        fetch("/api/currency"),
        fetch("/api/prediction/settings"),
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

      if (currencyResponse.ok) {
        const data = await currencyResponse.json();
        setCurrency(data.baseCurrency);
      }

      if (predictionResponse.ok) {
        const data = await predictionResponse.json();
        setPredictionSettings(data.predictionSettings);
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

  function closeResetModal() {
    if (resettingData) {
      return;
    }

    setResetModalOpen(false);
    setResetConfirmation("");
    setResetError("");
  }

  async function handleResetData(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (resetConfirmation !== RESET_CONFIRMATION_PHRASE) {
      setResetError(`Type exactly: ${RESET_CONFIRMATION_PHRASE}`);
      return;
    }

    setResettingData(true);
    setResetError("");
    setResetMessage("");

    try {
      const response = await fetch("/api/reset", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmationPhrase: resetConfirmation }),
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset data.");
      }

      setResetMessage("Workspace data was reset successfully.");
      setResetModalOpen(false);
      setResetConfirmation("");
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "Failed to reset data.");
    } finally {
      setResettingData(false);
    }
  }

  async function handleCurrencySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingCurrency(true);
    setCurrencyError("");
    setCurrencyMessage("");

    try {
      const response = await fetch("/api/currency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update currency.");
      }

      setCurrency(data.currency);
      setCurrencyMessage("Default currency updated.");
    } catch (error) {
      setCurrencyError(
        error instanceof Error ? error.message : "Failed to update currency.",
      );
    } finally {
      setSavingCurrency(false);
    }
  }

  async function handlePredictionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPrediction(true);
    setPredictionError("");
    setPredictionMessage("");

    try {
      const response = await fetch("/api/prediction/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(predictionSettings),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update prediction settings.");
      }

      setPredictionSettings(data.predictionSettings);
      setPredictionMessage("Prediction settings updated.");
    } catch (error) {
      setPredictionError(
        error instanceof Error ? error.message : "Failed to update prediction settings.",
      );
    } finally {
      setSavingPrediction(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/login");
    }
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
              <AppIcon name="sign-out-alt" />
              Log out
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              End this session and return to the login screen.
            </p>
          </div>
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <AppIcon name="sign-out-alt" />
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <AppIcon name="coins" />
            Currency
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose the workspace currency used for dashboards, reports, and converted totals.
          </p>
        </div>

        <form
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          onSubmit={handleCurrencySubmit}
        >
          <label className="grid gap-2 text-sm font-medium text-slate-700 sm:w-72">
            Default currency
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            >
              {CURRENCIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={savingCurrency}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingCurrency ? "Saving..." : "Save currency"}
          </button>
        </form>
        {currencyMessage ? (
          <p className="mt-3 text-sm font-medium text-emerald-700">{currencyMessage}</p>
        ) : null}
        {currencyError ? (
          <p className="mt-3 text-sm font-medium text-rose-700">{currencyError}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <AppIcon name="chart-line-up" />
            Prediction settings
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Control how the dashboard cash outlook is calculated. The dashboard stays
            focused on the result.
          </p>
        </div>

        <form className="grid gap-5" onSubmit={handlePredictionSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Prediction period
              <select
                value={predictionSettings.periodDays}
                onChange={(event) =>
                  setPredictionSettings((current) => ({
                    ...current,
                    periodDays: Number(event.target.value) as PredictionSettings["periodDays"],
                  }))
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>3 months</option>
                <option value={180}>6 months</option>
                <option value={365}>1 year</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Prediction mode
              <select
                value={predictionSettings.mode}
                onChange={(event) =>
                  setPredictionSettings((current) => ({
                    ...current,
                    mode: event.target.value as PredictionSettings["mode"],
                  }))
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="conservative">Conservative</option>
                <option value="balanced">Balanced</option>
                <option value="optimistic">Optimistic</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["includeRecurring", "Recurring transactions"],
              ["includeUnpaidInvoices", "Unpaid invoices"],
              ["includePlannedExpenses", "Planned expenses"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={Boolean(predictionSettings[key as keyof PredictionSettings])}
                  onChange={(event) =>
                    setPredictionSettings((current) => ({
                      ...current,
                      [key]: event.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {predictionMessage ? (
                <p className="text-sm font-medium text-emerald-700">
                  {predictionMessage}
                </p>
              ) : null}
              {predictionError ? (
                <p className="text-sm font-medium text-rose-700">{predictionError}</p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={savingPrediction}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPrediction ? "Saving..." : "Save prediction settings"}
            </button>
          </div>
        </form>
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
            Permanently reset this workspace when you need a clean start.
          </p>
          <button
            type="button"
            onClick={() => {
              setResetModalOpen(true);
              setResetError("");
              setResetMessage("");
            }}
            className="mt-5 inline-flex rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
          >
            Reset data
          </button>
          {resetMessage ? (
            <p className="mt-3 text-sm font-medium text-emerald-700">{resetMessage}</p>
          ) : null}
        </article>
      </section>

      {resetModalOpen ? (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-data-title"
        >
          <form
            onSubmit={handleResetData}
            className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase text-rose-700">
                  Dangerous action
                </p>
                <h2 id="reset-data-title" className="mt-4 text-2xl font-semibold text-slate-900">
                  Reset workspace data?
                </h2>
              </div>
              <button
                type="button"
                onClick={closeResetModal}
                disabled={resettingData}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close reset confirmation"
              >
                <AppIcon name="cross-small" />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">
              Resetting will permanently delete this workspace&apos;s transactions, invoices,
              recurring transactions, budgets, and tracking folders. It will also set the
              starting balance and monthly fixed expenses back to zero.
            </div>

            <label className="mt-5 grid gap-2 text-sm font-medium text-slate-700">
              Type this phrase to confirm:
              <span className="rounded-xl bg-slate-100 px-3 py-2 font-mono text-xs text-slate-900">
                {RESET_CONFIRMATION_PHRASE}
              </span>
              <input
                autoFocus
                type="text"
                value={resetConfirmation}
                onChange={(event) => {
                  setResetConfirmation(event.target.value);
                  setResetError("");
                }}
                className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400"
                placeholder={RESET_CONFIRMATION_PHRASE}
              />
            </label>

            {resetError ? (
              <p className="mt-3 text-sm font-medium text-rose-700">{resetError}</p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeResetModal}
                disabled={resettingData}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resettingData || resetConfirmation !== RESET_CONFIRMATION_PHRASE}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resettingData ? "Resetting..." : "Reset data"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

    </PageShell>
  );
}
