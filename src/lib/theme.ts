export const THEME_STORAGE_KEY = "klick-edu-theme";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") return getSystemTheme();
  return preference;
}

/** Apply resolved theme to <html> — drives Tailwind `dark:` and CSS variables. */
export function applyThemeToDocument(theme: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

/** Blocking bootstrap — call from inline script in index.html before paint. */
export function bootstrapTheme(): ResolvedTheme {
  const preference = getStoredTheme();
  const resolved = resolveTheme(preference);
  applyThemeToDocument(resolved);
  return resolved;
}
