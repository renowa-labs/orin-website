"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      appearance: "interaction-only";
      theme: "light";
      size: "flexible";
      retry: "auto" | "never";
      "response-field": false;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ): string;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = "orriii-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function TurnstileWidget({
  siteKey,
  resetKey,
  onToken,
  onError,
}: {
  siteKey: string;
  resetKey: number;
  onToken: (token: string) => void;
  onError: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let widgetId: string | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    function renderWidget() {
      if (disposed || widgetId || !containerRef.current) return;

      if (!window.turnstile) {
        retryTimer = setTimeout(renderWidget, 80);
        return;
      }

      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action: "contact_form",
        appearance: "interaction-only",
        theme: "light",
        size: "flexible",
        retry: process.env.NODE_ENV === "production" ? "auto" : "never",
        "response-field": false,
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": onError,
      });
    }

    const existingScript = document.getElementById(
      SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (window.turnstile) {
      renderWidget();
    } else if (existingScript) {
      existingScript.addEventListener("load", renderWidget, { once: true });
      retryTimer = setTimeout(renderWidget, 80);
    } else {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderWidget, { once: true });
      script.addEventListener("error", onError, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [onError, onToken, resetKey, siteKey]);

  return <div className="contact-turnstile" ref={containerRef} />;
}
