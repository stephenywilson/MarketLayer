import { useState } from "react";
import { Icon } from "./Icon";

interface Props {
  title: string;
  caption?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function Collapse({ title, caption, defaultOpen, children }: Props) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <section className="ml-panel">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-ml-panel/40 text-left"
        aria-expanded={open}
      >
        <div>
          <div className="ml-label">{title}</div>
          {caption && (
            <div className="text-[11px] text-ml-text-muted mt-0.5">
              {caption}
            </div>
          )}
        </div>
        <Icon
          name="chevron-up"
          size={14}
          className={
            open
              ? "text-ml-text-dim"
              : "text-ml-text-dim rotate-180 transition-transform"
          }
        />
      </button>
      {open && (
        <div className="border-t border-ml-border p-5">{children}</div>
      )}
    </section>
  );
}
