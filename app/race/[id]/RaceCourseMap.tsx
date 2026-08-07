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
      if (cancelled || !containerRef.current) return;

      const ordered = [...controlPoints].sort((a, b) => a.order - b.order);
      const coordinates = ordered.map(
        (point) => [point.coordinates.lng, point.coordinates.lat] as [number, number],
      );
      const firstCoordinate: [number, number] = coordinates[0] ?? [
        mapConfig.centerLng,
        mapConfig.centerLat,
      ];

      const courseMap = new mapboxgl.Map({
        container: containerRef.current,
        style: MAPBOX_STYLE_URL,
        config: {
          basemap: {
            lightPreset: "day",
            showPointOfInterestLabels: false,
            showTransitLabels: false,
            showPlaceLabels: true,
          },
        },
        accessToken: MAPBOX_ACCESS_TOKEN,
        center: firstCoordinate,
        zoom: Math.min(mapConfig.zoom || 15, 17),
        bearing: mapConfig.bearing ?? 0,
        pitch: 0,
        scrollZoom: false,
        attributionControl: true,
      });
      mapInstance = courseMap;

      courseMap.on("error", () => setFailed(true));
      courseMap.once("load", () => {
        if (cancelled) return;

        if (coordinates.length > 1) {
          courseMap.addSource("public-race-route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates,
              },
            },
          });
          courseMap.addLayer({
            id: "public-race-route-casing",
            type: "line",
            source: "public-race-route",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#fff8eb",
              "line-width": 9,
              "line-opacity": 0.94,
            },
          });
          courseMap.addLayer({
            id: "public-race-route-line",
            type: "line",
            source: "public-race-route",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#f16a0a",
              "line-width": 4,
              "line-opacity": 0.96,
            },
          });
        }

        markers = ordered.map((point) => {
          const element = document.createElement("div");
          element.className = "race-course__map-checkpoint";
          element.textContent = String(point.order);
          element.setAttribute(
            "aria-label",
            point.name || `Checkpoint ${point.order}`,
          );

          return new mapboxgl.Marker({ element, anchor: "center" })
            .setLngLat([point.coordinates.lng, point.coordinates.lat])
            .addTo(courseMap);
        });

        if (coordinates.length > 1) {
          const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
          coordinates.slice(1).forEach((coordinate) => bounds.extend(coordinate));
          courseMap.fitBounds(bounds, {
            padding: window.innerWidth <= 820 ? 42 : 58,
            duration: 0,
            maxZoom: 17,
          });
        } else {
          courseMap.jumpTo({ center: firstCoordinate, zoom: 16.5 });
        }

        courseMap.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          "top-right",
        );
      });
    }

    initializeMap().catch(() => setFailed(true));

    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.remove());
      mapInstance?.remove();
    };
  }, [controlPoints, mapConfig]);

  return (
    <div className="race-course__graphic race-course__graphic--map">
      <div
        ref={containerRef}
        className="race-course__map-canvas"
        aria-label="Real event course map with checkpoint positions"
      />
      {failed ? (
        <div className="race-course__map-error" role="status">
          The course map could not load.
        </div>
      ) : null}
    </div>
  );
}