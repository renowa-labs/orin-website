import type { PaddingOptions, StyleSpecification } from "maplibre-gl";

export const DEFAULT_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: "Orin OOMap canvas",
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {},
  layers: [
    {
      id: "orin-map-background",
      type: "background",
      paint: {
        "background-color": "#f6f4ee",
      },
    },
  ],
};

export const MAP_STYLE: string | StyleSpecification =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEFAULT_MAP_STYLE;

export const OOMAP_IMAGE_URL = "/assets/tiergarten-oomap.jpg";

// OOMap StreetO export: A4 landscape, 1:7,000, centred on Tiergarten.
// MapLibre image-source coordinates are ordered top-left clockwise.
export const OOMAP_IMAGE_COORDINATES: [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
] = [
  [13.340759011895658, 52.51818903378775],
  [13.359434986652502, 52.51818903378775],
  [13.359434986652502, 52.51015278765278],
  [13.340759011895658, 52.51015278765278],
];

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
