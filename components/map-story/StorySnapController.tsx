"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STEP_DURATION = 0.55;
const WHEEL_GESTURE_IDLE_MS = 140;
const WHEEL_GESTURE_ACCELERATION = 1.5;
const WHEEL_ACCELERATION_FLOOR = 4;
const WHEEL_MIN_DELTA = 2;
const SNAP_EPSILON = 4;

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
    let wheelGestureConsumed = false;
    let lastWheelAt = 0;
    let lastWheelMagnitude = 0;
    let lastWheelDirection = 0;
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

    function wheelDeltaInPixels(event: WheelEvent) {
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
      if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
      return event.deltaY;
    }

    function syncScrollPosition(target: number) {
      window.scrollTo(0, target);
      ScrollTrigger.update();
    }

    function moveTo(target: number) {
      nativeDirection = 0;
      scroll.y = window.scrollY;

      if (prefersReducedMotion) {
        syncScrollPosition(target);
        lastScrollY = target;
        return;
      }

      transitioning = true;
      tween = gsap.to(scroll, {
        y: target,
        duration: STEP_DURATION,
        ease: "power3.inOut",
        overwrite: true,
        onUpdate: () => syncScrollPosition(scroll.y),
        onComplete: () => {
          syncScrollPosition(target);
          lastScrollY = target;
          transitioning = false;
        },
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

    function recordWheel(direction: number, magnitude: number) {
      const now = performance.now();
      const idle = lastWheelAt === 0 || now - lastWheelAt > WHEEL_GESTURE_IDLE_MS;
      const reversed = lastWheelDirection !== 0 && direction !== lastWheelDirection;
      const accelerated =
        lastWheelMagnitude > 0 &&
        magnitude >= Math.max(WHEEL_ACCELERATION_FLOOR, lastWheelMagnitude * WHEEL_GESTURE_ACCELERATION);

      lastWheelAt = now;
      lastWheelMagnitude = magnitude;
      lastWheelDirection = direction;

      if (idle || reversed || accelerated) wheelGestureConsumed = false;
    }

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || event.deltaY === 0) return;

      const deltaY = wheelDeltaInPixels(event);
      const direction = Math.sign(deltaY);
      const magnitude = Math.abs(deltaY);
      const targets = stops.map(topOf);
      const nextSectionTop = topOf(nextSectionElement);
      const firstTarget = targets[0];
      const lastTarget = targets[targets.length - 1];
      const inStory = window.scrollY >= firstTarget - 1 && window.scrollY < nextSectionTop - 1;
      const crossingBackIntoStory =
        direction < 0 &&
        window.scrollY >= nextSectionTop - 1 &&
        window.scrollY + deltaY < nextSectionTop - 1;

      // Catch the exact wheel event that would cross from the app section back
      // into the story. Without this, native trackpad momentum can overshoot the
      // final story stop before the controller starts intercepting input, which
      // makes reverse entry look laggy and can skip a chapter.
      if (crossingBackIntoStory) {
        event.preventDefault();
        recordWheel(direction, magnitude);
        wheelGestureConsumed = true;
        if (!transitioning) moveTo(lastTarget);
        return;
      }

      if (!inStory) {
        wheelGestureConsumed = false;
        return;
      }

      if (direction < 0 && window.scrollY <= firstTarget) {
        wheelGestureConsumed = false;
        return;
      }

      event.preventDefault();
      recordWheel(direction, magnitude);

      // Momentum from the gesture that started the current transition is always
      // consumed. Do not let those events re-arm the next chapter while moving.
      if (transitioning) return;

      if (wheelGestureConsumed || magnitude < WHEEL_MIN_DELTA) return;

      wheelGestureConsumed = true;
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
      const allTargets = [...targets, nextSectionTop];
      const currentY = window.scrollY;
      const direction = nativeDirection;
      nativeDirection = 0;

      if (currentY < targets[0] - SNAP_EPSILON || currentY > nextSectionTop + SNAP_EPSILON) return;
      if (allTargets.some((target) => Math.abs(target - currentY) < SNAP_EPSILON)) return;

      // Native scrolling can still happen when entering from outside the story,
      // dragging the scrollbar, or using keyboard/touch input. Snap to the next
      // stop in the direction already travelled instead of calling moveBy(),
      // which would add another chapter and cause the reverse-entry double step.
      if (direction > 0) {
        const target = allTargets.find((candidate) => candidate > currentY + SNAP_EPSILON);
        if (target !== undefined) moveTo(target);
        return;
      }

      const previousTargets = targets.filter((candidate) => candidate < currentY - SNAP_EPSILON);
      const target = previousTargets[previousTargets.length - 1];
      if (target !== undefined) moveTo(target);
    }

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
