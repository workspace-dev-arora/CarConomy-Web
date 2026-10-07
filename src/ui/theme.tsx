import React, { createContext, useContext, useEffect, useState } from 'react';
type T = 'light' | 'dark';
const Ctx = createContext<{ theme: T; toggle: () => void }>({ theme: 'light', toggle: () => {} });
export const useTheme = () => useContext(Ctx);
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<T>(() => {
    try { return (localStorage.getItem('cc_theme') as T) || 'light'; } catch { return 'light'; }
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('cc_theme', theme); } catch {}
  }, [theme]);
  return <Ctx.Provider value={{ theme, toggle: () => setTheme(t => (t === 'light' ? 'dark' : 'light')) }}>{children}</Ctx.Provider>;
};
