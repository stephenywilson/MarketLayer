import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  menuPlacement?: "top" | "bottom";
}

export function SelectControl({
  value,
  options,
  onChange,
  className = "",
  disabled,
  menuPlacement = "bottom",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="ml-input flex items-center justify-between gap-3 text-left disabled:opacity-50 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selected?.label || "Select"}</span>
        <Icon
          name="chevron-up"
          size={14}
          className={`shrink-0 text-ml-text-muted transition-transform ${open ? "" : "rotate-180"}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={[
            "absolute left-0 right-0 z-50 max-h-64 overflow-y-auto rounded border border-ml-border-strong bg-ml-bg-elev shadow-2xl shadow-black/40",
            menuPlacement === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]",
          ].join(" ")}
        >
          {options.map((option) => {
            const isActive = option.value === value;
            const isDisabled = !!option.disabled;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isActive}
                aria-disabled={isDisabled}
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return;
                  onChange(option.value);
                  setOpen(false);
                }}
                className={[
                  "w-full px-3 py-2 text-left text-sm transition-colors",
                  isDisabled
                    ? "cursor-not-allowed text-ml-text-faint"
                    : isActive
                      ? "bg-ml-accent/10 text-ml-accent"
                      : "text-ml-text-dim hover:bg-ml-panel hover:text-ml-text",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SelectControl;
