"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { storyChapters } from "../../data/orriii-demo-route";
import { STORY_MOBILE_BREAKPOINT } from "../../lib/map-config";

gsap.registerPlugin(ScrollTrigger);

const chapterSnapPoints = storyChapters.map(
  (_, index) => index / (storyChapters.length - 1),
);

export function StorySnapController() {
  useEffect(() => {
    const story = document.querySelector<HTMLElement>(".story-course");

    if (!story) return;

    const root = document.documentElement;
    const previousScrollSnapType = root.style.scrollSnapType;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // MapStory still toggles its historical CSS snap class. Keep browser
    // snapping disabled and let ScrollTrigger own the chapter positions.
    root.style.scrollSnapType = "none";

    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: story,
        start: () =>
          `top top+=${
            window.innerWidth <= STORY_MOBILE_BREAKPOINT ? 64 : 76
          }`,
        end: "bottom bottom",
        invalidateOnRefresh: true,
        snap: {
          snapTo: chapterSnapPoints,
          directional: true,
          inertia: false,
          delay: 0.04,
          duration: prefersReducedMotion
            ? 0.01
            : { min: 0.32, max: 0.58 },
          ease: prefersReducedMotion ? "none" : "power3.inOut",
        },
      });
    }, story);

    return () => {
      context.revert();
      root.style.scrollSnapType = previousScrollSnapType;
    };
  }, []);

  return null;
}
