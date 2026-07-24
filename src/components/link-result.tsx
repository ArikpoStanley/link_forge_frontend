"use client";

import { useState } from "react";
import type { GenerateLinkResponse } from "@/lib/types";

interface Props {
  result: GenerateLinkResponse;
  brandName: string;
  buttonColor: string;
  onVerifyInline: () => void;
  onReset: () => void;
}

export default function LinkResult({
  result,
  brandName,
  buttonColor,
  onVerifyInline,
  onReset,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(result.verification_url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="animate-in fade-in space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--accent)]">
          Link ready
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Choose how to continue
        </h2>
        <p className="mt-3 max-w-xl text-[var(--ink-muted)]">
          Session created for {brandName}. Stay here and verify in a modal, or
          open the hosted verification link when you are ready.
        </p>
        {result.name_prefill_warning ? (
          <p
            role="alert"
            className="mt-4 max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {result.name_prefill_warning}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onVerifyInline}
          className="group relative overflow-hidden rounded-2xl border border-[var(--ink)] bg-[var(--ink)] px-6 py-8 text-left text-white shadow-[0_12px_40px_rgba(20,32,28,0.18)] transition hover:brightness-110"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/65">
            Option 1
          </p>
          <p className="mt-3 font-[family-name:var(--font-display)] text-2xl leading-tight text-white">
            Verify inline
          </p>
          <p className="mt-3 max-w-[16rem] text-sm text-white/80">
            Open KYC in a modal — initializing screen, then the full flow from
            first step to last.
          </p>
          <span
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 group-hover:underline"
            style={{ color: buttonColor }}
          >
            Start in modal →
          </span>
        </button>

        <a
          href={result.verification_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-8 text-left shadow-[0_8px_28px_rgba(20,32,28,0.06)] transition hover:border-[var(--accent)]"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
            Option 2
          </p>
          <p className="mt-3 font-[family-name:var(--font-display)] text-2xl leading-tight text-[var(--ink)]">
            Open verification link
          </p>
          <p className="mt-3 max-w-[16rem] text-sm text-[var(--ink-muted)]">
            Continue in a new tab through the normal hosted KYC experience.
          </p>
          <span className="mt-6 inline-block text-sm font-semibold text-[var(--accent)] underline-offset-4 group-hover:underline">
            Open link →
          </span>
        </a>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Verification URL
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="text-sm font-medium text-[var(--accent)]"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        <p className="mt-2 break-all font-mono text-xs text-[var(--ink)] sm:text-sm">
          {result.verification_url}
        </p>
        <dl className="mt-4 grid gap-2 text-xs text-[var(--ink-muted)] sm:grid-cols-3">
          <div>
            <dt className="uppercase tracking-wider">Verification ID</dt>
            <dd className="mt-1 font-mono text-[var(--ink)]">
              {result.verification_id}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider">Checks</dt>
            <dd className="mt-1 text-[var(--ink)]">
              {result.total_checks} · {result.todo.join(", ") || "—"}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider">Reference</dt>
            <dd className="mt-1 font-mono text-[var(--ink)]">
              {result.reference || "—"}
            </dd>
          </div>
        </dl>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="text-sm text-[var(--ink-muted)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
      >
        Generate another link
      </button>
    </section>
  );
}
