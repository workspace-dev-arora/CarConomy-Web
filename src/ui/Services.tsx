import React, { useMemo, useState } from 'react';
import { Star, ShieldCheck, Check } from 'lucide-react';
import { INITIAL_SERVICES, SERVICE_CATEGORIES, CONSULTANCY_PACKAGES } from '../data/mockData';
import { Vehicle } from '../types';
import { formatINR } from '../utils/formatters';
import { Eyebrow, H1, Segmented, Chip, Btn, cx } from './kit';

export const Services: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  const [mode, setMode] = useState<'book' | 'expert'>('book');
  const [cat, setCat] = useState('all');
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const list = useMemo(() => INITIAL_SERVICES.filter(s => cat === 'all' || s.categoryId === cat).sort((a, b) => b.rating - a.rating), [cat]);
  const toggle = (id: string) => setBooked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <div className="space-y-8">
      <div><Eyebrow>Act</Eyebrow><H1>{mode === 'book' ? `Care for your ${vehicle.model}` : 'Talk to an expert'}</H1></div>
      <Segmented value={mode} onChange={setMode} options={[{ id: 'book', label: 'Book a service' }, { id: 'expert', label: 'Expert consultancy' }]} />

      {mode === 'book' ? (
        <section>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap">
            {SERVICE_CATEGORIES.map(c => <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</Chip>)}
          </div>
          <ul className="mt-4 max-w-4xl">
            {list.map(s => (
              <li key={s.id} className="py-5 border-b border-line grid sm:grid-cols-[1fr_auto] gap-x-8 gap-y-3 items-center">
                <div>
                  <p className="font-medium flex items-center gap-2">{s.providerName}{s.verified && <ShieldCheck className="w-4 h-4 text-good" aria-label="Verified" />}</p>
                  <p className="text-xs text-mute mt-0.5">{s.categoryName} · {s.providerType}</p>
                  <p className="text-xs text-mute mt-2 num flex flex-wrap gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 fill-current text-warn" />{s.rating} ({s.reviewsCount})</span>
                    <span>{s.distanceKm} km</span><span>{s.estimatedTime}</span><span>{s.warrantyMonths}-mo warranty</span>
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <p className="num font-semibold">{formatINR(s.price)}</p>
                  <Btn variant={booked.has(s.id) ? 'ghost' : 'solid'} onClick={() => toggle(s.id)} aria-pressed={booked.has(s.id)}>
                    {booked.has(s.id) ? <><Check className="w-4 h-4" />Booked</> : 'Book'}
                  </Btn>
                </div>
              </li>
            ))}
            {list.length === 0 && <li className="py-10 text-mute text-sm">No providers in this category yet.</li>}
          </ul>
        </section>
      ) : (
        <section className="max-w-4xl">
          {CONSULTANCY_PACKAGES.map(p => (
            <div key={p.id} className="py-6 border-b border-line">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <p className="font-display text-2xl">{p.title}{p.badge && <span className="ml-3 align-middle text-[11px] font-sans uppercase tracking-wider text-accent border border-accent rounded-full px-2 py-0.5">{p.badge}</span>}</p>
                  <p className="text-sm text-mute mt-1">{p.duration} · {p.recommendedFor}</p>
                  <p className="text-sm mt-3 leading-relaxed">{p.description}</p>
                </div>
                <div className="text-right"><p className="num font-semibold text-lg">{formatINR(p.price)}</p>{p.originalPrice && <p className="num text-xs text-mute line-through">{formatINR(p.originalPrice)}</p>}</div>
              </div>
              <div className="mt-4 flex items-center gap-5">
                <Btn variant={booked.has(p.id) ? 'ghost' : 'solid'} onClick={() => toggle(p.id)} aria-pressed={booked.has(p.id)}>{booked.has(p.id) ? <><Check className="w-4 h-4" />Requested</> : 'Request session'}</Btn>
                <button onClick={() => setOpen(open === p.id ? null : p.id)} className="text-sm text-mute hover:text-ink underline underline-offset-4 cursor-pointer min-h-11" aria-expanded={open === p.id}>{open === p.id ? 'Hide' : "What's included"}</button>
              </div>
              {open === p.id && <ul className={cx('mt-2 space-y-1.5 text-sm list-disc pl-5 text-mute')}>{p.deliverables.map(d => <li key={d}>{d}</li>)}</ul>}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
