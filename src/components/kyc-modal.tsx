"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import InitializingScreen from "./initializing-screen";

/** Matches Modular KYC MaxWidthWrapper (Fuspay checkout column). */
const CHECKOUT_WIDTH_PX = 500;

interface Props {
  open: boolean;
  verificationId: string;
  verificationUrl: string;
  /** Prefer this host for iframe embeds (e.g. local Expo web). */
  inlineFrontendUrl?: string;
  brandName: string;
  buttonColor: string;
  onClose: () => void;
}

function buildEmbedUrl(
  verificationUrl: string,
  verificationId: string,
  inlineFrontendUrl?: string,
) {
  const base = (inlineFrontendUrl || "").replace(/\/$/, "");
  if (base) {
    const url = new URL(base.includes("://") ? base : `http://${base}`);
    url.searchParams.set("verificationId", verificationId);
    url.searchParams.set("embed", "1");
    return url.toString();
  }

  try {
    const url = new URL(verificationUrl);
    url.searchParams.set("embed", "1");
    return url.toString();
  } catch {
    const joiner = verificationUrl.includes("?") ? "&" : "?";
    return `${verificationUrl}${joiner}embed=1`;
  }
}

function hostBlocksEmbedding(url: string) {
  try {
    const host = new URL(url).hostname;
    return (
      host === "transid2.fuspay.finance" || host.endsWith(".fuspay.finance")
    );
  } catch {
    return false;
  }
}

export default function KycModal({
  open,
  verificationId,
  verificationUrl,
  inlineFrontendUrl = "",
  brandName,
  buttonColor,
  onClose,
}: Props) {
  const [initialized, setInitialized] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [completed, setCompleted] = useState(false);

  const embedUrl = useMemo(
    () => buildEmbedUrl(verificationUrl, verificationId, inlineFrontendUrl),
    [verificationUrl, verificationId, inlineFrontendUrl],
  );

  const canEmbed = useMemo(() => {
    if (inlineFrontendUrl) return true;
    return !hostBlocksEmbedding(verificationUrl);
  }, [inlineFrontendUrl, verificationUrl]);

  const handleReady = useCallback(() => {
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setInitialized(false);
      setIframeLoaded(false);
      setCompleted(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const poll = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${verificationId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "completed" || data.overall_status === "completed") {
          setCompleted(true);
          window.clearInterval(poll);
        }
      } catch {
        // keep polling
      }
    }, 3000);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearInterval(poll);
    };
  }, [open, verificationId]);

  if (!open) return null;

  const showFlow = initialized && canEmbed;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Inline KYC verification"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(18,24,28,0.72)] backdrop-blur-[2px]"
        aria-label="Close modal backdrop"
        onClick={onClose}
      />

      {/* Width matches Fuspay Modular KYC checkout column (500px) */}
      <div
        className="relative flex max-h-[min(92vh,860px)] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
        style={{ maxWidth: CHECKOUT_WIDTH_PX }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-black/8 px-4 py-2.5">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Inline verification
            </p>
            <p className="truncate font-[family-name:var(--font-display)] text-base text-[var(--ink)]">
              {brandName || "KYC"} session
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm text-[var(--ink-muted)] transition hover:bg-black/5 hover:text-[var(--ink)]"
          >
            Close
          </button>
        </header>

        {/* Checkout UI fills the panel — no side gutters */}
        <div
          className="relative w-full flex-1 bg-white"
          style={{ minHeight: "min(78vh, 720px)" }}
        >
          {!canEmbed && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white px-6 text-center">
              <p className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                Inline embed blocked
              </p>
              <p className="max-w-sm text-sm text-[var(--ink-muted)]">
                Hosted KYC blocks iframe embedding. Open the link instead, or
                run Modular KYC locally on :8009.
              </p>
              <a
                href={verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-6 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: buttonColor }}
              >
                Open verification link →
              </a>
            </div>
          )}

          {canEmbed && !initialized && (
            <div className="absolute inset-0 z-10 bg-white">
              <InitializingScreen
                brandName={brandName}
                buttonColor={buttonColor}
                onReady={handleReady}
              />
            </div>
          )}

          {showFlow && (
            <>
              {!iframeLoaded && !completed && (
                <div className="absolute inset-0 z-[5] flex items-center justify-center bg-white">
                  <p className="text-sm text-[var(--ink-muted)]">
                    Loading verification UI…
                  </p>
                </div>
              )}
              <iframe
                title="KYC verification"
                src={embedUrl}
                className="absolute inset-0 h-full w-full border-0"
                style={{ display: "block", width: "100%", height: "100%" }}
                allow="camera; microphone; clipboard-read; clipboard-write; fullscreen"
                allowFullScreen
                onLoad={() => setIframeLoaded(true)}
              />
            </>
          )}

          {completed && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 px-6 text-center backdrop-blur-sm">
              <div
                className="mb-5 flex h-16 w-16 items-center justify-center rounded-full text-2xl text-white"
                style={{ backgroundColor: buttonColor }}
              >
                ✓
              </div>
              <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                Verification complete
              </p>
              <p className="mt-2 max-w-md text-sm text-[var(--ink-muted)]">
                All KYC steps finished successfully.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-8 rounded-full px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
                style={{ backgroundColor: buttonColor }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
