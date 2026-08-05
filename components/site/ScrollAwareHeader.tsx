"use client";

import Link from "next/link";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { AppStoreButton } from "@/components/site/AppStoreButton";
import { OrriiiLogo } from "@/components/site/OrriiiLogo";

type NavItem = {
  label: string;
  href: string;
};

export function ScrollAwareHeader({
  navItems,
  ariaLabel = "Main navigation",
  className = "site-header",
  navClassName = "site-nav",
}: {
  navItems: NavItem[];
  ariaLabel?: string;
  className?: string;
  navClassName?: string;
}) {
  const progressRef = useRef<HTMLSpanElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0;
      progressRef.current?.style.setProperty("transform", `scaleX(${progress})`);
      setScrolled(window.scrollY > 18);
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function scrollToSection(event: MouseEvent<HTMLAnchorElement>, href: string) {
    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) return;

    const path = href.slice(0, hashIndex);
    const id = href.slice(hashIndex + 1);
    if (path && path !== window.location.pathname) return;

    const section = document.getElementById(id);
    if (!section) return;

    event.preventDefault();
    section.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    window.history.pushState(null, "", `#${id}`);
  }

  return (
    <header className={`${className} ${scrolled ? "site-header--scrolled" : ""}`.trim()}>
      <Link className="site-header__home" href="/" aria-label="Orriii home">
        <OrriiiLogo />
      </Link>
      <nav className={navClassName} aria-label={ariaLabel}>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={(event) => scrollToSection(event, item.href)}>
            {item.label}
          </Link>
        ))}
        <AppStoreButton className="header-cta" />
      </nav>
      <span ref={progressRef} className="site-header__progress" aria-hidden="true" />
    </header>
  );
}
