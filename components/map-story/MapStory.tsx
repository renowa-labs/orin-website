"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { FeatureCollection, LineString } from "geojson";
import type { GeoJSONSource, Map as MapboxMap, Marker } from "mapbox-gl";
import { MAPBOX_ACCESS_TOKEN, MAPBOX_STYLE_URL } from "../../lib/map-config";
import { OrriiiLogo } from "../site/OrriiiLogo";

gsap.registerPlugin(ScrollTrigger);

const eventPoints: [number, number][] = [
  [49.9319, 40.5788],
  [49.9336, 40.5802],
  [49.9353, 40.5791],
  [49.9368, 40.5809],
];

const stages = [
  {
    eyebrow: "01 / FIND AN EVENT",
    title: "An event worth stepping out for.",
    body: "Browse events already published by Orriii partners, then choose the one that fits your day.",
  },
  {
    eyebrow: "02 / SEE THE DETAILS",
    title: "Know what to expect before you go.",
    body: "Every event gives you the essentials: place, distance, difficulty and time.",
  },
  {
    eyebrow: "03 / EXPLORE WITH ORRIII",
    title: "The next checkpoint, right when you need it.",
    body: "Open the event in the app to navigate, collect checkpoints and follow your progress.",
  },
  {
    eyebrow: "04 / FOR PARTNERS",
    title: "You create the event. People discover it.",
    body: "Only partners publish events with Orriii. Participants explore the events you make available.",
  },
] as const;

function Arrow() {
  return <svg aria-hidden="true" className="arrow-icon" viewBox="0 0 16 16"><path d="M3 13 13 3M5 3h8v8" /></svg>;
}

function eventLine(points: [number, number][]): FeatureCollection<LineString> {
  return { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: points } }] };
}

function createMarker(index: number) {
  const element = document.createElement("div");
  element.className = "event-marker";
  element.dataset.status = index === 0 ? "active" : "upcoming";
  element.innerHTML = `<span class="event-marker__dot"><span class="event-marker__number">${index + 1}</span><span class="event-marker__check">✓</span></span>`;
  return element;
}

export function MapStory() {
  const sceneRef = useRef<HTMLElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerElementsRef = useRef<HTMLDivElement[]>([]);
  const markerRefs = useRef<Marker[]>([]);
  const triggerRefs = useRef<(HTMLElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let cancelled = false;
    const initializeMap = async () => {
      const mapboxgl = await import("mapbox-gl");
      if (cancelled || !mapContainerRef.current) return;
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAPBOX_STYLE_URL,
        accessToken: MAPBOX_ACCESS_TOKEN,
        center: [49.935, 40.58],
        zoom: 15.1,
        interactive: false,
        attributionControl: true,
      });
      mapRef.current = map;
      map.on("load", () => {
        if (cancelled) return;
        map.addSource("orriii-event-route", { type: "geojson", data: eventLine(eventPoints) });
        map.addSource("orriii-event-progress", { type: "geojson", data: eventLine(eventPoints.slice(0, 2)) });
        for (const [id, color, width] of [["orriii-event-route", "#aeb7cc", 3], ["orriii-event-progress", "#e9660b", 5]] as const) {
          map.addLayer({ id, type: "line", source: id, layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": color, "line-width": width, "line-opacity": 0.9 } });
        }
        markerRefs.current = eventPoints.map((point, index) => {
          const element = createMarker(index);
          markerElementsRef.current.push(element);
          return new mapboxgl.Marker({ element, anchor: "center" }).setLngLat(point).addTo(map);
        });
      });
    };
    initializeMap().catch(() => setMapFailed(true));
    return () => {
      cancelled = true;
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      markerElementsRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
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
    }, sceneRef);
    return () => context.revert();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const previous = activeRef.current;
    const progressSource = map?.getSource("orriii-event-progress") as GeoJSONSource | undefined;
    progressSource?.setData(eventLine(eventPoints.slice(0, Math.min(active + 2, eventPoints.length))));
    markerElementsRef.current.forEach((marker, index) => {
      marker.dataset.status = index < active ? "complete" : index === active ? "active" : "upcoming";
    });

    if (panelRef.current && previous !== active) {
      gsap.fromTo(panelRef.current, { opacity: 0, y: 12, filter: "blur(2px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.34, ease: "power3.out", overwrite: true });
    }
    const marker = markerElementsRef.current[Math.min(active, eventPoints.length - 1)]?.querySelector(".event-marker__dot");
    if (marker && previous !== active) gsap.fromTo(marker, { scale: 0.88 }, { scale: 1, duration: 0.3, ease: "back.out(2)", overwrite: true });
    activeRef.current = active;
  }, [active]);

  return (
    <>
      <header className="site-header">
        <a href="#how-it-works" aria-label="Orriii home"><OrriiiLogo /></a>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a><a href="#partners">Partners</a><a className="header-cta" href="/contact">Talk to us <Arrow /></a>
        </nav>
      </header>

      <main>
        <section className="event-story" id="how-it-works" ref={sceneRef} aria-label="How Orriii events work">
          <div className="event-story__sticky">
            <div className="event-story__map">
              <div ref={mapContainerRef} className="event-story__map-canvas" aria-hidden="true" />
              <div className="event-story__map-meta"><span>FEATURED PARTNER EVENT</span><strong>SEA BREEZE / BAKU</strong></div>
              {mapFailed && <div className="map-error" role="status"><strong>The map could not load.</strong><p>Please try again.</p></div>}
            </div>
            <div className="event-story__copy" ref={panelRef}>
              <span className="eyebrow">{stages[active].eyebrow}</span>
              <h1>{stages[active].title}</h1>
              <p>{stages[active].body}</p>
              {active === 0 && <a className="primary-action" href="#partners">Partner with Orriii <Arrow /></a>}
              {active === 2 && <a className="secondary-action" href="/contact">Join the waitlist <Arrow /></a>}
              {active === 3 && <a className="primary-action" href="/contact">Start a conversation <Arrow /></a>}
            </div>
            <nav className="event-story__progress" aria-label="Story progress">
              {stages.map((stage, index) => <span className={index === active ? "is-active" : index < active ? "is-complete" : ""} key={stage.eyebrow}>{String(index + 1).padStart(2, "0")}</span>)}
            </nav>
          </div>
          <div className="event-story__triggers" aria-hidden="true">
            {stages.map((stage, index) => <div ref={(element) => { triggerRefs.current[index] = element; }} key={stage.eyebrow} />)}
          </div>
        </section>

        <section className="app-promo" id="app">
          <div className="app-promo__copy"><span className="eyebrow">THE ORRIII APP</span><h2>One clear view while you explore.</h2><p>Event information, your next checkpoint and progress all stay in one place.</p><a className="secondary-action" href="/contact">Join the waitlist <Arrow /></a></div>
          <div className="app-promo__visual"><Image src="/assets/orriii-iphone-product.png" alt="Orriii app open on a phone" width={840} height={1100} priority /></div>
        </section>

        <section className="partner-cta" id="partners"><div><span className="eyebrow">FOR PARTNERS</span><h2>Create the event. We help people find it.</h2><p>Partners publish events. Participants join the events that are already live.</p></div><a className="outline-action" href="/contact">Start a conversation <Arrow /></a></section>
      </main>

      <footer className="orriii-footer"><OrriiiLogo full /><p>Orriii is a mobile orienteering product by <a href="https://www.renowa-labs.com" target="_blank" rel="noreferrer">Renowa Labs</a>.</p><div><a href="/contact">Contact</a><span>© {new Date().getFullYear()} ORRIII</span></div></footer>
    </>
  );
}
