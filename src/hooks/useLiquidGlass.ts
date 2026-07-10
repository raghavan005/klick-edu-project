import { useEffect, type RefObject } from "react";
import { liquidGlass, type LiquidGlassInstance, type LiquidGlassOptions } from "../lib/liquidGlass";

const DEFAULT_OPTS: LiquidGlassOptions = {
  scale: -112,
  chroma: 6,
  blur: 8,
  saturate: 1.6,
  fallbackBlur: 20,
};

/**
 * Apply liquid glass to a ref'd element. Cleans up (destroy + removes SVG filter) on unmount.
 */
export function useLiquidGlass(
  ref: RefObject<HTMLElement | null>,
  opts: LiquidGlassOptions = DEFAULT_OPTS,
  /** Re-apply when theme changes so the displacement map matches the new backdrop. */
  themeKey?: string,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let instance: LiquidGlassInstance | null = null;
    let cancelled = false;

    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      instance = liquidGlass(el, opts);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      instance?.destroy();
    };
  }, [enabled, ref, themeKey, opts.scale, opts.chroma, opts.blur, opts.saturate, opts.fallbackBlur, opts.border, opts.mapBlur, opts.radius]);
}
