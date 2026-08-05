import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { after, before, test } from "node:test";

let port;
let server;

async function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        reject(new Error("Could not reserve a local test port."));
        return;
      }
      probe.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

before(async () => {
  port = await getAvailablePort();
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
    cwd: new URL("..", import.meta.url),
    stdio: "ignore",
  });

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Next.js production server did not start within 30 seconds.");
});

after(() => {
  server?.kill();
});

async function render(path = "/", init) {
  return fetch(
    `http://127.0.0.1:${port}${path}`,
    {
      headers: { accept: "text/html" },
      ...init,
    },
  );
}

test("server-renders the Orriii course homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Orriii — Turn the map into a game/);
  assert.match(html, /Turn the map into a game\./);
  assert.match(html, /The adventure continues in your pocket\./);
  assert.match(html, /Turn your place into a playable route\./);
  assert.match(html, /SEA BREEZE \/ BAKU/);
  assert.match(html, /Download on the/);
  assert.match(html, /Renowa Labs/);
  assert.match(html, /href="\/contact"/);
});

test("server-renders the Orriii contact page and protected form", async () => {
  const response = await render("/contact");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Let(?:&#x27;|')s plan something worth going outside for\./);
  assert.match(html, /SECURED BY CLOUDFLARE/);
  assert.match(html, /Use the secure form on this page/);
  assert.match(html, /product by/);
  assert.match(html, /Send message/);
});

test("tailors the early-access contact funnel", async () => {
  const response = await render("/contact?interest=app-store");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Be first outside with Orriii\./);
  assert.match(html, /early access opportunities/);
  assert.match(html, /early adopters/);
});

test("contact API rejects invalid submissions before delivery", async () => {
  const response = await render("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "",
      email: "not-an-email",
      company: "",
      subject: "",
      message: "",
      website: "",
      turnstileToken: "",
    }),
  });

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.match(payload.message, /highlighted fields/i);
});

test("keeps the map as stable context and preserves contact safeguards", async () => {
  const [
    mapStory,
    mapConfig,
    page,
    css,
    contactForm,
    contactPage,
    contactRoute,
    contactMailer,
    turnstile,
    appStore,
    demoRoute,
  ] = await Promise.all([
    readFile(
      new URL("../components/map-story/MapStory.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../lib/map-config.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(
      new URL("../components/contact/ContactForm.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/contact/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/contact/route.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../lib/email/contact-mailer.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../lib/contact/turnstile.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/app-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../data/orriii-demo-route.ts", import.meta.url), "utf8"),
  ]);

  assert.equal((mapStory.match(/new mapboxgl\.Map\(/g) ?? []).length, 1);
  assert.match(mapStory, /interactive:\s*false/);
  assert.match(mapStory, /map\.fitBounds/);
  assert.match(mapStory, /Turn your place into a playable route/);
  assert.match(mapStory, /assets\/orriii-iphone-cutout\.png/);
  assert.match(css, /\.story-course\s*\{/);
  assert.match(mapStory, /ScrollTrigger/);
  assert.match(mapStory, /new mapboxgl\.Marker/);
  assert.match(mapStory, /orriii-route-active/);
  assert.match(mapStory, /line-dasharray/);
  assert.doesNotMatch(mapStory, /orriii-placement-rings|placementData|circleLine/);
  assert.match(mapStory, /upcoming:\s*chapterIndex === 3 \? \[\] : futurePathFromCheckpoint/);
  assert.match(mapStory, /NEW CHECKPOINT/);
  assert.match(mapStory, /OrriiiMapMascot/);
  assert.match(mapStory, /getPointAlongRoute/);
  assert.match(mapStory, /visualChapterRef/);
  assert.match(mapStory, /storyProgressRef/);
  assert.match(mapStory, /syncStoryToScroll/);
  assert.match(mapStory, /onUpdate:.*syncStoryRef/);
  assert.match(mapStory, /classList\.toggle\("story-snapping"/);
  assert.match(css, /scroll-snap-type:\s*y mandatory/);
  assert.match(css, /story-course__triggers > div[^}]*scroll-snap-align:\s*start/);
  assert.doesNotMatch(mapStory, /snapTo:|moveToAdjacentCheckpoint|ScrollToPlugin/);
  assert.match(mapStory, /map\.stop\(\)/);
  assert.match(mapStory, /OrriiiMascot/);
  assert.match(mapStory, /setLngLat/);
  assert.match(mapStory, /prefers-reduced-motion/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /\.chapter-module__icon svg\s*\{[^}]*fill:\s*none/);
  assert.match(css, /\.chapter-module--found > svg\s*\{[^}]*fill:\s*none/);
  assert.doesNotMatch(mapStory, /orriii-organizer-detour|chapter-module--alternate|chapter-module__path|chapter-module__alt-dot/);
  assert.doesNotMatch(css, /map-course-callout|checkpoint-token__label|chapter-module--alternate|chapter-module__path|chapter-module__alt-dot/);
  assert.doesNotMatch(
    mapStory,
    /navigator\.geolocation|getCurrentPosition|watchPosition/,
  );
  assert.match(mapConfig, /mapbox:\/\/styles\/mapbox\/standard/);
  assert.match(mapConfig, /MAPBOX_ACCESS_TOKEN/);
  assert.match(mapStory, /style:\s*MAPBOX_STYLE_URL/);
  assert.match(mapStory, /accessToken:\s*MAPBOX_ACCESS_TOKEN/);
  assert.match(mapStory, /mapbox-gl/);
  assert.match(mapStory, /SEA BREEZE \/ BAKU/);
  assert.match(mapStory, /chapterCheckpointIndices\s*=\s*\[0, 1, 2, 3, 4\]/);
  assert.doesNotMatch(mapStory, /PlacementMarker|placementMarkerRef|map-placement-marker/);
  assert.doesNotMatch(demoRoute, /number:\s*"04"/);
  assert.equal((demoRoute.match(/\{ id:\s*"(?:start|compass|camera|water|finish)",(?:\s*number:\s*"\d+",)?\s*kind:/g) ?? []).length, 5);
  assert.match(page, /<MapStory \/>/);
  assert.match(contactForm, /react-hook-form/);
  assert.match(contactForm, /toast\.success/);
  assert.match(contactForm, /TurnstileWidget/);
  assert.match(contactRoute, /consumeContactAttempt/);
  assert.match(contactRoute, /verifyTurnstileToken/);
  assert.match(contactMailer, /\[Orriii Contact\]/);
  assert.match(contactMailer, /info@renowa-labs\.com/);
  assert.match(turnstile, /challenges\.cloudflare\.com/);
  assert.doesNotMatch(
    `${mapStory}\n${contactForm}\n${contactPage}`,
    /mailto:/i,
  );
  assert.doesNotMatch(
    `${mapStory}\n${contactPage}`,
    /href=["']#["']|javascript:|https?:\/\/example\.com/i,
  );
  assert.match(mapStory, /storyChapters/);
  assert.match(appStore, /NEXT_PUBLIC_APP_STORE_URL/);
  assert.match(appStore, /url\.protocol === "https:"/);

  for (const [, value] of css.matchAll(/font-size:\s*([\d.]+)px/g)) {
    assert.ok(
      Number(value) >= 12,
      `Site text must stay at or above 12px; found ${value}px`,
    );
  }

  for (const [, value] of mapStory.matchAll(/"text-size":\s*([\d.]+)/g)) {
    assert.ok(
      Number(value) >= 12,
      `Custom map text must stay at or above 12px; found ${value}px`,
    );
  }
});
