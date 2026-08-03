import type { PaddingOptions } from "mapbox-gl";

// This is the same Mapbox Standard style used by ORIENTEERING_FRONT.
export const MAPBOX_STYLE_URL =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL || "mapbox://styles/mapbox/standard";

// Public Mapbox tokens are intended for client-side map rendering. Keep this
// fallback aligned with the mobile app so the hosted site works without a
// separate runtime environment variable.
export const MAPBOX_ACCESS_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  "pk.eyJ1IjoidnVnYXJoc252IiwiYSI6ImNtcW8zOW1yNTAwMXMycXF2dG1wcmxjcDMifQ.wMVD_CKHif8JZohSHpXAkw";

export const STORY_MOBILE_BREAKPOINT = 820;

export function getFixedMapPadding(isMobile: boolean): PaddingOptions {
  if (typeof window === "undefined") {
    return { top: 88, right: 80, bottom: 88, left: 80 };
  }

  if (isMobile) {
    const sheetRatio =
      window.innerWidth <= 350 || window.innerHeight <= 620
        ? 0.74
        : window.innerWidth >= 600
          ? 0.52
          : 0.6;

    return {
      top: 82,
      right: 24,
      bottom: Math.round(window.innerHeight * sheetRatio),
      left: 24,
    };
  }

  return {
    top: 96,
    right: Math.min(180, Math.round(window.innerWidth * 0.18)),
    bottom: 76,
    left: Math.min(590, Math.round(window.innerWidth * 0.54)),
  };
}
