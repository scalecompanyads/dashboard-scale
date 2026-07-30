type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconCurrency({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M14.5 9.7c0-1-1-1.7-2.5-1.7-1.7 0-2.7.9-2.7 2s.9 1.6 2.7 2c1.8.4 2.7.9 2.7 2s-1 2-2.7 2c-1.5 0-2.5-.7-2.5-1.7" />
    </svg>
  );
}

export function IconRepeat({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7.5h12.5a3.5 3.5 0 0 1 3.5 3.5v1" />
      <path d="M8 4 4 7.5 8 11" />
      <path d="M20 16.5H7.5A3.5 3.5 0 0 1 4 13v-1" />
      <path d="M16 20l4-3.5-4-3.5" />
    </svg>
  );
}

export function IconTarget({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconFlag({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 3v18" />
      <path d="M6 4.5h11l-2.7 3.5L17 11.5H6" />
    </svg>
  );
}

export function IconGauge({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 15.5a7.5 7.5 0 1 1 15 0" />
      <path d="M12 15.5 15 11" />
      <path d="M4.5 15.5h15" />
    </svg>
  );
}

export function IconReceipt({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6.5 3.5h11v17l-2.2-1.5-2.3 1.5-2.2-1.5-2.3 1.5-2-1.5v-15Z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </svg>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <path d="M15.5 5.2A3 3 0 0 1 16 11" />
      <path d="M17.5 14c2.2.4 3.6 2 4 5" />
    </svg>
  );
}

export function IconCalendarCheck({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
      <path d="M8.5 14l2 2 4-4" />
    </svg>
  );
}

export function IconCheckCircle({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.3 12.2l2.6 2.6 4.8-5.4" />
    </svg>
  );
}

export function IconHandshake({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 12.5l4-3.8a2 2 0 0 1 2.7 0l1 .9" />
      <path d="M21.5 12.5l-4-3.8a2 2 0 0 0-2.7 0l-3.4 3.2a1.4 1.4 0 0 0 1.9 2l1.7-1.6" />
      <path d="M10.2 9.6l3.4 3.2a1.4 1.4 0 0 1-1.9 2" />
      <path d="M4.5 12l-2 1.8 3.2 3.5 2-1.8" />
      <path d="M19.5 12l2 1.8-3.2 3.5-1.7-1.6" />
    </svg>
  );
}
