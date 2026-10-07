import React, { useState } from 'react';
import { Vehicle } from '../types';

export const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(' ');

export const Eyebrow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={cx('text-xs font-medium uppercase tracking-[0.14em] text-mute', className)}>{children}</p>
);
export const H1: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] tracking-tight">{children}</h1>
);
export const Big: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cx('font-display num leading-none tracking-tight', className)}>{children}</span>
);
export const Rule: React.FC<{ className?: string }> = ({ className }) => <hr className={cx('border-0 border-t border-line', className)} />;

export const Row: React.FC<{ label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; strong?: boolean }> = ({ label, value, sub, strong }) => (
  <div className="flex items-baseline justify-between gap-4 py-3 border-b border-line last:border-0">
    <div className="min-w-0"><p className={cx('text-sm', strong ? 'font-semibold' : 'text-ink')}>{label}</p>{sub && <p className="text-xs text-mute mt-0.5">{sub}</p>}</div>
    <p className={cx('num text-sm shrink-0', strong && 'font-semibold')}>{value}</p>
  </div>
);

export const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'ghost' }> = ({ variant = 'solid', className, ...p }) => (
  <button {...p} className={cx('inline-flex items-center justify-center gap-2 rounded-full px-5 min-h-11 text-sm font-medium transition-colors cursor-pointer disabled:opacity-40',
    variant === 'solid' ? 'bg-ink text-paper hover:bg-accent hover:text-accent-ink' : 'border border-line hover:border-ink', className)} />
);

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <div role="tablist" className="inline-flex border-b border-line gap-6 overflow-x-auto no-scrollbar max-w-full">
      {options.map(o => (
        <button key={o.id} role="tab" aria-selected={value === o.id} onClick={() => onChange(o.id)}
          className={cx('py-3 text-sm whitespace-nowrap -mb-px border-b-2 cursor-pointer transition-colors min-h-11',
            value === o.id ? 'border-accent text-ink font-semibold' : 'border-transparent text-mute hover:text-ink')}>{o.label}</button>
      ))}
    </div>
  );
}

export const Chip: React.FC<{ active?: boolean; onClick?: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} className={cx('px-4 min-h-10 rounded-full text-sm whitespace-nowrap border cursor-pointer transition-colors',
    active ? 'bg-ink text-paper border-ink' : 'border-line text-mute hover:text-ink hover:border-ink')}>{children}</button>
);

export const NextStep: React.FC<{ label: string; title: string; onClick: () => void }> = ({ label, title, onClick }) => (
  <button onClick={onClick} className="group w-full text-left flex items-center justify-between gap-4 py-6 border-t border-ink cursor-pointer">
    <div><Eyebrow>Next · {label}</Eyebrow><p className="font-display text-2xl sm:text-3xl mt-1">{title}</p></div>
    <span className="text-3xl transition-transform group-hover:translate-x-1 text-accent" aria-hidden>→</span>
  </button>
);

export const Meter: React.FC<{ pct: number; tone?: 'good' | 'warn' | 'bad' }> = ({ pct, tone = 'good' }) => (
  <div className="h-1.5 bg-sunk rounded-full overflow-hidden" role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
    <div className={cx('h-full rounded-full', tone === 'good' ? 'bg-good' : tone === 'warn' ? 'bg-warn' : 'bg-bad')} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
  </div>
);

const loadedImageCache = new Set<string>();

/** Honest vehicle image: exact angle only, no cross-angle substitution; fallback names the car. */
export const VehicleImage: React.FC<{ vehicle: Vehicle; angle?: 'hero' | 'front' | 'rear' | 'side' | 'interior'; priority?: boolean; className?: string }> = ({ vehicle, angle = 'hero', priority, className }) => {
  const src = angle === 'hero' ? (vehicle.images?.hero || vehicle.image) : vehicle.images?.[angle];
  const isCached = !!src && loadedImageCache.has(src);
  const [state, setState] = useState<{ src?: string; ok: boolean; err: boolean }>({ src, ok: isCached, err: false });
  
  const isCurrent = state.src === src;
  const isOk = isCurrent ? state.ok : isCached;
  const isErr = isCurrent ? state.err : false;

  const name = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.variant}`;
  return (
    <div className={cx('relative aspect-[16/10] bg-sunk rounded-2xl overflow-hidden flex items-center justify-center', className)}>
      {(!src || isErr) ? (
        <div className="text-center px-4">
          <p className="font-display text-xl">{vehicle.make} {vehicle.model}</p>
          <p className="text-xs text-mute mt-1">Photo unavailable · {angle}</p>
        </div>
      ) : (
        <>
          {!isOk && <div className="absolute inset-0 animate-pulse bg-line/40" />}
          <img
            key={src}
            src={src}
            alt={name}
            width={1280}
            height={800}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => {
              if (src) loadedImageCache.add(src);
              setState({ src, ok: true, err: false });
            }}
            onError={() => setState({ src, ok: false, err: true })}
            className={cx('w-full h-full object-contain transition-opacity duration-200', isOk ? 'opacity-100' : 'opacity-0')}
          />
        </>
      )}
    </div>
  );
};
