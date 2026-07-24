"use client";

import { useEffect, useState } from "react";

const BOOT_MESSAGES = [
  "Preparing secure session…",
  "Loading verification steps…",
  "Initializing identity checks…",
  "Almost ready…",
];

interface Props {
  brandName: string;
  buttonColor: string;
  onReady: () => void;
}

export default function InitializingScreen({
  brandName,
  buttonColor,
  onReady,
}: Props) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const messageTimer = window.setInterval(() => {
      setMessageIndex((i) => (i + 1) % BOOT_MESSAGES.length);
    }, 700);

    const progressTimer = window.setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 18, 94));
    }, 280);

    const readyTimer = window.setTimeout(() => {
      setProgress(100);
      onReady();
    }, 2200);

    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(progressTimer);
      window.clearTimeout(readyTimer);
    };
  }, [onReady]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-8 text-center">
      <div
        className="mb-8 h-14 w-14 animate-pulse rounded-full"
        style={{ backgroundColor: buttonColor }}
        aria-hidden
      />
      <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
        Initializing KYC
      </p>
      <p className="mt-2 max-w-sm text-sm text-[var(--ink-muted)]">
        Setting up {brandName || "your"} verification session. This only takes a
        moment.
      </p>

      <div className="mt-10 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%`, backgroundColor: buttonColor }}
        />
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {BOOT_MESSAGES[messageIndex]}
      </p>
    </div>
  );
}
