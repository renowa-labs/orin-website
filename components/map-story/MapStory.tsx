"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type {
  FeatureCollection,
  LineString,
} from "geojson";
import type {
  GeoJSONSource,
  LngLatBoundsLike,
  Map as MapboxMap,
  Marker,
} from "mapbox-gl";
import {
  controlCoordinates,
  organizerDraftRingsGeoJSON,
  storyCheckpoints,
} from "../../data/demo-route";
import {
  getFixedMapPadding,
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE_URL,
  STORY_MOBILE_BREAKPOINT,
} from "../../lib/map-config";
import type { ControlStatus, StoryCheckpoint } from "../../types/story";
import { OrriiiLogo } from "../site/OrriiiLogo";

gsap.registerPlugin(ScrollTrigger);

const ROUTE_COMPLETED = "orriii-route-completed";
const ROUTE_ACTIVE = "orriii-route-active";
const ROUTE_UPCOMING = "orriii-route-upcoming";
const DRAFT_RING_SOURCE = "orriii-draft-rings";

const emptyLineCollection: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: [],
};

function safeActionUrl(value: string | undefined, allowedProtocols: string[]) {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return allowedProtocols.includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

const APP_STORE_URL = safeActionUrl(process.env.NEXT_PUBLIC_APP_STORE_URL, [
  "https:",
]);
const GOOGLE_PLAY_URL = safeActionUrl(
  process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL,
  ["https:"],
);
const ORRIII_DEEP_LINK = safeActionUrl(
  process.env.NEXT_PUBLIC_ORRIII_DEEP_LINK,
  ["https:", "orriii:"],
);

function Arrow() {
  return (
    <svg aria-hidden="true" className="arrow-icon" viewBox="0 0 16 16">
      <path d="M3 13 13 3M5 3h8v8" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="10" />
      <path d="m20.5 11.5-3 6-6 3 3-6 6-3Z" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path d="M9 28V5m0 1h14l-3.5 5L23 16H9" />
    </svg>
  );
}

function PlaceIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path d="M7 28V9h18v19M4 28h24M11 13h3m4 0h3m-10 5h3m4 0h3M12 28v-5h8v5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="check-icon" viewBox="0 0 18 18">
      <path d="m3.5 9.5 3.4 3.4 7.6-8" />
    </svg>
  );
}

function createMarkerElement(checkpoint: StoryCheckpoint) {
  const root = document.createElement("div");
  root.className = "checkpoint-marker";
  root.dataset.kind = checkpoint.kind;
  root.innerHTML = `
    <span class="marker__pulse" aria-hidden="true"></span>
    <span class="marker__wave" aria-hidden="true"></span>
    <span class="marker__body">
      <span class="marker__icon" aria-hidden="true"></span>
    </span>
    <span class="marker__label" aria-hidden="true">NEXT CONTROL</span>
  `;
  return root;
}

function markerIconMarkup(
  kind: StoryCheckpoint["kind"],
  status: ControlStatus,
  label: string,
) {
  if (kind === "start") {
    return `<svg viewBox="0 0 44 44" aria-hidden="true"><path d="m22 10 11 22H11L22 10Z"/></svg>`;
  }

  if (kind === "finish") {
    return status === "complete"
      ? `<svg viewBox="0 0 44 44" aria-hidden="true"><path d="m12 23 6 6 14-15"/></svg>`
      : `<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M14 34V9m0 1h17l-4 6 4 6H14"/><path d="M14 34h16"/></svg>`;
  }

  return status === "complete"
    ? `<svg viewBox="0 0 44 44" aria-hidden="true"><path class="marker__check-path" d="m12 23 6 6 14-15"/></svg>`
    : `<span class="marker__number">${label}</span>`;
}

function updateMarkerElement(
  root: HTMLDivElement,
  checkpoint: StoryCheckpoint,
  status: ControlStatus,
) {
  root.className = `checkpoint-marker checkpoint-marker--${checkpoint.kind} checkpoint-marker--${status}`;
  root.setAttribute(
    "aria-label",
    `${checkpoint.kind === "control" ? `Control ${checkpoint.mapLabel}` : checkpoint.kind} checkpoint, ${status}`,
  );
  root.dataset.status = status;

  const icon = root.querySelector<HTMLElement>(".marker__icon");
  if (icon) icon.innerHTML = markerIconMarkup(checkpoint.kind, status, checkpoint.mapLabel);

  const nextLabel = root.querySelector<HTMLElement>(".marker__label");
  if (nextLabel) nextLabel.hidden = !(checkpoint.kind === "control" && status === "active");
}

function routeFeature(coordinates: [number, number][]): FeatureCollection<LineString> {
  if (coordinates.length < 2) return emptyLineCollection;

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates },
      },
    ],
  };
}

function interpolateCoordinate(start: [number, number], end: [number, number], progress: number) {
  return [
    start[0] + (end[0] - start[0]) * progress,
    start[1] + (end[1] - start[1]) * progress,
  ] as [number, number];
}

function setSourceData(
  map: MapboxMap,
  sourceId: string,
  data: FeatureCollection<LineString>,
) {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined;
  source?.setData(data);
}

function setRouteState(map: MapboxMap, index: number, activeProgress = 1) {
  const lastIndex = controlCoordinates.length - 1;
  const completed =
    index > 0 ? routeFeature(controlCoordinates.slice(0, index + 1)) : emptyLineCollection;
  const hasActiveSegment = index < lastIndex;
  const current = controlCoordinates[index];
  const next = controlCoordinates[Math.min(index + 1, lastIndex)];
  const active = hasActiveSegment
    ? routeFeature([current, interpolateCoordinate(current, next, activeProgress)])
    : emptyLineCollection;
  const upcoming =
    index < lastIndex - 1
      ? routeFeature(controlCoordinates.slice(index + 1))
      : emptyLineCollection;

  setSourceData(map, ROUTE_COMPLETED, completed);
  setSourceData(map, ROUTE_ACTIVE, active);
  setSourceData(map, ROUTE_UPCOMING, upcoming);
  map.setPaintProperty(ROUTE_ACTIVE, "line-opacity", hasActiveSegment ? 1 : 0);
  map.setPaintProperty(`${ROUTE_ACTIVE}-casing`, "line-opacity", hasActiveSegment ? 0.82 : 0);
}

function routeLayer(map: MapboxMap, id: string, source: string, color: string, width: number, opacity: number, dasharray?: number[]) {
  map.addLayer({
    id: `${id}-casing`,
    type: "line",
    source,
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#fffdf8",
      "line-width": width + 5,
      "line-opacity": opacity * 0.82,
    },
  });
  map.addLayer({
    id,
    type: "line",
    source,
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": color,
      "line-width": width,
      "line-opacity": opacity,
      ...(dasharray ? { "line-dasharray": dasharray } : {}),
    },
  });
}

function ParticipantDetail() {
  return (
    <div className="event-detail" aria-label="Sea Breeze City Sprint route details">
      <div className="event-detail__title">
        <span>DEMO ROUTE</span>
        <strong>Sea Breeze City Sprint</strong>
      </div>
      <dl>
        <div><dt>DIFFICULTY</dt><dd>Beginner</dd></div>
        <div><dt>DISTANCE</dt><dd>2.8 km</dd></div>
        <div><dt>TIME</dt><dd>45 min</dd></div>
        <div><dt>CHECKPOINTS</dt><dd>4 controls</dd></div>
      </dl>
    </div>
  );
}

function MobileDetail() {
  return (
    <div className="mobile-detail">
      <span className="mobile-detail__label">ON THE MOVE</span>
      <div><strong>Control 02</strong><span>420 m to go</span></div>
      <div className="mobile-detail__progress"><span style={{ width: "42%" }} /></div>
      <small>1 / 4 controls completed</small>
    </div>
  );
}

function OrganizerSteps() {
  return (
    <ol className="organizer-steps">
      <li><b>01</b><span>Choose the area</span></li>
      <li><b>02</b><span>Place the controls</span></li>
      <li><b>03</b><span>Publish the experience</span></li>
    </ol>
  );
}

function DownloadActions() {
  if (!APP_STORE_URL && !GOOGLE_PLAY_URL) {
    return (
      <div className="story-actions">
        <span className="coming-soon-action">Coming soon</span>
        <a className="secondary-action" href="/contact">Join the waitlist <Arrow /></a>
      </div>
    );
  }

  return (
    <div className="story-actions">
      {APP_STORE_URL && <a className="primary-action" href={APP_STORE_URL}>App Store <Arrow /></a>}
      {GOOGLE_PLAY_URL && <a className="primary-action" href={GOOGLE_PLAY_URL}>Google Play <Arrow /></a>}
      <a className="secondary-action" href="/contact">Talk to Orriii <Arrow /></a>
    </div>
  );
}

function StoryPanel({ chapter, index, activeIndex, panelRef }: { chapter: StoryCheckpoint; index: number; activeIndex: number; panelRef: (element: HTMLElement | null) => void }) {
  const isActive = index === activeIndex;

  return (
    <article
      className={`story-panel ${isActive ? "is-active" : ""}`}
      ref={panelRef}
      aria-current={isActive ? "step" : undefined}
    >
      <div className="story-panel__topline">
        <span>{chapter.label}</span>
        <span>{String(index + 1).padStart(2, "0")} / 05</span>
      </div>
      {index === 0 ? <h1>{chapter.headline}</h1> : <h2>{chapter.headline}</h2>}
      <p className="story-panel__body">{chapter.body}</p>

      {index === 0 && (
        <div className="story-signals" aria-label="Orriii product qualities">
          <span>REAL PLACES</span><span>REAL CHECKPOINTS</span><span>ONE ADVENTURE</span>
        </div>
      )}
      {index === 1 && <ParticipantDetail />}
      {index === 2 && (
        <div className="app-detail">
          <span className="app-detail__eyebrow">LIVE ROUTE PROGRESS</span>
          <ul>
            <li><b>Next checkpoint</b><span>Control 02</span></li>
            <li><b>Distance remaining</b><span>420 m</span></li>
            <li><b>Controls completed</b><span>1 / 4</span></li>
          </ul>
        </div>
      )}
      {index === 3 && <OrganizerSteps />}

      {index === 0 && (
        <div className="story-actions">
          <a className="primary-action" href="#finish">Get Orriii <Arrow /></a>
          <a className="secondary-action" href="#participants">See how it works <Arrow /></a>
        </div>
      )}
      {index === 1 && (
        <div className="story-actions">
          {ORRIII_DEEP_LINK ? <a className="primary-action" href={ORRIII_DEEP_LINK}>Open in Orriii <Arrow /></a> : <span className="coming-soon-action">Orriii is coming soon</span>}
        </div>
      )}
      {index === 3 && (
        <div className="story-actions">
          <a className="primary-action" href="/contact">Talk to Orriii <Arrow /></a>
        </div>
      )}
      {index === 4 && <DownloadActions />}
    </article>
  );
}

export function MapStory() {
  const sceneRef = useRef<HTMLElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const markerElements = useRef<HTMLDivElement[]>([]);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const reducedMotionRef = useRef(false);
  const activeIndexRef = useRef(0);
  const transitionRef = useRef<gsap.core.Timeline | null>(null);
  const routeTweenRef = useRef<gsap.core.Tween | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [toast, setToast] = useState<{ title: string; detail: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToChapter = (index: number) => {
    const target = window.innerWidth <= STORY_MOBILE_BREAKPOINT
      ? panelRefs.current[index]
      : chapterRefs.current[index];
    target?.scrollIntoView({ behavior: reducedMotionRef.current ? "auto" : "smooth", block: "center" });
    setMenuOpen(false);
  };

  const showToast = (index: number) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({
      title: `CONTROL 0${index} COLLECTED`,
      detail: `${index} / 4 completed`,
    });
    toastTimerRef.current = setTimeout(() => setToast(null), 1400);
  };

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let cancelled = false;
    let loadTimeout: ReturnType<typeof setTimeout> | null = null;

    const initializeMap = async () => {
      const mapboxgl = await import("mapbox-gl");
      if (cancelled || !mapContainerRef.current) return;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAPBOX_STYLE_URL,
        accessToken: MAPBOX_ACCESS_TOKEN,
        center: [49.9358, 40.5792],
        zoom: 14.1,
        pitch: 0,
        bearing: 0,
        interactive: false,
        scrollZoom: false,
        dragPan: false,
        dragRotate: false,
        doubleClickZoom: false,
        touchZoomRotate: false,
        keyboard: false,
        pitchWithRotate: false,
        touchPitch: false,
        attributionControl: true,
      });
      mapRef.current = map;

      loadTimeout = setTimeout(() => {
        if (!map.loaded()) setMapFailed(true);
      }, 12_000);

      map.on("load", () => {
        if (cancelled) return;
        if (loadTimeout) clearTimeout(loadTimeout);

        map.addSource(ROUTE_COMPLETED, { type: "geojson", data: emptyLineCollection });
        map.addSource(ROUTE_ACTIVE, { type: "geojson", data: emptyLineCollection });
        map.addSource(ROUTE_UPCOMING, { type: "geojson", data: emptyLineCollection });
        map.addSource(DRAFT_RING_SOURCE, { type: "geojson", data: organizerDraftRingsGeoJSON });

        routeLayer(map, ROUTE_UPCOMING, ROUTE_UPCOMING, "#7d756e", 3, 0.7, [1.5, 2.2]);
        routeLayer(map, ROUTE_ACTIVE, ROUTE_ACTIVE, "#e9660b", 5, 1);
        routeLayer(map, ROUTE_COMPLETED, ROUTE_COMPLETED, "#42a361", 5, 1);

        map.addLayer({
          id: "orriii-draft-rings",
          type: "line",
          source: DRAFT_RING_SOURCE,
          paint: {
            "line-color": "#e9660b",
            "line-width": 2,
            "line-opacity": 0,
            "line-dasharray": [1.2, 1.8],
          },
        });

        markerRefs.current = storyCheckpoints.map((checkpoint) => {
          const element = createMarkerElement(checkpoint);
          markerElements.current.push(element);
          updateMarkerElement(element, checkpoint, "future");
          return new mapboxgl.Marker({ element, anchor: "center" })
            .setLngLat(checkpoint.coordinates)
            .addTo(map);
        });

        map.resize();
        const bounds: LngLatBoundsLike = [
          [Math.min(...controlCoordinates.map(([longitude]) => longitude)), Math.min(...controlCoordinates.map(([, latitude]) => latitude))],
          [Math.max(...controlCoordinates.map(([longitude]) => longitude)), Math.max(...controlCoordinates.map(([, latitude]) => latitude))],
        ];
        map.fitBounds(bounds, {
          padding: getFixedMapPadding(window.innerWidth <= STORY_MOBILE_BREAKPOINT),
          duration: 0,
          maxZoom: window.innerWidth <= STORY_MOBILE_BREAKPOINT ? 14.65 : 15.2,
        });
        setRouteState(map, 0, 1);
        updateMarkerStates(0, markerElements.current);
        setMapReady(true);
        setMapFailed(false);
      });
    };

    initializeMap().catch(() => setMapFailed(true));

    return () => {
      cancelled = true;
      if (loadTimeout) clearTimeout(loadTimeout);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      transitionRef.current?.kill();
      routeTweenRef.current?.kill();
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      markerElements.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.resize();
      ScrollTrigger.refresh();
    };
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 180);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    transitionRef.current?.kill();
    routeTweenRef.current?.kill();
    const previousIndex = activeIndexRef.current;
    const forward = activeIndex > previousIndex;
    const targetMarker = markerElements.current[activeIndex];
    const previousMarker = markerElements.current[previousIndex];

    updateMarkerStates(activeIndex, markerElements.current);
    setRouteState(map, activeIndex, forward && !reducedMotionRef.current ? 0 : 1);

    const cameraDuration = reducedMotionRef.current ? 0 : forward ? 900 : 520;
    moveCamera(map, activeIndex, cameraDuration);

    if (!reducedMotionRef.current && forward && activeIndex > 0) {
      const activeBody = targetMarker?.querySelector<HTMLElement>(".marker__body");
      const previousBody = previousMarker?.querySelector<HTMLElement>(".marker__body");
      const pulse = targetMarker?.querySelector<HTMLElement>(".marker__pulse");
      const progress = { value: 0 };

      transitionRef.current = gsap.timeline({ defaults: { ease: "power2.out" } });
      if (previousBody) transitionRef.current.to(previousBody, { scale: 1.08, duration: 0.14 });
      if (previousBody) transitionRef.current.to(previousBody, { scale: 1, duration: 0.2 });
      if (activeBody) transitionRef.current.fromTo(activeBody, { scale: 0.86 }, { scale: 1, duration: 0.32 }, "<0.08");
      if (pulse) transitionRef.current.fromTo(pulse, { scale: 0.6, opacity: 0.68 }, { scale: 1.48, opacity: 0, duration: 0.9 }, "<");

      routeTweenRef.current = gsap.to(progress, {
        value: 1,
        duration: 0.95,
        ease: "power2.out",
        onUpdate: () => setRouteState(map, activeIndex, progress.value),
      });
      if (activeIndex < storyCheckpoints.length - 1) {
        setTimeout(() => showToast(activeIndex), 0);
      }
    } else {
      const activeBody = activeBodyFor(targetMarker);
      if (activeBody) gsap.set(activeBody, { scale: 1 });
    }

    activeIndexRef.current = activeIndex;
  }, [activeIndex, mapReady]);

  useEffect(() => {
    const context = gsap.context(() => {
      const media = gsap.matchMedia();
      media.add(`(min-width: ${STORY_MOBILE_BREAKPOINT + 1}px)`, () => {
        chapterRefs.current.forEach((chapter, index) => {
          if (!chapter) return;
          ScrollTrigger.create({
            trigger: chapter,
            start: "top center",
            end: "bottom center",
            onEnter: () => setActiveIndex(index),
            onEnterBack: () => setActiveIndex(index),
          });
        });
      });
      media.add(`(max-width: ${STORY_MOBILE_BREAKPOINT}px)`, () => {
        panelRefs.current.forEach((panel, index) => {
          if (!panel) return;
          ScrollTrigger.create({
            trigger: panel,
            start: "top 58%",
            end: "bottom 42%",
            onEnter: () => setActiveIndex(index),
            onEnterBack: () => setActiveIndex(index),
          });
        });
      });
    }, sceneRef);

    return () => context.revert();
  }, []);

  useEffect(() => {
    const panel = panelRefs.current[activeIndex];
    if (!panel || window.matchMedia(`(max-width: ${STORY_MOBILE_BREAKPOINT}px)`).matches) return;
    const inactivePanels = panelRefs.current.filter((candidate) => candidate && candidate !== panel);
    gsap.killTweensOf(panelRefs.current.filter(Boolean));
    gsap.set(inactivePanels, { opacity: 0, y: 12, filter: "blur(0px)" });
    if (reducedMotionRef.current) {
      gsap.set(panel, { opacity: 1, y: 0, filter: "blur(0px)" });
      return;
    }
    gsap.fromTo(
      panel,
      { opacity: 0, y: 16, filter: "blur(2px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.42, ease: "power3.out" },
    );
  }, [activeIndex]);

  return (
    <>
      <header className="site-header">
        <a href="#how-it-works" aria-label="Orriii home">
          <OrriiiLogo />
        </a>
        <nav className={`site-nav ${menuOpen ? "is-open" : ""}`} id="main-navigation" aria-label="Main navigation">
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#participants" onClick={(event) => { event.preventDefault(); scrollToChapter(1); }}>Participants</a>
          <a href="#organizers" onClick={(event) => { event.preventDefault(); scrollToChapter(3); }}>Organizers</a>
          <a href="#partner-cta" onClick={() => setMenuOpen(false)}>Partners</a>
          <a className="header-cta" href="#finish" onClick={(event) => { event.preventDefault(); scrollToChapter(4); }}>Get Orriii <Arrow /></a>
        </nav>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span>{menuOpen ? "Close" : "Menu"}</span>
          <i aria-hidden="true" />
        </button>
      </header>

      <main>
        <section className="story-scene" id="how-it-works" ref={sceneRef} aria-label="Orriii course story">
          <div className="story-sticky">
            <div
              className={`story-map ${mapReady ? "is-ready" : ""}`}
              role="img"
              aria-label="Interactive Orriii course map for a Sea Breeze demo route in Baku with a start, four checkpoints and a finish"
            >
              <div ref={mapContainerRef} className="story-map__canvas" aria-hidden="true" />
              <div className="map-wash" aria-hidden="true" />
              <div className="map-meta"><span>ORRIII / LIVE COURSE PREVIEW</span><strong>SEA BREEZE / BAKU</strong></div>
              <nav className="story-progress" aria-label="Story progress">
                {storyCheckpoints.map((chapter, index) => (
                  <a className={index === activeIndex ? "is-active" : ""} href={`#${chapter.chapterId}`} onClick={(event) => { event.preventDefault(); scrollToChapter(index); }} aria-current={index === activeIndex ? "step" : undefined} key={chapter.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span><b>{chapter.progressLabel}</b>
                  </a>
                ))}
              </nav>
              <aside className="mobile-progress" aria-live="polite">
                <strong>{String(activeIndex + 1).padStart(2, "0")} / 05</strong>
                <span>{storyCheckpoints[activeIndex].progressLabel}</span>
              </aside>
              {activeIndex === 1 && <div className="map-callout"><span>ROUTE READY</span><strong>Sea Breeze City Sprint</strong><small>Start when you are ready →</small></div>}
              {activeIndex === 2 && <div className="map-callout map-callout--lower"><MobileDetail /></div>}
              {toast && <div className="map-toast" role="status"><span className="toast-check"><CheckIcon /></span><span><strong>{toast.title}</strong><small>{toast.detail}</small></span></div>}
              {activeIndex === 4 && <div className="map-success" role="status"><span>ROUTE COMPLETE</span><strong>Ready for the next adventure.</strong></div>}
              {!mapReady && !mapFailed && <div className="map-loading"><span className="map-loading__needle" /><p>Loading the course map…</p></div>}
              {mapFailed && <div className="map-error" role="status"><strong>The map could not load.</strong><p>Check the map style connection and try again.</p></div>}
            </div>
          </div>

          <div className="story-copy">
            {storyCheckpoints.map((chapter, index) => (
              <StoryPanel
                chapter={chapter}
                index={index}
                activeIndex={activeIndex}
                panelRef={(element) => {
                  panelRefs.current[index] = element;
                }}
                key={chapter.id}
              />
            ))}
          </div>

          <div className="story-triggers" aria-hidden="true">
            {storyCheckpoints.map((chapter, index) => (
              <section
                className="story-trigger"
                id={chapter.chapterId}
                ref={(element) => { chapterRefs.current[index] = element; }}
                key={chapter.id}
              />
            ))}
          </div>
        </section>

        <section className="audience-section" id="audiences">
          <div className="section-intro"><span className="eyebrow">ONE COURSE / MANY WAYS IN</span><h2>Built for the people who make a place worth visiting.</h2></div>
          <div className="audience-grid">
            <article><span className="feature-icon"><CompassIcon /></span><span className="eyebrow">FOR EXPLORERS</span><h3>Find your way outside.</h3><p>Find nearby experiences, understand the course and explore at your own pace.</p></article>
            <article><span className="feature-icon"><FlagIcon /></span><span className="eyebrow">FOR ORGANIZERS</span><h3>Make a route people remember.</h3><p>Create controls, publish routes and manage real-world activities.</p></article>
            <article><span className="feature-icon"><PlaceIcon /></span><span className="eyebrow">FOR RESORTS &amp; PARKS</span><h3>Turn a destination into an experience.</h3><p>Encourage exploration with an interactive layer for places people already love.</p></article>
          </div>
        </section>

        <section className="app-promo" id="app-promo-section">
          <div className="app-promo__copy"><span className="eyebrow">THE ORRIII APP</span><h2>Your next adventure is in your pocket.</h2><p>Keep the course close while you move through the real world.</p><ul><li>Live route progress</li><li>Distance to the next control</li><li>Checkpoint collection</li><li>Results and achievements</li></ul><div className="promo-actions"><span className="coming-soon-action">Coming soon</span><a className="secondary-action" href="/contact">Join the waitlist <Arrow /></a></div></div>
          <div className="app-promo__visual"><div className="brand-art"><Image src="/assets/orriii-brand.png" alt="Orriii runner and compass artwork" width={520} height={520} /></div><div className="phone-preview" role="img" aria-label="Orriii mobile app route progress preview"><div className="phone-preview__screen" /></div></div>
        </section>

        <section className="partner-section" id="partner-resources">
          <div className="section-intro"><span className="eyebrow">FOR ORGANIZERS / PARTNERS</span><h2>Create a course around your place.</h2></div>
          <div className="partner-grid"><p>Designed for resorts, parks, campuses, schools, clubs and communities. Orriii gives your visitors a reason to look closer, go further and come back.</p><a className="primary-action" href="/contact">Talk to Orriii <Arrow /></a></div>
        </section>

        <section className="partner-cta" id="partner-cta"><div><span className="eyebrow">READY WHEN YOU ARE</span><h2>Bring outdoor discovery to your destination.</h2></div><a className="outline-action" href="/contact">Start a conversation <Arrow /></a></section>
      </main>

      <footer className="orriii-footer">
        <OrriiiLogo full />
        <p>Orriii is a mobile orienteering product by <a href="https://www.renowa-labs.com" target="_blank" rel="noreferrer">Renowa Labs</a>. Real places, real checkpoints, one adventure.</p>
        <div><a href="/contact">Contact</a><a href="https://www.renowa-labs.com" target="_blank" rel="noreferrer">Renowa Labs</a><span>© {new Date().getFullYear()} ORRIII</span></div>
      </footer>
    </>
  );
}

function activeBodyFor(marker: HTMLDivElement | undefined) {
  return marker?.querySelector<HTMLElement>(".marker__body");
}

function updateMarkerStates(index: number, elements: HTMLDivElement[]) {
  elements.forEach((element, checkpointIndex) => {
    const status: ControlStatus = checkpointIndex < index ? "complete" : checkpointIndex === index ? "active" : "future";
    updateMarkerElement(element, storyCheckpoints[checkpointIndex], status);
  });
}

function moveCamera(map: MapboxMap, index: number, duration: number) {
  const isMobile = window.innerWidth <= STORY_MOBILE_BREAKPOINT;
  const fullBounds: LngLatBoundsLike = [
    [Math.min(...controlCoordinates.map(([longitude]) => longitude)), Math.min(...controlCoordinates.map(([, latitude]) => latitude))],
    [Math.max(...controlCoordinates.map(([longitude]) => longitude)), Math.max(...controlCoordinates.map(([, latitude]) => latitude))],
  ];
  if (index === 0 || index === storyCheckpoints.length - 1) {
    map.fitBounds(fullBounds, { padding: getFixedMapPadding(isMobile), duration, maxZoom: isMobile ? 14.65 : 15.2, easing: (t) => 1 - Math.pow(1 - t, 3) });
    return;
  }

  const focus = controlCoordinates.slice(Math.max(0, index - 1), Math.min(controlCoordinates.length, index + 2));
  const longitude = focus.reduce((sum, coordinate) => sum + coordinate[0], 0) / focus.length;
  const latitude = focus.reduce((sum, coordinate) => sum + coordinate[1], 0) / focus.length;
  map.easeTo({ center: [longitude, latitude], zoom: isMobile ? 14.72 : 14.85, duration, easing: (t) => 1 - Math.pow(1 - t, 3) });
}
