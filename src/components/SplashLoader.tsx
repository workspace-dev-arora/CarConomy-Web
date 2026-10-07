import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  'Booting calculation engine',
  'Loading depreciation curves',
  'Syncing fuel & EMI models',
  'Verifying vehicle catalog',
  'Ready',
];

export const SplashLoader: React.FC<{ onDone: () => void; duration?: number }> = ({ onDone, duration = 2600 }) => {
  const [pct, setPct] = useState(0);
  const [exit, setExit] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setPct(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else { setExit(true); setTimeout(onDone, 450); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, onDone]);

  const step = Math.min(STEPS.length - 1, Math.floor((pct / 100) * STEPS.length));

  return (
    <AnimatePresence>
      {!exit && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.45 }}
          className="fixed inset-0 z-[999] bg-paper flex flex-col items-center justify-center px-8"
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(204,255,0,0.08), transparent 60%)' }} />

          {/* Speedometer ring */}
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 44} strokeDashoffset={2 * Math.PI * 44 * (1 - pct / 100)}
                style={{ filter: 'drop-shadow(0 0 6px rgba(204,255,0,0.6))' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono-numbers text-4xl font-bold text-ink">{pct}</span>
              <span className="text-[10px] tracking-[0.3em] text-mute mt-1">%</span>
            </div>
          </div>

          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-2xl font-extrabold tracking-[0.35em] text-ink">
            CAR<span className="text-accent">CONOMY</span>
          </motion.h1>
          <p className="mt-1 text-[10px] tracking-[0.25em] text-mute uppercase">Automotive Financial Intelligence</p>

          <div className="mt-10 w-full max-w-xs">
            <div className="h-[3px] rounded-full bg-line overflow-hidden">
              <div className="h-full bg-accent transition-[width] duration-100" style={{ width: `${pct}%` }} />
            </div>
            <AnimatePresence mode="wait">
              <motion.p key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-3 text-center text-[11px] font-mono-numbers text-mute">
                {STEPS[step]}…
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
