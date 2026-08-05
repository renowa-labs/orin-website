"use client";

import Image from "next/image";
import Link from "next/link";
import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { FeatureCollection, LineString } from "geojson";
import type { GeoJSONSource, Map as MapboxMap, Marker } from "mapbox-gl";
import { OrriiiMapMascot, type MapMascotPose } from "../brand/OrriiiMapMascot";
import { OrriiiMascot } from "../brand/OrriiiMascot";
import { AppStoreButton, GooglePlayComingSoon } from "../site/AppStoreButton";
import { OrriiiLogo } from "../site/OrriiiLogo";
import { ScrollAwareHeader } from "../site/ScrollAwareHeader";
import { GeometricShapes } from "../brand/GeometricShapes";
import {
  CollectedStamp,
  IconForKind,
  LocationArrow,
  OrganizerFlag,
  PartnerIcon,
  TopoPattern,
} from "./MapIcons";
import {
  demoCheckpoints,
  fullRouteCoordinates,
  routeSegments,
  storyChapters,
  type Coordinate,
} from "../../data/orriii-demo-route";
import { flattenThroughCheckpoint, getPointAlongRoute, routeSliceAtProgress } from "./route-animation";
import { getFixedMapPadding, MAPBOX_ACCESS_TOKEN, MAPBOX_STYLE_URL, STORY_MOBILE_BREAKPOINT } from "../../lib/map-config";

gsap.registerPlugin(ScrollTrigger);

type RenderRoot = ReturnType<typeof createRoot>;

type MarkerHandle = {
  marker: Marker;
  element: HTMLDivElement;
  root: RenderRoot;
};

const chapterCheckpointIndices = [0, 1, 2, 3, 4] as const;
const progressLabels = ["START", "DISCOVER", "MOVE", "CREATE", "FINISH"] as const;
const chapterCamera = [
  { zoom: 15.3 },
  { zoom: 15.8 },
  { zoom: 15.72 },
  { zoom: 15.86 },
  { zoom: 15.65 },
] as const;
const selectedPlacement: Coordinate = [49.9381, 40.5792];

function lineData(coordinates: Coordinate[]): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: coordinates.length > 1
      ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } }]
      : [],
  };
}

function targetCheckpointForChapter(chapterIndex: number) {
  return chapterCheckpointIndices[Math.max(0, Math.min(chapterCheckpointIndices.length - 1, chapterIndex))];
}

function routePathBetween(fromCheckpoint: number, toCheckpoint: number): Coordinate[] {
  if (fromCheckpoint === toCheckpoint) return [demoCheckpoints[fromCheckpoint].coordinates];
  if (fromCheckpoint > toCheckpoint) return routePathBetween(toCheckpoint, fromCheckpoint).reverse();
  const path = [demoCheckpoints[fromCheckpoint].coordinates];
  routeSegments.slice(fromCheckpoint, toCheckpoint).forEach((segment) => path.push(...segment.slice(1)));
  return path;
}

function futurePathFromCheckpoint(checkpointIndex: number) {
  return routePathBetween(checkpointIndex, demoCheckpoints.length - 1);
}

function setSourceData(map: MapboxMap, id: string, coordinates: Coordinate[]) {
  const source = map.getSource(id) as GeoJSONSource | undefined;
  source?.setData(lineData(coordinates));
}

function routeStateForChapter(chapterIndex: number) {
  const targetCheckpoint = targetCheckpointForChapter(chapterIndex);
  return {
    completed: flattenThroughCheckpoint(routeSegments, targetCheckpoint),
    current: [] as Coordinate[],
    upcoming: chapterIndex === 3 ? [] : futurePathFromCheckpoint(targetCheckpoint),
  };
}

function routeStateDuringMove(
  path: Coordinate[],
  completedCheckpoint: number,
  futureCheckpoint: number,
  progress: number,
  position: ReturnType<typeof getPointAlongRoute>,
) {
  const current = routeSliceAtProgress(path, progress);
  current[current.length - 1] = position.point;
  const tail = path.slice(Math.max(0, current.length - 1));
  const later = routeSegments.slice(futureCheckpoint).flatMap((segment) => segment.slice(1));

  return {
    completed: flattenThroughCheckpoint(routeSegments, completedCheckpoint),
    current,
    upcoming: [current[current.length - 1], ...tail, ...later],
  };
}

function updateRouteSources(map: MapboxMap, state: ReturnType<typeof routeStateForChapter>) {
  setSourceData(map, "orriii-route-complete", state.completed);
  setSourceData(map, "orriii-route-active", state.current);
  setSourceData(map, "orriii-route-upcoming", state.upcoming);
}

function setCheckpointStatuses(elements: HTMLDivElement[], targetCheckpoint: number, activeCheckpoint = targetCheckpoint) {
  elements.forEach((element, index) => {
    element.dataset.status = index < targetCheckpoint ? "complete" : index === activeCheckpoint ? "active" : "upcoming";
  });
}

function CheckpointToken({
  kind,
  number,
}: {
  kind: (typeof demoCheckpoints)[number]["kind"];
  number?: string;
}) {
  return (
    <div className="checkpoint-token">
      <span className="checkpoint-token__icon"><IconForKind kind={kind} /></span>
      {number ? <span className="checkpoint-token__number">{number}</span> : null}
      <span className="checkpoint-token__next">NEXT</span>
      <span className="checkpoint-token__stamp"><CollectedStamp /></span>
      <span className="checkpoint-token__burst" aria-hidden="true"><i /><i /><i /></span>
    </div>
  );
}

function MascotMarker({ pose }: { pose: MapMascotPose }) {
  return (
    <span className="mascot-marker__inner">
      <span className="mascot-marker__bob"><OrriiiMapMascot pose={pose} /></span>
    </span>
  );
}

function PlacementAnnotation() {
  return <span className="placement-annotation"><OrganizerFlag /><span><b>NEW CHECKPOINT</b><strong>Waterfront stop</strong></span></span>;
}

function CollectionTicket({ checkpointIndex }: { checkpointIndex: number }) {
  const checkpoint = demoCheckpoints[checkpointIndex];
  const isFinish = checkpoint.kind === "finish";
  const next = isFinish ? "Another adventure" : demoCheckpoints[checkpointIndex + 1]?.name ?? "Finish flag";
  const label = isFinish ? "ROUTE COMPLETE" : `${checkpoint.name.toUpperCase()} COLLECTED`;
  const count = isFinish ? "3 / 3 checkpoints" : `${Math.min(checkpointIndex, 3)} / 3 checkpoints`;

  return (
    <div className="collection-ticket__inner">
      <span className="collection-ticket__icon"><IconForKind kind={checkpoint.kind} /></span>
      <span className="collection-ticket__copy"><b>{label}</b><strong>{count}</strong><small>Next: {next}</small></span>
    </div>
  );
}

function Arrow() {
  return <span className="button-arrow" aria-hidden="true">↗</span>;
}

function ChapterModule({ active }: { active: number }) {
  if (active === 1) {
    return <div className="chapter-module chapter-module--found"><span className="chapter-module__icon"><IconForKind kind="compass" /></span><div><strong>Compass found</strong><small>Take the scenic way.</small></div><CollectedStamp /></div>;
  }

  if (active === 2) {
    return <div className="chapter-module chapter-module--phone"><div><span className="chapter-module__label">LIVE ROUTE</span><strong>240 m to the next stop</strong></div><div className="chapter-module__progress"><span /></div><small><LocationArrow /> Follow the orange line</small></div>;
  }

  if (active === 3) {
    return <div className="organizer-explainer"><OrganizerFlag /><span><strong>Choose a spot on the map.</strong><small>Place a checkpoint where explorers should pause.</small></span></div>;
  }

  if (active === 4) {
    return <div className="chapter-module chapter-module--complete"><span className="chapter-module__icon"><IconForKind kind="finish" /></span><div><span className="chapter-module__label">ROUTE COMPLETE</span><strong>3 checkpoints collected</strong></div><CollectedStamp /></div>;
  }

  return <div className="chapter-module chapter-module--ready"><span>Run. Find. Collect. Repeat.</span></div>;
}

export function MapStory() {
  const storyRef = useRef<HTMLElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mapLoadedRef = useRef(false);
  const mascotRef = useRef<MarkerHandle | null>(null);
  const checkpointRefs = useRef<MarkerHandle[]>([]);
  const placementNoteRef = useRef<MarkerHandle | null>(null);
  const triggerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const visualChapterRef = useRef(0);
  const storyProgressRef = useRef(0);
  const completedCheckpointRef = useRef(-1);
  const mascotPoseRef = useRef<MapMascotPose>("idle");
  const mascotIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotionRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const syncStoryRef = useRef<(progress: number) => void>(() => undefined);
  const [active, setActive] = useState(0);
  const [collectionTicket, setCollectionTicket] = useState<number | null>(null);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!ticketRef.current || collectionTicket === null) return;
    if (reducedMotionRef.current) {
      gsap.set(ticketRef.current, { opacity: 1, y: 0, rotate: 0 });
      return;
    }
    const timeline = gsap.timeline();
    timeline
      .fromTo(ticketRef.current, { opacity: 0, y: 8, rotate: -1 }, { opacity: 1, y: 0, rotate: 0, duration: 0.32, ease: "power2.out" })
      .to(ticketRef.current, { opacity: 0, y: -4, duration: 0.2, ease: "power2.out" }, "+=1");
    return () => { timeline.kill(); };
  }, [collectionTicket]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let cancelled = false;

    async function initializeMap() {
      const mapboxgl = await import("mapbox-gl");
      if (cancelled || !mapContainerRef.current) return;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAPBOX_STYLE_URL,
        config: { basemap: { lightPreset: "day", showPointOfInterestLabels: false, showTransitLabels: false, showPlaceLabels: true } },
        accessToken: MAPBOX_ACCESS_TOKEN,
        center: demoCheckpoints[0].coordinates,
        zoom: 15.3,
        interactive: false,
        attributionControl: true,
      });
      mapRef.current = map;
      map.on("error", () => setMapFailed(true));
      map.once("load", () => {
        if (cancelled) return;
        mapLoadedRef.current = true;
        map.addSource("orriii-route-casing", { type: "geojson", data: lineData(fullRouteCoordinates) });
        map.addSource("orriii-route-upcoming", { type: "geojson", data: lineData(fullRouteCoordinates) });
        map.addSource("orriii-route-complete", { type: "geojson", data: lineData([demoCheckpoints[0].coordinates]) });
        map.addSource("orriii-route-active", { type: "geojson", data: lineData([]) });

        map.addLayer({ id: "orriii-route-casing", type: "line", source: "orriii-route-casing", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#fff8eb", "line-width": 10, "line-opacity": 0.94 } });
        map.addLayer({ id: "orriii-route-upcoming", type: "line", source: "orriii-route-upcoming", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#a87559", "line-width": 3, "line-dasharray": [1.2, 1.8], "line-opacity": 0.66 } });
        map.addLayer({ id: "orriii-route-complete", type: "line", source: "orriii-route-complete", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#d85a0a", "line-width": 5, "line-opacity": 0.96 } });
        map.addLayer({ id: "orriii-route-active", type: "line", source: "orriii-route-active", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#f16a0a", "line-width": 5, "line-opacity": 1 } });

        const bounds = new mapboxgl.LngLatBounds(demoCheckpoints[0].coordinates, demoCheckpoints[0].coordinates);
        fullRouteCoordinates.forEach((coordinate) => bounds.extend(coordinate));
        map.fitBounds(bounds, { padding: getFixedMapPadding(window.innerWidth <= STORY_MOBILE_BREAKPOINT), duration: 0, maxZoom: 15.8 });

        checkpointRefs.current = demoCheckpoints.map((checkpoint) => {
          const element = document.createElement("div");
          element.className = "map-checkpoint-marker";
          element.dataset.kind = checkpoint.kind;
          element.dataset.status = "upcoming";
          const root = createRoot(element);
          root.render(<CheckpointToken kind={checkpoint.kind} number={checkpoint.number} />);
          const marker = new mapboxgl.Marker({ element, anchor: "center" }).setLngLat(checkpoint.coordinates).addTo(map);
          return { marker, element, root };
        });

        const mascotElement = document.createElement("div");
        mascotElement.className = "map-mascot-marker";
        mascotElement.dataset.direction = "right";
        const mascotRoot = createRoot(mascotElement);
        mascotRoot.render(<MascotMarker pose="idle" />);
        const mascotMarker = new mapboxgl.Marker({ element: mascotElement, anchor: "bottom" }).setLngLat(demoCheckpoints[0].coordinates).addTo(map);
        mascotRef.current = { marker: mascotMarker, element: mascotElement, root: mascotRoot };

        const noteElement = document.createElement("div");
        noteElement.className = "map-placement-note";
        noteElement.dataset.visible = "false";
        const noteRoot = createRoot(noteElement);
        noteRoot.render(<PlacementAnnotation />);
        const noteMarker = new mapboxgl.Marker({ element: noteElement, anchor: "left" }).setLngLat(selectedPlacement).addTo(map);
        placementNoteRef.current = { marker: noteMarker, element: noteElement, root: noteRoot };

        cameraToChapter(map, visualChapterRef.current);
        if (visualChapterRef.current === 3) showPlacement(false);
        syncStoryRef.current(storyProgressRef.current);
      });
    }

    initializeMap().catch(() => setMapFailed(true));

    return () => {
      cancelled = true;
      if (mascotIdleTimerRef.current) clearTimeout(mascotIdleTimerRef.current);
      const roots = checkpointRefs.current.map(({ root }) => root);
      if (mascotRef.current) roots.push(mascotRef.current.root);
      if (placementNoteRef.current) roots.push(placementNoteRef.current.root);
      checkpointRefs.current.forEach(({ marker }) => marker.remove());
      mascotRef.current?.marker.remove();
      placementNoteRef.current?.marker.remove();
      mapRef.current?.remove();
      checkpointRefs.current = [];
      mascotRef.current = null;
      placementNoteRef.current = null;
      mapRef.current = null;
      mapLoadedRef.current = false;
      setTimeout(() => roots.forEach((root) => root.unmount()), 0);
    };
    // Map setup is intentionally one-shot; the helper only mutates the map refs created here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setMascotPose(pose: MapMascotPose) {
    if (mascotPoseRef.current === pose) return;
    mascotPoseRef.current = pose;
    mascotRef.current?.root.render(<MascotMarker pose={pose} />);
  }

  function stopMascotMotion() {
    const bob = mascotRef.current?.element.querySelector<HTMLElement>(".mascot-marker__bob");
    if (bob) { gsap.killTweensOf(bob); gsap.set(bob, { y: 0, scale: 1 }); }
  }

  function startMascotMotion() {
    if (reducedMotionRef.current) return;
    const bob = mascotRef.current?.element.querySelector<HTMLElement>(".mascot-marker__bob");
    if (bob) gsap.to(bob, { y: -2, duration: 0.24, ease: "sine.inOut", repeat: -1, yoyo: true, overwrite: true });
  }

  function updateScrollRouteSources(
    map: MapboxMap,
    state: ReturnType<typeof routeStateForChapter>,
    completedCheckpoint: number,
  ) {
    if (completedCheckpointRef.current !== completedCheckpoint) {
      setSourceData(map, "orriii-route-complete", state.completed);
      completedCheckpointRef.current = completedCheckpoint;
    }
    setSourceData(map, "orriii-route-active", state.current);
    setSourceData(map, "orriii-route-upcoming", state.upcoming);
  }

  function setMascotPosition(position: ReturnType<typeof getPointAlongRoute>, reversing = false) {
    const handle = mascotRef.current;
    if (!handle) return;
    handle.marker.setLngLat(position.point);
    const inner = handle.element.querySelector<HTMLElement>(".mascot-marker__inner");
    if (!inner) return;
    inner.style.setProperty("--mascot-angle", `${Math.max(-12, Math.min(12, position.heading * 0.18))}deg`);
    handle.element.dataset.direction = reversing
      ? position.horizontalDirection === "left" ? "right" : "left"
      : position.horizontalDirection;
  }

  function setPlacementVisibility(visible: boolean) {
    if (placementNoteRef.current) placementNoteRef.current.element.dataset.visible = String(visible);
  }

  function showPlacement(animate: boolean) {
    setPlacementVisibility(true);
    const note = placementNoteRef.current?.element.querySelector<HTMLElement>(".placement-annotation");
    if (animate && !reducedMotionRef.current) {
      if (note) gsap.fromTo(note, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, delay: 0.08, ease: "power2.out", overwrite: true });
    }
  }

  function hidePlacement() {
    setPlacementVisibility(false);
  }

  function cameraToChapter(map: MapboxMap, chapterIndex: number) {
    const target = targetCheckpointForChapter(chapterIndex);
    const camera = chapterCamera[chapterIndex] ?? chapterCamera[0];
    map.stop();
    map.easeTo({
      center: demoCheckpoints[target].coordinates,
      zoom: camera.zoom,
      duration: reducedMotionRef.current ? 0 : 460,
      padding: getFixedMapPadding(window.innerWidth <= STORY_MOBILE_BREAKPOINT),
      bearing: 0,
      pitch: 0,
    });
  }

  function syncStoryToScroll(progress: number) {
    const map = mapRef.current;
    const previousProgress = storyProgressRef.current;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const reversing = clampedProgress < previousProgress;
    const chapterProgress = clampedProgress * (storyChapters.length - 1);
    const fromChapter = Math.min(storyChapters.length - 2, Math.floor(chapterProgress));
    const toChapter = Math.min(storyChapters.length - 1, fromChapter + 1);
    const segmentProgress = chapterProgress >= storyChapters.length - 1 ? 1 : chapterProgress - fromChapter;
    const nextChapter = Math.max(0, Math.min(storyChapters.length - 1, Math.round(chapterProgress)));
    storyProgressRef.current = clampedProgress;

    if (nextChapter !== visualChapterRef.current) {
      const movingForward = nextChapter > visualChapterRef.current;
      visualChapterRef.current = nextChapter;
      setActive(nextChapter);
      setCollectionTicket(movingForward && nextChapter > 0 ? targetCheckpointForChapter(nextChapter) : null);

      if (panelRef.current && !reducedMotionRef.current) {
        gsap.killTweensOf(panelRef.current);
        gsap.fromTo(
          panelRef.current,
          { opacity: 0.55, y: movingForward ? 10 : -10 },
          { opacity: 1, y: 0, duration: 0.26, ease: "power3.out", overwrite: true },
        );
      }

      if (map && mapLoadedRef.current) {
        cameraToChapter(map, nextChapter);
        if (nextChapter === 3) showPlacement(false);
        else hidePlacement();
      }
    }

    if (!map || !mapLoadedRef.current) return;

    const fromCheckpoint = targetCheckpointForChapter(fromChapter);
    const toCheckpoint = targetCheckpointForChapter(toChapter);
    const path = routePathBetween(fromCheckpoint, toCheckpoint);

    if (reducedMotionRef.current) {
      const target = targetCheckpointForChapter(nextChapter);
      if (completedCheckpointRef.current !== target) {
        updateRouteSources(map, routeStateForChapter(nextChapter));
        completedCheckpointRef.current = target;
      }
      setCheckpointStatuses(checkpointRefs.current.map(({ element }) => element), target);
      mascotRef.current?.marker.setLngLat(demoCheckpoints[target].coordinates);
      setMascotPose(nextChapter === storyChapters.length - 1 ? "celebrating" : "idle");
      return;
    }

    const position = getPointAlongRoute(path, segmentProgress);
    setMascotPosition(position, reversing);
    if (segmentProgress <= 0.01) {
      updateScrollRouteSources(map, routeStateForChapter(fromChapter), fromCheckpoint);
      setCheckpointStatuses(checkpointRefs.current.map(({ element }) => element), fromCheckpoint);
    } else {
      updateScrollRouteSources(map, routeStateDuringMove(path, fromCheckpoint, toCheckpoint, segmentProgress, position), fromCheckpoint);
      checkpointRefs.current.forEach(({ element }, index) => {
        element.dataset.status = index <= fromCheckpoint ? "complete" : index === toCheckpoint ? "active" : "upcoming";
      });
    }

    const isMoving = Math.abs(clampedProgress - previousProgress) > 0.0001;
    if (isMoving && mascotPoseRef.current !== "running") {
      setMascotPose("running");
      startMascotMotion();
    }
    if (mascotIdleTimerRef.current) clearTimeout(mascotIdleTimerRef.current);
    if (isMoving) {
      mascotIdleTimerRef.current = setTimeout(() => {
        stopMascotMotion();
        setMascotPose(nextChapter === storyChapters.length - 1 ? "celebrating" : "idle");
      }, 140);
    }
  }

  syncStoryRef.current = syncStoryToScroll;

  useEffect(() => {
    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: storyRef.current,
        start: () => `top top+=${window.innerWidth <= STORY_MOBILE_BREAKPOINT ? 64 : 76}`,
        end: "bottom bottom",
        onToggle: (self) => document.documentElement.classList.toggle("story-snapping", self.isActive),
        onUpdate: (self) => syncStoryRef.current(self.progress),
        onRefresh: (self) => syncStoryRef.current(self.progress),
      });
    }, storyRef);
    return () => {
      document.documentElement.classList.remove("story-snapping");
      context.revert();
    };
  }, []);

  const currentChapter = storyChapters[active];

  function jumpToChapter(index: number) {
    triggerRefs.current[index]?.scrollIntoView({ behavior: reducedMotionRef.current ? "auto" : "smooth", block: "start" });
  }

  return (
    <>
      <ScrollAwareHeader
        navItems={[
          { label: "How it works", href: "#how-it-works" },
          { label: "For organizers", href: "#organizers" },
        ]}
      />

      <main>
        <section className="story-course" id="how-it-works" ref={storyRef} aria-labelledby="story-title">
          <div className="story-course__sticky">
            <div className="story-course__map" id="story-map">
              <div ref={mapContainerRef} className="story-course__map-canvas" aria-label="Animated Sea Breeze Orriii route preview" />
              <div className="map-course-badge"><span>LIVE DEMO ROUTE</span><strong>SEA BREEZE / BAKU</strong><small><LocationArrow /> 3 checkpoints + finish</small></div>
              <div className="map-course-legend" aria-hidden="true"><span><i className="legend-line legend-line--orange" /> collected</span><span><i className="legend-line legend-line--dashed" /> ahead</span></div>
              {collectionTicket !== null ? <div className="collection-ticket" ref={ticketRef} aria-live="polite"><CollectionTicket checkpointIndex={collectionTicket} /></div> : null}
              <div className="map-course-progress">
                <div className="map-course-progress__desktop" role="tablist" aria-label="Orriii story chapters">
                  {progressLabels.map((label, index) => <button key={label} type="button" role="tab" aria-selected={active === index} aria-label={`Go to chapter ${index + 1}: ${label}`} className={active === index ? "is-active" : active > index ? "is-complete" : ""} onClick={() => jumpToChapter(index)}><span>{String(index + 1).padStart(2, "0")}</span><b>{label}</b>{active > index ? <i aria-hidden="true">✓</i> : null}</button>)}
                </div>
                <div className="map-course-progress__mobile" role="status" aria-live="polite"><span>{String(active + 1).padStart(2, "0")} / 05</span><b>{progressLabels[active]}</b></div>
              </div>
              {mapFailed ? <div className="map-error" role="status"><strong>The route map could not load.</strong><p>The story is still available below.</p></div> : null}
            </div>

            <div className="story-course__copy" ref={panelRef} id="explorers">
              <span className="sr-only" aria-live="polite">Chapter {active + 1} of {storyChapters.length}: {currentChapter.title}</span>
              {active === 0 ? <span className="story-kicker">OUTSIDE IS CALLING</span> : null}
              <span className="story-eyebrow">{currentChapter.label}</span>
              <h1 id="story-title">{currentChapter.title}</h1>
              <p>{currentChapter.body}</p>
              <ChapterModule active={active} />
              <div className="story-actions"><AppStoreButton className="primary-action" /><a className="secondary-action" href={active === 4 ? "#partners" : "#app"}>{active === 4 ? "Explore for partners" : "See how it works"} <Arrow /></a></div>
            </div>
          </div>
          <div className="story-course__triggers" aria-hidden="true">{storyChapters.map((chapter, index) => <div key={chapter.id} ref={(element) => { triggerRefs.current[index] = element; }} />)}</div>
        </section>

        <section className="app-section" id="app" aria-labelledby="app-title">
          <div className="app-section__visual"><TopoPattern className="topo-pattern" /><span className="app-section__sticker">YOUR POCKET COMPASS</span><Image src="/assets/orriii-iphone-cutout.png" alt="The Orriii app showing a route and checkpoint progress on a phone" width={726} height={1563} sizes="(max-width: 820px) 72vw, 30vw" /><div className="app-section__mascot"><OrriiiMascot pose="pointing" title="Orriii mascot pointing to the app" /></div></div>
          <div className="app-section__copy"><span className="section-eyebrow">THE ORRIII APP</span><h2 id="app-title">The adventure continues in your pocket.</h2><p>See your next checkpoint, follow your route and collect progress while you move.</p><ul className="app-feature-list"><li><span>01</span>Live route progress</li><li><span>02</span>Distance to the next checkpoint</li><li><span>03</span>Checkpoint collection</li><li><span>04</span>Results and achievements</li></ul><div className="app-section__actions"><AppStoreButton className="primary-action" /><a className="secondary-action" href="/contact?interest=app-store">Join the launch list <Arrow /></a></div><div className="app-section__secondary-store"><span>Also coming to</span><GooglePlayComingSoon /></div></div>
        </section>

        <section className="partner-section" id="partners" aria-labelledby="partner-title"><GeometricShapes className="partner-section__shapes" /><span id="organizers" className="anchor-target" aria-hidden="true" /><div className="partner-section__intro"><span className="section-eyebrow">FOR ORGANIZERS & PARTNERS</span><h2 id="partner-title">Turn your place into a playable route.</h2><p>Create checkpoints around a resort, park, campus or community and give visitors a new way to explore it.</p></div><ol className="partner-steps"><li><div className="partner-step__icon"><PartnerIcon /></div><span>01</span><strong>Pick the place</strong><small>Choose a place people want to wander.</small></li><li><div className="partner-step__icon"><LocationArrow /></div><span>02</span><strong>Drop the checkpoints</strong><small>Give every corner a reason to be found.</small></li><li><div className="partner-step__icon"><OrganizerFlag /></div><span>03</span><strong>Publish the adventure</strong><small>Put your route in front of explorers.</small></li></ol><div className="partner-section__actions"><a className="outline-action" href="/contact?interest=partner">Build an Orriii experience <Arrow /></a><a className="secondary-action" href="/contact">Talk to the team <Arrow /></a></div></section>

        <section className="destination-cta" aria-labelledby="destination-title"><div><span className="section-eyebrow">NEXT DESTINATION</span><h2 id="destination-title">Where will you play next?</h2><p>Start with a real place. Add a little curiosity. Let Orriii draw the rest.</p></div><a className="primary-action" href="#how-it-works">Run the demo route <Arrow /></a></section>
      </main>

      <footer className="orriii-footer"><Link href="/" aria-label="Orriii home"><OrriiiLogo /></Link><p>Orriii is a mobile orienteering product by <a href="https://www.renowa-labs.com" target="_blank" rel="noreferrer">Renowa Labs</a>.</p><div><a href="/contact">Contact</a><a href="/privacy">Privacy</a><a href="#how-it-works">How it works</a><span>© {new Date().getFullYear()} ORRIII</span></div></footer>
    </>
  );
}
