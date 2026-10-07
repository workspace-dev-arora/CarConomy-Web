import React from 'react';
export const NumField: React.FC<{ label: string; value: number; onChange: (n: number) => void; prefix?: string; suffix?: string; step?: number }> = ({ label, value, onChange, prefix, suffix, step }) => (
  <label className="block">
    <span className="text-xs text-mute">{label}</span>
    <span className="mt-1 flex items-center border-b border-line focus-within:border-ink">
      {prefix && <span className="text-mute text-sm mr-1">{prefix}</span>}
      <input type="number" inputMode="decimal" step={step} value={Number.isFinite(value) ? value : 0}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="num w-full bg-transparent min-h-11 text-base outline-none" />
      {suffix && <span className="text-mute text-sm ml-1 shrink-0">{suffix}</span>}
    </span>
  </label>
);
