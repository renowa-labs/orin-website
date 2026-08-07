"use client";

import { useEffect, useRef, useState } from "react";

import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE_URL,
} from "@/lib/map-config";

type PublicControlPoint = {
  id: string;
  order: number;
  name?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
};

type PublicMapConfig = {
  centerLat: number;
  centerLng: number;
  zoom: number;
  bearing?: number;
};

type Props = {
  controlPoints: PublicControlPoint[];
  map: PublicMapConfig;
};

type MarkerHandle = {
  remove: () => void;
};

export default function RaceCourseMap({ controlPoints, map: mapConfig }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || controlPoints.length === 0) return;

    let cancelled = false;
    let mapInstance: import("mapbox-gl").Map | null = null;
    let markers: MarkerHandle[] = [];

    async function initializeMap() {
      const mapboxgl = await import("mapbox-gl");
      if (cancelled || !mapContainerRef.current) return;
    }
  }, []);

  return null;
}