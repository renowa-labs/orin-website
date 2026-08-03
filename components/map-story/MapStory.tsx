"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type {
  GeoJSONSource,
  LngLatBoundsLike,
  Map as MapLibreMap,
} from "maplibre-gl";
import {
  collectionRadiusGeoJSON,
  controlCoordinates,
  createControlGeoJSON,
  organizerDraftPointsGeoJSON,
  organizerDraftRingsGeoJSON,
  storyCheckpoints,
} from "../../data/demo-route";
import {
  getFixedMapPadding,
  MAP_STYLE,
  OOMAP_IMAGE_COORDINATES,
  OOMAP_IMAGE_URL,
  STORY_MOBILE_BREAKPOINT,
} from "../../lib/map-config";
import type { ControlKind, ControlStatus } from "../../types/story";
import { OrinLogo } from "../site/OrinLogo";

gsap.registerPlugin(ScrollTrigger);

const CONTROL_SOURCE = "orin-controls";
const OOMAP_SOURCE = "orin-oomap";
const OOMAP_BACKDROP = "orin-oomap-backdrop";
const OOMAP_LAYER = "orin-oomap-raster";
const RADIUS_SOURCE = "orin-collection-radius";
const DRAFT_POINT_SOURCE = "orin-draft-points";
const DRAFT_RING_SOURCE = "orin-draft-rings";

// Add released destinations in the deployment environment. Until then,
// acquisition controls intentionally render honest non-link states.
function safeActionUrl(
  value: string | undefined,
  allowedProtocols: string[],
) {
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
const ORIN_DEEP_LINK = safeActionUrl(process.env.NEXT_PUBLIC_ORIN_DEEP_LINK, [
  "https:",
  "orin:",
]);

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function ConceptSequence() {
  return (
    <div
      className="concept-sequence"
      aria-label="Discover an event, open it in Orin, reach the controls, complete the event"
    >
      {[
        "DISCOVER AN EVENT",
        "OPEN IT IN ORIN",
        "REACH THE CONTROLS",
        "COMPLETE THE EVENT",
      ].map((step, index) => (
        <span key={step}>
          <b>{String(index + 1).padStart(2, "0")}</b>
          {step}
        </span>
      ))}
    </div>
  );
}

function ParticipantEvidence() {
  return (
    <>
    <div className="event-summary">
        <div>
          <span>PARTNER EVENT</span>
          <strong>Tiergarten City Sprint</strong>
        </div>
        <dl>
          <div><dt>FORMAT</dt><dd>Sprint</dd></div>
          <div><dt>DISTANCE</dt><dd>2.8 km</dd></div>
          <div><dt>CONTROLS</dt><dd>6 controls</dd></div>
          <div><dt>LEVEL</dt><dd>Beginner friendly</dd></div>
        </dl>
      </div>
    <ul className="benefit-list">
      <li>Discover local events</li>
      <li>Understand the event before joining</li>
      <li>Open the event directly in Orin</li>
      </ul>
    </>
  );
}

function AppPhonePreview({
  placement,
}: {
  placement: "desktop" | "mobile";
}) {
  return (
    <div
      className={`app-device-showcase app-device-showcase--${placement}`}
      role="img"
      aria-label="Orin mobile app navigation screen showing distance to the next checkpoint and collected-control progress"
    >
      <div className="app-experience__image" aria-hidden="true" />
    </div>
  );
}

function AppExperience() {
  return (
    <div className="app-experience">
      <AppPhonePreview placement="mobile" />
      <div className="app-experience__details">
        <span className="preview-label">MOBILE APP PREVIEW</span>
        <ul>
          <li>Distance to the next control</li>
          <li>Collected control progress</li>
          <li>Physical finish verification</li>
        </ul>
        <p>GPS navigation and checkpoint collection happen only inside the Orin mobile app.</p>
      </div>
    </div>
  );
}

function OrganizerSteps() {
  return (
    <ol className="organizer-steps">
      <li><b>01</b><span>Choose the event area</span></li>
      <li><b>02</b><span>Plan the controls</span></li>
      <li><b>03</b><span>Publish with Orin</span></li>
    </ol>
  );
}

function DownloadActions() {
  if (!APP_STORE_URL && !GOOGLE_PLAY_URL) {
    return (
      <div className="download-actions">
        <span className="coming-soon-action">Coming soon</span>
        <a className="secondary-action" href="/contact">
          Join the waitlist
        </a>
      </div>
    );
  }

  return (
    <div className="download-actions">
      {APP_STORE_URL && (
        <a className="primary-action" href={APP_STORE_URL}>
          App Store <Arrow />
        </a>
      )}
      {GOOGLE_PLAY_URL && (
        <a className="primary-action" href={GOOGLE_PLAY_URL}>
          Google Play <Arrow />
        </a>
      )}
      <a className="secondary-action" href="/contact">
        Contact Orin
      </a>
    </div>
  );
}

function StoryPanel({
  index,
  activeIndex,
}: {
  index: number;
  activeIndex: number;
}) {
  const chapter = storyCheckpoints[index];
  const isStart = chapter.chapterId === "start";
  const isParticipants = chapter.chapterId === "participants";
  const isApp = chapter.chapterId === "mobile-app";
  const isOrganizers = chapter.chapterId === "organizers";
  const isFinish = chapter.chapterId === "finish";

  return (
    <article
      className={`story-panel ${isApp ? "story-panel--app" : ""} ${
        activeIndex === index ? "is-active" : ""
      }`}
      aria-current={activeIndex === index ? "step" : undefined}
    >
      <div className="story-panel__topline">
        <span>{chapter.label}</span>
        <span>{String(index + 1).padStart(2, "0")} / 05</span>
      </div>
      {isStart ? <h1>{chapter.headline}</h1> : <h2>{chapter.headline}</h2>}
      <p className="story-panel__body">{chapter.body}</p>

      {isStart && <ConceptSequence />}
      {isParticipants && <ParticipantEvidence />}
      {isApp && <AppExperience />}
      {isOrganizers && <OrganizerSteps />}

      {isStart && (
        <>
          <div className="story-panel__actions">
            <a className="primary-action" href="#finish">Get Orin <Arrow /></a>
            <a className="secondary-action" href="#participants">See how it works</a>
          </div>
          <p className="product-boundary">
            Events are played in the Orin mobile app, not in the browser.
          </p>
        </>
      )}

      {isParticipants && (
        <div className="story-panel__actions">
          {ORIN_DEEP_LINK ? (
            <a className="primary-action" href={ORIN_DEEP_LINK}>
              View in Orin <Arrow />
            </a>
          ) : (
            <span className="coming-soon-action">Orin is coming soon</span>
          )}
        </div>
      )}

      {isOrganizers && (
        <>
          <div className="story-panel__actions">
            <a className="primary-action" href="/contact">
              Talk about a partnership <Arrow />
            </a>
          </div>
          <p className="organizer-use-case">
            For partner organisations, including clubs, schools, campuses and communities.
          </p>
        </>
      )}

      {isFinish && <DownloadActions />}
    </article>
  );
}

function createEndpointIcon(
  kind: Extract<ControlKind, "start" | "finish">,
  status: ControlStatus,
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  const color =
    status === "active"
      ? "#ff641e"
      : status === "complete"
        ? "#159761"
        : "#24282b";

  context.clearRect(0, 0, 64, 64);
  context.lineCap = "round";
  context.lineJoin = "round";

  if (kind === "start") {
    context.beginPath();
    context.moveTo(32, 8);
    context.lineTo(55, 50);
    context.lineTo(9, 50);
    context.closePath();
    context.fillStyle = status === "complete" ? color : "#ffffff";
    context.fill();
    context.lineWidth = 10;
    context.strokeStyle = "#ffffff";
    context.stroke();
    context.lineWidth = status === "active" ? 7 : 5;
    context.strokeStyle = color;
    context.stroke();
  } else {
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(32, 32, 24, 0, Math.PI * 2);
    context.fill();
    context.lineWidth = 10;
    context.strokeStyle = "#ffffff";
    context.stroke();
    context.lineWidth = status === "active" ? 7 : 5;
    context.strokeStyle = color;
    context.stroke();
    context.beginPath();
    context.arc(32, 32, 14, 0, Math.PI * 2);
    context.lineWidth = 4;
    context.stroke();
  }

  if (status === "complete") {
    context.strokeStyle = "#ffffff";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(23, 31);
    context.lineTo(29, 38);
    context.lineTo(42, 24);
    context.stroke();
  }

  return context.getImageData(0, 0, 64, 64);
}

export function MapStory() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
  const viewportRef = useRef({ width: 0, height: 0, mobile: false });
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotionRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  const fitFixedCamera = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const isMobile = window.innerWidth <= STORY_MOBILE_BREAKPOINT;
    const bounds: LngLatBoundsLike = [
      [
        Math.min(...controlCoordinates.map(([longitude]) => longitude)),
        Math.min(...controlCoordinates.map(([, latitude]) => latitude)),
      ],
      [
        Math.max(...controlCoordinates.map(([longitude]) => longitude)),
        Math.max(...controlCoordinates.map(([, latitude]) => latitude)),
      ],
    ];

    map.resize();
    map.fitBounds(bounds, {
      padding: getFixedMapPadding(isMobile),
      duration: 0,
      maxZoom: isMobile ? 14.75 : 15.15,
    });
  }, []);

  const updateMapState = useCallback((index: number) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource(CONTROL_SOURCE) as GeoJSONSource | undefined;
    source?.setData(createControlGeoJSON(index));

    const showCollectionRadius = index === 2;
    map.setPaintProperty(
      "orin-collection-radius",
      "circle-opacity",
      showCollectionRadius ? 0.1 : 0,
    );
    map.setPaintProperty(
      "orin-collection-radius",
      "circle-stroke-opacity",
      showCollectionRadius ? 0.68 : 0,
    );

    const showDrafts = index === 3;
    map.setPaintProperty(
      "orin-draft-rings",
      "line-opacity",
      showDrafts ? 0.9 : 0,
    );
    map.setLayoutProperty(
      "orin-draft-labels",
      "visibility",
      showDrafts ? "visible" : "none",
    );
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let cancelled = false;
    let loadTimeout: ReturnType<typeof setTimeout> | null = null;

    const initializeMap = async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !mapContainerRef.current) return;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        center: [13.3502, 52.5144],
        zoom: 14.25,
        bearing: 0,
        pitch: 0,
        interactive: false,
        scrollZoom: false,
        dragPan: false,
        dragRotate: false,
        doubleClickZoom: false,
        touchZoomRotate: false,
        keyboard: false,
        pitchWithRotate: false,
        touchPitch: false,
        attributionControl: {
          compact: true,
          customAttribution:
            'OpenOrienteeringMap © <a href="https://oomap.dna-software.co.uk/" target="_blank" rel="noopener noreferrer">OOMap</a>',
        },
      });
      mapRef.current = map;

      map.on("styleimagemissing", (event) => {
        if (!map.hasImage(event.id)) {
          map.addImage(event.id, {
            width: 1,
            height: 1,
            data: new Uint8Array([0, 0, 0, 0]),
          });
        }
      });

      loadTimeout = setTimeout(() => {
        if (!map.loaded()) setMapFailed(true);
      }, 12_000);

      map.on("load", () => {
        if (cancelled) return;
        if (loadTimeout) clearTimeout(loadTimeout);

        map.addSource(OOMAP_SOURCE, {
          type: "image",
          url: OOMAP_IMAGE_URL,
          coordinates: OOMAP_IMAGE_COORDINATES,
        });
        map.addLayer({
          id: OOMAP_BACKDROP,
          type: "background",
          paint: {
            "background-color": "#f6f4ee",
          },
        });
        map.addLayer({
          id: OOMAP_LAYER,
          type: "raster",
          source: OOMAP_SOURCE,
          paint: {
            "raster-contrast": -0.12,
            "raster-fade-duration": 0,
            "raster-opacity": 0.88,
            "raster-resampling": "linear",
            "raster-saturation": -0.22,
          },
        });

        (["future", "active", "complete"] as ControlStatus[]).forEach(
          (status) => {
            (["start", "finish"] as const).forEach((kind) => {
              map.addImage(
                `${kind}-${status}`,
                createEndpointIcon(kind, status),
                { pixelRatio: 2 },
              );
            });
          },
        );

        map.addSource(CONTROL_SOURCE, {
          type: "geojson",
          data: createControlGeoJSON(0),
        });
        map.addSource(RADIUS_SOURCE, {
          type: "geojson",
          data: collectionRadiusGeoJSON,
        });
        map.addSource(DRAFT_POINT_SOURCE, {
          type: "geojson",
          data: organizerDraftPointsGeoJSON,
        });
        map.addSource(DRAFT_RING_SOURCE, {
          type: "geojson",
          data: organizerDraftRingsGeoJSON,
        });

        map.addLayer({
          id: "orin-collection-radius",
          type: "circle",
          source: RADIUS_SOURCE,
          paint: {
            "circle-radius": 58,
            "circle-color": "#ff641e",
            "circle-opacity": 0,
            "circle-stroke-color": "#ff641e",
            "circle-stroke-width": 1.5,
            "circle-stroke-opacity": 0,
          },
        });
        map.addLayer({
          id: "orin-control-halo",
          type: "circle",
          source: CONTROL_SOURCE,
          filter: ["==", ["get", "kind"], "control"],
          paint: {
            "circle-radius": 23,
            "circle-color": "#ffffff",
            "circle-opacity": 0.9,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 3,
            "circle-blur": 0.08,
          },
        });
        map.addLayer({
          id: "orin-control-active-ring",
          type: "circle",
          source: CONTROL_SOURCE,
          filter: ["==", ["get", "kind"], "control"],
          paint: {
            "circle-radius": [
              "case",
              ["==", ["get", "status"], "active"],
              28,
              0,
            ],
            "circle-color": "rgba(255,100,30,0.16)",
            "circle-stroke-color": "#ff641e",
            "circle-stroke-width": 3,
            "circle-opacity-transition": { duration: 190 },
            "circle-radius-transition": { duration: 190 },
          },
        });
        map.addLayer({
          id: "orin-control-core",
          type: "circle",
          source: CONTROL_SOURCE,
          filter: ["==", ["get", "kind"], "control"],
          paint: {
            "circle-radius": 18,
            "circle-color": [
              "case",
              ["==", ["get", "status"], "complete"],
              "#159761",
              "#ffffff",
            ],
            "circle-stroke-color": [
              "match",
              ["get", "status"],
              "active",
              "#ff641e",
              "complete",
              "#159761",
              "#24282b",
            ],
            "circle-stroke-width": [
              "case",
              ["==", ["get", "status"], "active"],
              4,
              3,
            ],
            "circle-color-transition": { duration: 190 },
            "circle-stroke-color-transition": { duration: 190 },
          },
        });
        map.addLayer({
          id: "orin-control-number",
          type: "symbol",
          source: CONTROL_SOURCE,
          filter: ["==", ["get", "kind"], "control"],
          layout: {
            "text-field": ["get", "label"],
            "text-size": 16,
            "text-font": ["Noto Sans Regular"],
            "text-allow-overlap": true,
          },
          paint: {
            "text-color": [
              "case",
              ["==", ["get", "status"], "complete"],
              "#ffffff",
              "#121416",
            ],
          },
        });
        map.addLayer({
          id: "orin-control-check",
          type: "symbol",
          source: CONTROL_SOURCE,
          filter: [
            "all",
            ["==", ["get", "kind"], "control"],
            ["==", ["get", "status"], "complete"],
          ],
          layout: {
            "text-field": "✓",
            "text-size": 12,
            "text-font": ["Noto Sans Regular"],
            "text-offset": [1.15, -1.05],
            "text-allow-overlap": true,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "#159761",
            "text-halo-width": 2,
          },
        });
        map.addLayer({
          id: "orin-endpoints",
          type: "symbol",
          source: CONTROL_SOURCE,
          filter: ["!=", ["get", "kind"], "control"],
          layout: {
            "icon-image": ["get", "icon"],
            "icon-size": 1.35,
            "icon-allow-overlap": true,
          },
        });
        map.addLayer({
          id: "orin-draft-rings",
          type: "line",
          source: DRAFT_RING_SOURCE,
          paint: {
            "line-color": "#ff641e",
            "line-opacity": 0,
            "line-width": 2,
            "line-dasharray": [1.5, 1.4],
            "line-opacity-transition": { duration: 190 },
          },
        });
        map.addLayer({
          id: "orin-draft-labels",
          type: "symbol",
          source: DRAFT_POINT_SOURCE,
          layout: {
            visibility: "none",
            "text-field": ["get", "label"],
            "text-size": 12,
            "text-font": ["Noto Sans Regular"],
            "text-allow-overlap": true,
          },
          paint: {
            "text-color": "#ff641e",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });

        fitFixedCamera();
        viewportRef.current = {
          width: window.innerWidth,
          height: window.innerHeight,
          mobile: window.innerWidth <= STORY_MOBILE_BREAKPOINT,
        };
        setMapReady(true);
        setMapFailed(false);
      });
    };

    initializeMap().catch(() => setMapFailed(true));

    return () => {
      cancelled = true;
      if (loadTimeout) clearTimeout(loadTimeout);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [fitFixedCamera]);

  useEffect(() => {
    const onResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        const nextMobile = window.innerWidth <= STORY_MOBILE_BREAKPOINT;
        const previous = viewportRef.current;
        const meaningfulResize =
          Math.abs(window.innerWidth - previous.width) > 40 ||
          Math.abs(window.innerHeight - previous.height) > 40 ||
          nextMobile !== previous.mobile;

        if (!meaningfulResize) return;
        viewportRef.current = {
          width: window.innerWidth,
          height: window.innerHeight,
          mobile: nextMobile,
        };
        fitFixedCamera();
      }, 160);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fitFixedCamera]);

  useEffect(() => {
    if (!mapReady) return;
    updateMapState(activeIndex);
  }, [activeIndex, mapReady, updateMapState]);

  useEffect(() => {
    const context = gsap.context(() => {
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

    return () => context.revert();
  }, []);

  useEffect(() => {
    if (reducedMotionRef.current) return;
    const panel = chapterRefs.current[activeIndex]?.querySelector(".story-panel");
    if (!panel) return;
    gsap.fromTo(
      panel,
      { autoAlpha: 0.64, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.26, ease: "power2.out" },
    );
  }, [activeIndex]);

  return (
    <>
      <main className="map-story">
        <div className="map-stage">
          <div
            ref={mapContainerRef}
            className={`persistent-map ${mapReady ? "is-ready" : ""}`}
            aria-label="Fixed map showing a conceptual Orin demo event in Berlin with start, three controls and finish"
          />
          <div className="map-wash" aria-hidden="true" />

          <header className="orin-header">
            <a href="#start" aria-label="Orin home"><OrinLogo /></a>
            <nav aria-label="Main navigation">
              <a href="#participants">Participants</a>
              <a href="#organizers">Partners</a>
              <a className="header-action" href="#finish">Get Orin <Arrow /></a>
            </nav>
          </header>

          <div className="map-identity">
            <span>OPENORIENTEERINGMAP / PARTNER EVENT</span>
            <strong>TIERGARTEN / BERLIN</strong>
          </div>

          <nav className="story-progress" aria-label="Story progress">
            {storyCheckpoints.map((chapter, index) => (
              <a
                className={index === activeIndex ? "is-active" : ""}
                href={`#${chapter.chapterId}`}
                aria-current={index === activeIndex ? "step" : undefined}
                key={chapter.id}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{chapter.progressLabel}</b>
              </a>
            ))}
          </nav>

          <aside className="mobile-progress" aria-live="polite">
            <strong>{String(activeIndex + 1).padStart(2, "0")} / 05</strong>
            <span>{storyCheckpoints[activeIndex].progressLabel}</span>
          </aside>

          {!mapReady && !mapFailed && (
            <div className="map-loading">
              <span />
              <p>Loading the Tiergarten demo event…</p>
            </div>
          )}
          {mapFailed && (
            <div className="map-error" role="status">
              <strong>The map could not load.</strong>
              <p>Check the map style connection and try again.</p>
            </div>
          )}
        </div>

        <div className="story-chapters">
          {storyCheckpoints.map((chapter, index) => (
            <section
              className={`story-chapter ${
                chapter.chapterId === "mobile-app"
                  ? "story-chapter--app"
                  : ""
              }`}
              id={chapter.chapterId}
              ref={(element) => {
                chapterRefs.current[index] = element;
              }}
              key={chapter.id}
            >
              <StoryPanel index={index} activeIndex={activeIndex} />
              {chapter.chapterId === "mobile-app" && (
                <AppPhonePreview placement="desktop" />
              )}
            </section>
          ))}
        </div>

        <ol className="sr-only">
          <li>How Orin works: a mobile orienteering platform</li>
          <li>For participants: discover and review an event</li>
          <li>Inside the app: navigate to physical controls</li>
          <li>For partner organisations: publish an event with Orin</li>
          <li>Get Orin: join the waitlist or download the app</li>
        </ol>
      </main>

      <footer className="orin-footer">
        <OrinLogo />
        <p>
          Orin is a mobile application by{" "}
          <a
            href="https://www.renowa-labs.com"
            target="_blank"
            rel="noreferrer"
          >
            Renowa Labs
          </a>
          . Events are played in the app, not in the browser.
        </p>
        <div>
          <a href="/contact">Contact</a>
          <a
            href="https://www.renowa-labs.com"
            target="_blank"
            rel="noreferrer"
          >
            Renowa Labs
          </a>
          <span>© {new Date().getFullYear()} ORIN</span>
        </div>
      </footer>
    </>
  );
}
