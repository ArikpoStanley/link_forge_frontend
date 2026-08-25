"use client";

interface SwitchToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  accentColor?: string;
  id?: string;
  disabled?: boolean;
}

export default function SwitchToggle({
  checked,
  onChange,
  label,
  accentColor = "#0F766E",
  id,
  disabled = false,
}: SwitchToggleProps) {
  const switchId = id || `switch-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <label
      htmlFor={switchId}
      className={`group flex items-center justify-between gap-3 py-1.5 transition ${
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      }`}
    >
      <span className="text-sm text-[var(--ink)]">{label}</span>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        disabled={disabled}
        aria-label={`${label}: ${checked ? "on" : "off"}`}
        onClick={() => {
          if (disabled) return;
          onChange(!checked);
        }}
        className="relative h-7 w-12 shrink-0 rounded-full border transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
        style={{
          backgroundColor: checked ? accentColor : "rgba(20, 32, 28, 0.12)",
          borderColor: checked ? accentColor : "rgba(20, 32, 28, 0.14)",
          outlineColor: accentColor,
        }}
      >
        <span
          className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: checked ? "translateX(1.25rem)" : "translateX(0)",
          }}
        />
      </button>
    </label>
  );
}
