import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Orriii — Turn the map into a game",
    short_name: "Orriii",
    description: "Orriii turns parks, resorts and neighbourhoods into real-world adventures.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8eb",
    theme_color: "#f16a0a",
    icons: [
      { src: "/brand/orin-app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/orin-app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
