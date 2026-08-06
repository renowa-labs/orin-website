"use client";

import { useEffect } from "react";
import gsap from "gsap";

const STEP_DURATION = 0.55;

export function StorySnapController() {
  useEffect(() => {
    const nextSection = document.querySelector<HTMLElement>(".app-section");
    const stops = Array.from(
      document.querySelectorAll<HTMLElement>(".story-course__triggers > div"),
    );

    if (!nextSection || stops.length === 0) return;
    const nextSectionElement = nextSection;

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    const previousScrollSnapType = root.style.scrollSnapType;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const scroll = { y: window.scrollY };
    let transitioning = false;
    let queuedDirection = 0;
    let nativeDirection = 0;
    let lastScrollY = window.scrollY;
    let nativeScrollTimer: ReturnType<typeof setTimeout> | undefined;
    let tween: gsap.core.Tween | undefined;

    root.style.scrollBehavior = "auto";
    root.style.scrollSnapType = "none";

    function topOf(element: HTMLElement) {
      const scrollMargin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
      return Math.max(0, element.getBoundingClientRect().top + window.scrollY - scrollMargin);
    }

    function moveTo(target: number) {
      nativeDirection = 0;
      scroll.y = window.scrollY;

      if (prefersReducedMotion) {
        window.scrollTo(0, target);
        return;
      }

      transitioning = true;
      tween = gsap.to(scroll, {
        y: target,
        duration: STEP_DURATION,
        ease: "power3.inOut",
        overwrite: true,
        onUpdate: () => window.scrollTo(0, scroll.y),
        onComplete,
      });
    }

    function moveBy(direction: number) {
      const targets = stops.map(topOf);
      const nextSectionTop = topOf(nextSectionElement);
      const inStory = window.scrollY >= targets[0] - 1 && window.scrollY < nextSectionTop - 1;

      if (!inStory) return;

      const current = targets.reduce(
        (nearest, target, index) =>
          Math.abs(target - window.scrollY) < Math.abs(targets[nearest] - window.scrollY)
            ? index
          : nearest,
        0,
      );
      const leavingStory = direction > 0 && current === targets.length - 1;
      const targetIndex = current + direction;

      if (targetIndex < 0) return;

      moveTo(leavingStory ? nextSectionTop : targets[targetIndex]);
    }

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || event.deltaY === 0) return;

      const direction = Math.sign(event.deltaY);
      const targets = stops.map(topOf);
      const nextSectionTop = topOf(nextSectionElement);
      const inStory = window.scrollY >= targets[0] - 1 && window.scrollY < nextSectionTop - 1;
      if (!inStory || (direction < 0 && window.scrollY <= targets[0])) return;

      event.preventDefault();
      if (transitioning) {
        queuedDirection = direction;
        return;
      }

      moveBy(direction);
    }

    function onScroll() {
      if (transitioning) {
        lastScrollY = window.scrollY;
        return;
      }
      const delta = window.scrollY - lastScrollY;
      if (delta) nativeDirection = Math.sign(delta);
      lastScrollY = window.scrollY;
      clearTimeout(nativeScrollTimer);
      nativeScrollTimer = setTimeout(onScrollEnd, 140);
    }

    function onScrollEnd() {
      if (!nativeDirection || transitioning) return;
      clearTimeout(nativeScrollTimer);
      const targets = stops.map(topOf);
      const nextSectionTop = topOf(nextSectionElement);
      if (
        [...targets, nextSectionTop].some((target) => Math.abs(target - window.scrollY) < 4)
      ) {
        nativeDirection = 0;
        return;
      }
      const direction = nativeDirection;
      nativeDirection = 0;
      moveBy(direction);
    }

    const onComplete = () => {
      transitioning = false;
      if (queuedDirection) {
        const direction = queuedDirection;
        queuedDirection = 0;
        moveBy(direction);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);

    return () => {
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
      clearTimeout(nativeScrollTimer);
      tween?.kill();
      root.style.scrollBehavior = previousScrollBehavior;
      root.style.scrollSnapType = previousScrollSnapType;
    };
  }, []);

  return null;
}
