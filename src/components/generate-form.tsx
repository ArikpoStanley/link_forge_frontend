"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import CountrySelect from "@/components/country-select";
import KycModal from "@/components/kyc-modal";
import LinkResult from "@/components/link-result";
import SwitchToggle from "@/components/switch-toggle";
import { applyDialCode, getCountryByCode } from "@/data/countries";
import type { CheckSelection, GenerateLinkResponse } from "@/lib/types";

const DEFAULT_COUNTRY = "NG";
const DEFAULT_DIAL = getCountryByCode(DEFAULT_COUNTRY)?.dialCode || "+234";

const NIGERIA_ONLY_CHECKS: (keyof CheckSelection)[] = ["nin", "bvn"];
const GHANA_ONLY_CHECKS: (keyof CheckSelection)[] = [
  "quick_address_verification",
];

function isNigeriaCountry(code: string) {
  return code.trim().toUpperCase() === "NG";
}

function isGhanaCountry(code: string) {
  return code.trim().toUpperCase() === "GH";
}

const CHECK_OPTIONS: { key: keyof CheckSelection; label: string }[] = [
  { key: "phone", label: "Phone OTP" },
  { key: "email", label: "Email OTP" },
  { key: "nin", label: "NIN" },
  { key: "bvn", label: "BVN" },
  { key: "bio", label: "Bio data" },
  { key: "liveliness", label: "Liveness" },
  { key: "document_verification", label: "Document" },
  { key: "disclaimer", label: "Disclaimer" },
  { key: "address_verification", label: "Address (utility bill upload)" },
  {
    key: "quick_address_verification",
    label: "Quick Address (meter number)",
  },
];

const DEFAULT_CHECKS: CheckSelection = {
  phone: true,
  email: true,
  nin: true,
  bvn: true,
  bio: true,
  liveliness: true,
  document_verification: true,
  disclaimer: true,
  address_verification: true,
  quick_address_verification: false,
};

export default function GenerateForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(DEFAULT_DIAL);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [callback, setCallback] = useState("");
  const [redirect, setRedirect] = useState("");
  const [appId, setAppId] = useState("");
  const [apiBase, setApiBase] = useState("");
  const [inlineFrontendUrl, setInlineFrontendUrl] = useState(
    "https://transid2.fuspay.finance",
  );
  const [brandName, setBrandName] = useState("Acme Pay");
  const [brandLogo, setBrandLogo] = useState("");
  const [bgColor, setBgColor] = useState("#F4F7F6");
  const [textColor, setTextColor] = useState("#14201C");
  const [buttonColor, setButtonColor] = useState("#0F766E");
  const [checks, setChecks] = useState<CheckSelection>(DEFAULT_CHECKS);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateLinkResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/config");
        const data = await res.json();
        if (cancelled) return;
        if (data.api_base) setApiBase(String(data.api_base));
        // Never wipe a prefilled App ID with an empty config value
        if (data.app_id) setAppId(String(data.app_id));
        if (data.inline_frontend_url) {
          setInlineFrontendUrl(String(data.inline_frontend_url));
        }
      } catch {
        // ignore — user can still paste app id
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCount = useMemo(
    () => Object.values(checks).filter(Boolean).length,
    [checks],
  );

  const handleCountryChange = (nextCode: string) => {
    const prevDial = getCountryByCode(country)?.dialCode || "";
    const nextDial = getCountryByCode(nextCode)?.dialCode || "";
    setCountry(nextCode);
    setPhone((current) => applyDialCode(current, nextDial, prevDial));
    if (!isNigeriaCountry(nextCode)) {
      setChecks((prev) => ({
        ...prev,
        nin: false,
        bvn: false,
      }));
    }
    if (!isGhanaCountry(nextCode)) {
      setChecks((prev) => ({
        ...prev,
        quick_address_verification: false,
      }));
    }
  };

  const visibleCheckOptions = useMemo(
    () =>
      CHECK_OPTIONS.filter((option) => {
        if (
          !isNigeriaCountry(country) &&
          NIGERIA_ONLY_CHECKS.includes(option.key)
        ) {
          return false;
        }
        if (
          !isGhanaCountry(country) &&
          GHANA_ONLY_CHECKS.includes(option.key)
        ) {
          return false;
        }
        return true;
      }),
    [country],
  );

  const generateLink = async () => {
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Enter a valid email before generating.");
      return;
    }
    if (trimmedPhone.length < 7) {
      setError("Enter a full phone number (e.g. +2348012345678).");
      return;
    }
    if (!appId.trim() || !/^[a-fA-F0-9]{24}$/.test(appId.trim())) {
      setError("App ID must be a 24-character Mongo ObjectId.");
      return;
    }
    if (selectedCount === 0) {
      setError("Select at least one check.");
      return;
    }

    const logo = brandLogo.trim();
    if (logo) {
      try {
        const parsed = new URL(logo);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          setError("Brand logo must be an http(s) URL, or leave it blank.");
          return;
        }
      } catch {
        setError("Brand logo must be a full URL (e.g. https://…), or leave it blank.");
        return;
      }
    }

    const redirectTrimmed = redirect.trim();
    if (redirectTrimmed) {
      try {
        const parsed = new URL(redirectTrimmed);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          setError("Redirect URL must be an http(s) URL, or leave it blank.");
          return;
        }
      } catch {
        setError(
          "Redirect URL must be a full URL (e.g. https://your.app/done), or leave it blank.",
        );
        return;
      }
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          phone: trimmedPhone,
          country,
          full_name: fullName.trim() || undefined,
          app_id: appId.trim(),
          callback: callback.trim() || undefined,
          redirect: redirectTrimmed || undefined,
          branding: {
            brand_name: brandName,
            brand_logo: logo,
            bg_color: bgColor,
            text_color: textColor,
            button_color: buttonColor,
          },
          checks,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.message || `Could not generate link (${res.status})`,
        );
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void generateLink();
  };

  if (result) {
    return (
      <>
        <LinkResult
          result={result}
          brandName={brandName}
          buttonColor={buttonColor}
          onVerifyInline={() => setModalOpen(true)}
          onReset={() => {
            setResult(null);
            setModalOpen(false);
          }}
        />
        <KycModal
          open={modalOpen}
          verificationId={result.verification_id}
          verificationUrl={result.verification_url}
          inlineFrontendUrl={inlineFrontendUrl}
          brandName={brandName}
          buttonColor={buttonColor}
          onClose={() => setModalOpen(false)}
        />
      </>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(200px,240px)] lg:gap-10">
        <div className="flex flex-col gap-5 lg:gap-6">
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)] lg:text-xl">
                Customer
              </h2>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)] sm:text-sm">
                Contacts for OTP and the KYC session.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  App ID
                </span>
                <input
                  value={appId}
                  onChange={(e) => setAppId(e.target.value.trim())}
                  placeholder="24-char Mongo ObjectId"
                  className="field field-compact font-mono text-sm"
                />
                <span className="block text-[11px] text-[var(--ink-muted)]">
                  API: {apiBase || "…"} · local backend
                </span>
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Full name
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ada Augusta Lovelace"
                  className="field field-compact"
                  autoComplete="name"
                />
                <span className="block text-[11px] text-[var(--ink-muted)]">
                  Prefills Bio data (first / middle / last) when provided.
                </span>
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="field field-compact"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Country
                </span>
                <CountrySelect value={country} onChange={handleCountryChange} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Phone
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={`${DEFAULT_DIAL}… (WhatsApp)`}
                  className="field field-compact"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Callback URL
                </span>
                <input
                  type="text"
                  inputMode="url"
                  value={callback}
                  onChange={(e) => setCallback(e.target.value)}
                  placeholder="https://your.app/webhooks/kyc"
                  className="field field-compact"
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Redirect URL
                </span>
                <input
                  type="text"
                  inputMode="url"
                  value={redirect}
                  onChange={(e) => setRedirect(e.target.value)}
                  placeholder="https://your.app/kyc-complete"
                  className="field field-compact"
                />
                <span className="block text-[11px] text-[var(--ink-muted)]">
                  Customer is sent here after KYC completes. Leave blank to use
                  the default success page.
                </span>
              </label>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)] lg:text-xl">
                Tenant branding
              </h2>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)] sm:text-sm">
                Passed to Modular KYC — including button color.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Brand name
                </span>
                <input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="field field-compact"
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-1 lg:col-span-2">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Brand logo URL
                </span>
                <input
                  type="text"
                  inputMode="url"
                  value={brandLogo}
                  onChange={(e) => setBrandLogo(e.target.value)}
                  placeholder="https://cdn.example.com/logo.png"
                  className="field field-compact"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Button color
                </span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={buttonColor}
                    onChange={(e) => setButtonColor(e.target.value)}
                    className="h-11 w-10 shrink-0 cursor-pointer rounded-xl border border-[var(--line)] bg-transparent p-1"
                  />
                  <input
                    value={buttonColor}
                    onChange={(e) => setButtonColor(e.target.value)}
                    className="field field-compact min-w-0 flex-1"
                  />
                </div>
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Background
                </span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-11 w-10 shrink-0 cursor-pointer rounded-xl border border-[var(--line)] bg-transparent p-1"
                  />
                  <input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="field field-compact min-w-0 flex-1"
                  />
                </div>
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Text color
                </span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-11 w-10 shrink-0 cursor-pointer rounded-xl border border-[var(--line)] bg-transparent p-1"
                  />
                  <input
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="field field-compact min-w-0 flex-1"
                  />
                </div>
              </label>
            </div>
          </section>
        </div>

        <aside className="flex flex-col">
          <div className="mb-3 shrink-0">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)] lg:text-xl">
              Checks
            </h2>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)] sm:text-sm">
              {selectedCount} selected — only these appear in the KYC flow
              {!isNigeriaCountry(country)
                ? " (NIN & BVN are Nigeria only)"
                : ""}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            {visibleCheckOptions.map((option) => (
              <SwitchToggle
                key={option.key}
                id={`check-${option.key}`}
                label={option.label}
                checked={checks[option.key]}
                accentColor={buttonColor}
                onChange={(checked) =>
                  setChecks((prev) => ({
                    ...prev,
                    [option.key]: checked,
                  }))
                }
              />
            ))}
          </div>
        </aside>
      </div>

      <div className="flex flex-col items-center gap-3">
        {error && (
          <p
            role="alert"
            className="w-full max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-800"
          >
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={() => void generateLink()}
          className="rounded-full px-8 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: buttonColor }}
        >
          {loading ? "Generating link…" : "Generate KYC link"}
        </button>
      </div>
    </form>
  );
}
