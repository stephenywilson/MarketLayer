import type { ReactNode } from "react";
import { Icon } from "./Icon";

type IconName = Parameters<typeof Icon>[0]["name"];

interface Props {
  icon: IconName;
  label: string;
  value: ReactNode;
  description?: string;
  valueTone?: "white" | "warn" | "accent" | "danger";
}

const TONE_CLASS = {
  white: "text-ml-text",
  warn: "text-ml-warn",
  accent: "text-ml-accent",
  danger: "text-ml-danger",
};

export function StatCard({
  icon,
  label,
  value,
  description,
  valueTone = "white",
}: Props) {
  return (
    <div className="ml-stat">
      <Icon name={icon} className="text-ml-text-dim" size={18} />
      <div className="ml-label-muted">{label}</div>
      <div
        className={`text-[26px] leading-tight font-semibold ${TONE_CLASS[valueTone]}`}
      >
        {value}
      </div>
      {description && (
        <div className="text-[12px] text-ml-text-muted leading-snug">
          {description}
        </div>
      )}
    </div>
  );
}
