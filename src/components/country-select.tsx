"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_COUNTRIES } from "@/data/countries";

interface Props {
  value: string;
  onChange: (code: string) => void;
}

export default function CountrySelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = useMemo(
    () => ALL_COUNTRIES.find((c) => c.code === value) || null,
    [value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="field field-compact flex w-full items-center justify-between gap-2 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">
          {selected
            ? `${selected.flag ? `${selected.flag} ` : ""}${selected.name} (${selected.code})`
            : "Select country"}
        </span>
        <span className="text-[var(--ink-muted)]" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-[0_16px_40px_rgba(20,32,28,0.14)]">
          <div className="border-b border-[var(--line)] p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country…"
              className="field field-compact"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-[var(--ink-muted)]">
                No countries found
              </li>
            )}
            {filtered.map((country) => {
              const active = country.code === value;
              return (
                <li key={country.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-[rgba(15,118,110,0.08)] ${
                      active
                        ? "bg-[rgba(15,118,110,0.12)] text-[var(--ink)]"
                        : "text-[var(--ink)]"
                    }`}
                    onClick={() => {
                      onChange(country.code);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span className="w-6 shrink-0 text-base leading-none">
                      {country.flag}
                    </span>
                    <span className="truncate">{country.name}</span>
                    <span className="ml-auto text-xs text-[var(--ink-muted)]">
                      {country.code}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
