import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/", init) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
      ...init,
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Orin acquisition story", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Orin — Events That Get You Outside/);
  assert.match(html, /Make every place worth exploring\./);
  assert.match(html, /Events are played in the Orin mobile app, not in the browser\./);
  assert.match(html, /Find an event\. Then go outside\./);
  assert.match(html, /Partner with Orin to publish\./);
  assert.match(html, /For partner organisations/);
  assert.match(html, /MOBILE APP PREVIEW/);
  assert.match(html, /Coming soon/);
  assert.match(html, /Renowa Labs/);
  assert.match(html, /href="\/contact"/);
});

test("server-renders the Orin contact page and protected form", async () => {
  const response = await render("/contact");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Let(?:&#x27;|')s plan something worth going outside for\./);
  assert.match(html, /SECURED BY CLOUDFLARE/);
  assert.match(html, /Use the secure form on this page/);
  assert.match(html, /product by/);
  assert.match(html, /Send message/);
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

test("keeps the fixed map line-free, snapped and non-playable", async () => {
  const [
    mapStory,
    routeData,
    mapConfig,
    page,
    css,
    contactForm,
    contactPage,
    contactRoute,
    contactMailer,
    turnstile,
  ] = await Promise.all([
    readFile(
      new URL("../components/map-story/MapStory.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../data/demo-route.ts", import.meta.url), "utf8"),
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
  ]);

  assert.equal((mapStory.match(/new mapboxgl\.Map\(/g) ?? []).length, 1);
  assert.match(mapStory, /interactive:\s*false/);
  assert.match(mapStory, /scrollZoom:\s*false/);
  assert.match(mapStory, /touchPitch:\s*false/);
  assert.match(mapStory, /onEnterBack/);
  assert.match(mapStory, /placement="desktop"/);
  assert.match(mapStory, /placement="mobile"/);
  assert.match(css, /orin-iphone-product\.png/);
  assert.match(css, /\.story-chapter--app\s*\{[^}]*gap:/s);
  assert.match(
    css,
    /\.app-device-showcase\s*\{[^}]*border-radius:[^}]*overflow:\s*hidden/s,
  );
  assert.match(css, /scroll-snap-type:\s*y mandatory/);
  assert.match(css, /scroll-snap-stop:\s*always/);
  assert.doesNotMatch(
    mapStory,
    /navigator\.geolocation|getCurrentPosition|watchPosition/,
  );
  assert.doesNotMatch(
    mapStory,
    /flyTo|easeTo|jumpTo|panTo|NavigationControl|new mapboxgl\.Marker/,
  );
  assert.doesNotMatch(
    mapStory,
    /route-completed|route-current|route-base|reset-route/,
  );
  assert.match(mapConfig, /mapbox:\/\/styles\/mapbox\/standard/);
  assert.match(mapConfig, /MAPBOX_ACCESS_TOKEN/);
  assert.match(mapStory, /style:\s*MAPBOX_STYLE_URL/);
  assert.match(mapStory, /accessToken:\s*MAPBOX_ACCESS_TOKEN/);
  assert.match(mapStory, /mapbox-gl/);
  assert.match(mapStory, /createControlIcon/);
  assert.match(mapStory, /orin-control-markers/);
  assert.doesNotMatch(mapStory, /orin-collection-radius/);
  assert.match(mapStory, /Sea Breeze City Sprint/);
  assert.equal((routeData.match(/^    chapterId:/gm) ?? []).length, 5);
  assert.match(routeData, /createControlGeoJSON/);
  assert.match(page, /<MapStory \/>/);
  assert.match(contactForm, /react-hook-form/);
  assert.match(contactForm, /toast\.success/);
  assert.match(contactForm, /TurnstileWidget/);
  assert.match(contactRoute, /consumeContactAttempt/);
  assert.match(contactRoute, /verifyTurnstileToken/);
  assert.match(contactMailer, /\[Orin Contact\]/);
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
