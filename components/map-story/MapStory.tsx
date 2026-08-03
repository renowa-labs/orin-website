"use client";

import Image from "next/image";
import Link from "next/link";
import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { FeatureCollection, LineString } from "geojson";
import type { GeoJSONSource, Map as MapboxMap, Marker } from "mapbox-gl";
import { OrriiiMascot, type MascotPose } from "../brand/OrriiiMascot";
import { AppStoreButton, GooglePlayComingSoon } from "../site/AppStoreButton";
import { OrriiiLogo } from "../site/OrriiiLogo";
import {
  CollectedStamp,
  DiscoveryIcon,
  Footprints,
  IconForKind,
  LocationArrow,
  PartnerIcon,
  OrganizerFlag,
  TopoPattern,
} from "./MapIcons";
import {
  demoCheckpoints,
  fullRouteCoordinates,
  routeSegments,
  storyChapters,
  type Coordinate,
} from "../../data/orriii-demo-route";
import { flattenThroughCheckpoint, interpolateRoute, routeSliceAtProgress } from "./route-animation";
import { getFixedMapPadding, MAPBOX_ACCESS_TOKEN, MAPBOX_STYLE_URL, STORY_MOBILE_BREAKPOINT } from "../../lib/map-config";

gsap.registerPlugin(ScrollTrigger);

type RenderRoot = ReturnType<typeof createRoot>;

type MarkerHandle = {
  marker: Marker;
  element: HTMLDivElement;
  root: RenderRoot;
};

function lineData(coordinates: Coordinate[]): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: coordinates.length > 1
      ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } }]
      : [],
  };
}

function futurePathFromCheckpoint(checkpointIndex: number) {
  const first = demoCheckpoints[checkpointIndex].coordinates;
  const rest = routeSegments.slice(checkpointIndex).flatMap((segment) => segment.slice(1));
  return [first, ...rest];
}

function setSourceData(map: MapboxMap, id: string, coordinates: Coordinate[]) {
  const source = map.getSource(id) as GeoJSONSource | undefined;
  source?.setData(lineData(coordinates));
}

function routeStateForChapter(chapterIndex: number) {
  return {
    completed: flattenThroughCheckpoint(routeSegments, chapterIndex),
    current: [] as Coordinate[],
    upcoming: futurePathFromCheckpoint(chapterIndex),
  };
}

function routeStateDuringMove(segmentIndex: number, progress: number) {
  const segment = routeSegments[segmentIndex];
  const current = routeSliceAtProgress(segment, progress);
  const tail = segment.slice(Math.max(0, current.length - 1));
  const later = routeSegments.slice(segmentIndex + 1).flatMap((item) => item.slice(1));

  return {
    completed: flattenThroughCheckpoint(routeSegments, segmentIndex),
    current,
    upcoming: [current[current.length - 1], ...tail, ...later],
  };
}

function updateRouteSources(map: MapboxMap, state: ReturnType<typeof routeStateForChapter>) {
  setSourceData(map, "orriii-route-complete", state.completed);
  setSourceData(map, "orriii-route-active", state.current);
  setSourceData(map, "orriii-route-upcoming", state.upcoming);
}

function checkpointMarkup(kind: (typeof demoCheckpoints)[number]["kind"], number?: string) {
  return { kind, number };
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
      <span className="checkpoint-token__label">NEXT STOP</span>
      <span className="checkpoint-token__stamp"><CollectedStamp /></span>
      <span className="checkpoint-token__burst" aria-hidden="true"><i /><i /><i /><i /></span>
    </div>
  );
}

function MascotMarker({ pose }: { pose: MascotPose }) {
  return (
    <span className="mascot-marker__inner">
      <span className="mascot-marker__bob"><OrriiiMascot pose={pose} /></span>
    </span>
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
    return <div className="chapter-module chapter-module--alternate"><div><span className="chapter-module__label">ORGANIZER VIEW</span><strong>Try a waterfront detour</strong></div><span className="chapter-module__path"><i /><i /><i /></span><span className="chapter-module__alt-dot" /></div>;
  }

  if (active === 4) {
    return <div className="chapter-module chapter-module--complete"><span className="chapter-module__icon"><DiscoveryIcon /></span><div><span className="chapter-module__label">ROUTE COMPLETE</span><strong>4 checkpoints collected</strong></div><Footprints /></div>;
  }

  return <div className="chapter-module chapter-module--ready"><Footprints /><span>Run. Find. Collect. Repeat.</span></div>;
}

export function MapStory() {
  const storyRef = useRef<HTMLElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mapLoadedRef = useRef(false);
  const mascotRef = useRef<MarkerHandle | null>(null);
  const checkpointRefs = useRef<MarkerHandle[]>([]);
  const triggerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const activeRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let cancelled = false;

    async function initializeMap() {
      const mapboxgl = await import("mapbox-gl");
      if (cancelled || !mapContainerRef.current) return;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
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
        map.addSource("orriii-organizer-detour", { type: "geojson", data: lineData([[49.9362, 40.5811], [49.9382, 40.5799], [49.9376, 40.5796]]) });

        map.addLayer({ id: "orriii-route-casing", type: "line", source: "orriii-route-casing", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#fff8eb", "line-width": 11, "line-opacity": 0.92 } });
        map.addLayer({ id: "orriii-route-upcoming", type: "line", source: "orriii-route-upcoming", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#a87559", "line-width": 4, "line-dasharray": [1.2, 1.8], "line-opacity": 0.7 } });
        map.addLayer({ id: "orriii-route-complete", type: "line", source: "orriii-route-complete", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#d85a0a", "line-width": 5, "line-opacity": 0.96 } });
        map.addLayer({ id: "orriii-route-active", type: "line", source: "orriii-route-active", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#f16a0a", "line-width": 5, "line-dasharray": [0.6, 1.1], "line-opacity": 1 } });
        map.addLayer({ id: "orriii-organizer-detour", type: "line", source: "orriii-organizer-detour", layout: { "line-cap": "round", "line-join": "round", visibility: "none" }, paint: { "line-color": "#58a85f", "line-width": 3, "line-dasharray": [0.5, 1.3], "line-opacity": 0.85 } });

        const bounds = new mapboxgl.LngLatBounds(demoCheckpoints[0].coordinates, demoCheckpoints[0].coordinates);
        fullRouteCoordinates.forEach((coordinate) => bounds.extend(coordinate));
        map.fitBounds(bounds, { padding: getFixedMapPadding(window.innerWidth <= STORY_MOBILE_BREAKPOINT), duration: 0, maxZoom: 15.8 });

        checkpointRefs.current = demoCheckpoints.map((checkpoint) => {
          const element = document.createElement("div");
          element.className = "map-checkpoint-marker";
          element.dataset.status = checkpoint.id === "start" ? "active" : "upcoming";
          const root = createRoot(element);
          const props = checkpointMarkup(checkpoint.kind, checkpoint.number);
          root.render(<CheckpointToken {...props} />);
          const marker = new mapboxgl.Marker({ element, anchor: "center" }).setLngLat(checkpoint.coordinates).addTo(map);
          return { marker, element, root };
        });

        const mascotElement = document.createElement("div");
        mascotElement.className = "map-mascot-marker";
        mascotElement.dataset.direction = "right";
        const mascotRoot = createRoot(mascotElement);
        mascotRoot.render(<MascotMarker pose="idle" />);
        const mascotMarker = new mapboxgl.Marker({ element: mascotElement, anchor: "center" }).setLngLat(demoCheckpoints[0].coordinates).addTo(map);
        mascotRef.current = { marker: mascotMarker, element: mascotElement, root: mascotRoot };
        updateRouteSources(map, routeStateForChapter(0));
      });
    }

    initializeMap().catch(() => setMapFailed(true));

    return () => {
      cancelled = true;
      timelineRef.current?.kill();
      checkpointRefs.current.forEach(({ marker, root }) => { marker.remove(); root.unmount(); });
      mascotRef.current?.marker.remove();
      mascotRef.current?.root.unmount();
      checkpointRefs.current = [];
      mascotRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      mapLoadedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const context = gsap.context(() => {
      triggerRefs.current.forEach((trigger, index) => {
        if (!trigger) return;
        ScrollTrigger.create({
          trigger,
          start: "top 58%",
          end: "bottom 42%",
          onEnter: () => setActive(index),
          onEnterBack: () => setActive(index),
        });
      });
    }, storyRef);

    return () => context.revert();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const previous = activeRef.current;
    activeRef.current = active;
    timelineRef.current?.kill();

    if (!map || !mapLoadedRef.current) return;
    const storyMap = map;

    function setMarkerStatuses(chapterIndex: number) {
      checkpointRefs.current.forEach(({ element }, index) => {
        element.dataset.status = index < chapterIndex ? "complete" : index === chapterIndex ? "active" : "upcoming";
      });
    }

    function setMascotPose(pose: MascotPose) {
      const handle = mascotRef.current;
      if (!handle) return;
      handle.root.render(<MascotMarker pose={pose} />);
    }

    function setMascotHeading(heading: number, from: Coordinate, to: Coordinate) {
      const handle = mascotRef.current;
      if (!handle) return;
      const inner = handle.element.querySelector<HTMLElement>(".mascot-marker__inner");
      if (!inner) return;
      inner.style.setProperty("--mascot-angle", `${Math.max(-22, Math.min(22, heading * 0.24))}deg`);
      handle.element.dataset.direction = to[0] < from[0] ? "left" : "right";
    }

    function stopMascotBob() {
      const bob = mascotRef.current?.element.querySelector<HTMLElement>(".mascot-marker__bob");
      if (!bob) return;
      gsap.killTweensOf(bob);
      gsap.set(bob, { y: 0 });
    }

    function startMascotBob() {
      const bob = mascotRef.current?.element.querySelector<HTMLElement>(".mascot-marker__bob");
      if (!bob) return;
      gsap.killTweensOf(bob);
      gsap.to(bob, { y: -3, duration: 0.22, ease: "sine.inOut", repeat: -1, yoyo: true });
    }

    function putMascotAtChapter(chapterIndex: number) {
      const handle = mascotRef.current;
      if (!handle) return;
      stopMascotBob();
      handle.marker.setLngLat(demoCheckpoints[chapterIndex].coordinates);
      setMascotHeading(0, demoCheckpoints[Math.max(0, chapterIndex - 1)].coordinates, demoCheckpoints[chapterIndex].coordinates);
      setMascotPose(chapterIndex === demoCheckpoints.length - 1 ? "celebrating" : "idle");
    }

    function settleAtChapter(chapterIndex: number) {
      updateRouteSources(storyMap, routeStateForChapter(chapterIndex));
      setMarkerStatuses(chapterIndex);
      putMascotAtChapter(chapterIndex);
      if (storyMap.getLayer("orriii-organizer-detour")) {
        storyMap.setLayoutProperty("orriii-organizer-detour", "visibility", chapterIndex === 3 ? "visible" : "none");
      }
    }

    if (previous === active) {
      settleAtChapter(active);
      return;
    }

    const reduced = reducedMotionRef.current;
    if (reduced || active < previous) {
      settleAtChapter(active);
      if (active !== 0) {
        map.easeTo({ center: demoCheckpoints[active].coordinates, zoom: active === 4 ? 15.65 : 15.8, duration: reduced ? 0 : 580, padding: getFixedMapPadding(window.innerWidth <= STORY_MOBILE_BREAKPOINT) });
      }
      return;
    }

    const segmentIndex = previous;
    const segment = routeSegments[segmentIndex];
    const progress = { value: 0 };
    const timeline = gsap.timeline({ defaults: { overwrite: true } });
    timelineRef.current = timeline;

    setMarkerStatuses(previous);
    setMascotPose("running");
    startMascotBob();
    updateRouteSources(map, routeStateDuringMove(segmentIndex, 0));
    timeline.to(panelRef.current, { opacity: 0.46, y: 9, duration: 0.18, ease: "power2.in" }, 0);
    timeline.add(() => {
      map.easeTo({ center: demoCheckpoints[active].coordinates, zoom: active === 4 ? 15.65 : 15.8, duration: 920, padding: getFixedMapPadding(window.innerWidth <= STORY_MOBILE_BREAKPOINT) });
    }, 0.08);
    timeline.to(progress, {
      value: 1,
      duration: 1.08,
      ease: "power2.inOut",
      onUpdate: () => {
        const { point, heading } = interpolateRoute(segment, progress.value);
        mascotRef.current?.marker.setLngLat(point);
        setMascotHeading(heading, segment[0], segment[segment.length - 1]);
        updateRouteSources(map, routeStateDuringMove(segmentIndex, progress.value));
        if (map.getLayer("orriii-route-active")) {
          const phase = 0.55 + progress.value * 0.45;
          map.setPaintProperty("orriii-route-active", "line-dasharray", [phase, 1.05]);
        }
      },
      onComplete: () => {
        settleAtChapter(active);
        setMascotPose(active === demoCheckpoints.length - 1 ? "celebrating" : "idle");
      },
    }, 0.2);
    timeline.to(panelRef.current, { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, 1.2);
  }, [active]);

  const currentChapter = storyChapters[active];

  function jumpToChapter(index: number) {
    const target = triggerRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: reducedMotionRef.current ? "auto" : "smooth", block: "start" });
    } else {
      setActive(index);
    }
  }

  return (
    <>
      <header className="site-header">
        <Link href="/" aria-label="Orriii home"><OrriiiLogo /></Link>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#explorers">For explorers</a>
          <a href="#organizers">For organizers</a>
          <a href="#partners">Partners</a>
          <AppStoreButton className="header-cta" />
        </nav>
      </header>

      <main>
        <section className="story-course" id="how-it-works" ref={storyRef} aria-labelledby="story-title">
          <div className="story-course__sticky">
            <div className="story-course__map" id="story-map">
              <div ref={mapContainerRef} className="story-course__map-canvas" aria-label="Interactive Sea Breeze Orriii demo route" />
              <div className="map-course-badge"><span>LIVE DEMO ROUTE</span><strong>SEA BREEZE / BAKU</strong><small><LocationArrow /> 4 checkpoints + finish</small></div>
              <div className="map-course-legend" aria-hidden="true"><span><i className="legend-line legend-line--orange" /> collected</span><span><i className="legend-line legend-line--dashed" /> ahead</span></div>
              <div className="map-course-callout" aria-live="polite"><span>{currentChapter.callout}</span><strong>{currentChapter.count}</strong><small><Footprints /> keep moving</small></div>
              <div className="map-course-progress" role="tablist" aria-label="Orriii course chapters">
                {storyChapters.map((chapter, index) => (
                  <button key={chapter.id} type="button" role="tab" aria-selected={active === index} aria-label={`Go to chapter ${index + 1}: ${chapter.label}`} className={active === index ? "is-active" : active > index ? "is-complete" : ""} onClick={() => jumpToChapter(index)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <b>{chapter.label.split(" / ")[1]}</b>
                  </button>
                ))}
              </div>
              {mapFailed ? <div className="map-error" role="status"><strong>The route map could not load.</strong><p>The course story is still available below.</p></div> : null}
            </div>

            <div className="story-course__copy" ref={panelRef} id="explorers" aria-live="polite">
              {active === 0 ? <span className="story-kicker">OUTSIDE IS CALLING</span> : null}
              <span className="story-eyebrow">{currentChapter.label}</span>
              <h1 id="story-title">{currentChapter.title}</h1>
              <p>{currentChapter.body}</p>
              <ChapterModule active={active} />
              <div className="story-actions">
                <AppStoreButton className="primary-action" />
                <a className="secondary-action" href={active === 4 ? "#partners" : "#app"}>{active === 4 ? "Explore for partners" : "See how it works"} <Arrow /></a>
              </div>
            </div>
          </div>

          <div className="story-course__triggers" aria-hidden="true">
            {storyChapters.map((chapter, index) => <div key={chapter.id} ref={(element) => { triggerRefs.current[index] = element; }} />)}
          </div>
        </section>

        <section className="app-section" id="app" aria-labelledby="app-title">
          <div className="app-section__visual">
            <TopoPattern className="topo-pattern" />
            <span className="app-section__sticker">YOUR POCKET COMPASS</span>
            <Image src="/assets/orriii-iphone-product.png" alt="The Orriii app showing a route and checkpoint progress on a phone" width={840} height={1100} />
            <div className="app-section__mascot"><OrriiiMascot pose="pointing" title="Orriii mascot pointing to the app" /></div>
          </div>
          <div className="app-section__copy">
            <span className="section-eyebrow">THE ORRIII APP</span>
            <h2 id="app-title">The adventure continues in your pocket.</h2>
            <p>See your next checkpoint, follow your route and collect progress while you move.</p>
            <ul className="app-feature-list">
              <li><span>01</span>Live route progress</li>
              <li><span>02</span>Distance to the next checkpoint</li>
              <li><span>03</span>Checkpoint collection</li>
              <li><span>04</span>Results and achievements</li>
            </ul>
            <div className="app-section__actions"><AppStoreButton className="primary-action" /><a className="secondary-action" href="/contact?interest=app-store">Join the launch list <Arrow /></a></div>
            <div className="app-section__secondary-store"><span>Also coming to</span><GooglePlayComingSoon /></div>
          </div>
        </section>

        <section className="partner-section" id="partners" aria-labelledby="partner-title">
          <span id="organizers" className="anchor-target" aria-hidden="true" />
          <div className="partner-section__intro"><span className="section-eyebrow">FOR ORGANIZERS & PARTNERS</span><h2 id="partner-title">Turn your place into a playable route.</h2><p>Create checkpoints around a resort, park, campus or community and give visitors a new way to explore it.</p></div>
          <ol className="partner-steps">
            <li><div className="partner-step__icon"><PartnerIcon /></div><span>01</span><strong>Pick the place</strong><small>Choose a place people want to wander.</small></li>
            <li><div className="partner-step__icon"><LocationArrow /></div><span>02</span><strong>Drop the checkpoints</strong><small>Give every corner a reason to be found.</small></li>
            <li><div className="partner-step__icon"><OrganizerFlag /></div><span>03</span><strong>Publish the adventure</strong><small>Put your route in front of explorers.</small></li>
          </ol>
          <div className="partner-section__actions"><a className="outline-action" href="/contact?interest=partner">Build an Orriii experience <Arrow /></a><a className="secondary-action" href="/contact">Talk to the team <Arrow /></a></div>
        </section>

        <section className="destination-cta" aria-labelledby="destination-title"><div><span className="section-eyebrow">NEXT DESTINATION</span><h2 id="destination-title">Where will you play next?</h2><p>Start with a real place. Add a little curiosity. Let Orriii draw the rest.</p></div><a className="primary-action" href="#how-it-works">Run the demo route <Arrow /></a></section>
      </main>

      <footer className="orriii-footer"><Link href="/" aria-label="Orriii home"><OrriiiLogo /></Link><p>Orriii is a mobile orienteering product by <a href="https://www.renowa-labs.com" target="_blank" rel="noreferrer">Renowa Labs</a>.</p><div><a href="/contact">Contact</a><a href="#how-it-works">How it works</a><span>© {new Date().getFullYear()} ORRIII</span></div></footer>
    </>
  );
}
