import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyThemeToDocument,
  getStoredTheme,
  getSystemTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "../lib/theme";

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  isDark: boolean;
  setTheme: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() => getStoredTheme());
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(getStoredTheme()));

  // Keep DOM + localStorage in sync whenever preference changes.
  useEffect(() => {
    const next = resolveTheme(preference);
    setResolved(next);
    applyThemeToDocument(next);
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  }, [preference]);

  // Follow OS changes while preference is "system".
  useEffect(() => {
    if (preference !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = getSystemTheme();
      setResolved(next);
      applyThemeToDocument(next);
    };

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const setTheme = useCallback((next: ThemePreference) => {
    setPreference(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference((prev) => {
      const current = resolveTheme(prev);
      return current === "dark" ? "light" : "dark";
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolved,
      isDark: resolved === "dark",
      setTheme,
      toggleTheme,
    }),
    [preference, resolved, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
