export type Coordinate = [number, number];
export type CheckpointKind = "start" | "compass" | "camera" | "water" | "discovery" | "finish";

export type DemoCheckpoint = {
  id: string;
  number?: string;
  kind: CheckpointKind;
  name: string;
  callout: string;
  coordinates: Coordinate;
};

export type StoryChapter = {
  id: string;
  label: string;
  title: string;
  body: string;
  callout: string;
  count: string;
};

export const storyChapters: StoryChapter[] = [
  {
    id: "start",
    label: "01 / READY?",
    title: "Turn the map into a game.",
    body: "Pick an adventure, follow the route and collect every checkpoint along the way.",
    callout: "READY TO EXPLORE",
    count: "4 stops ahead",
  },
  {
    id: "discover",
    label: "02 / FIRST STOP",
    title: "Every checkpoint has a surprise.",
    body: "A viewpoint, a challenge, a hidden corner or simply a reason to explore somewhere new.",
    callout: "COMPASS FOUND",
    count: "1 of 3 collected",
  },
  {
    id: "play",
    label: "03 / KEEP MOVING",
    title: "Your next stop is already waiting.",
    body: "See the distance ahead, follow your progress and keep moving through the real world.",
    callout: "PHOTO STOP",
    count: "2 of 3 collected",
  },
  {
    id: "explore",
    label: "04 / NEW DIRECTION",
    title: "No two routes need to feel the same.",
    body: "Beaches, parks, campuses and resorts can each become a completely different Orriii adventure.",
    callout: "WATERFRONT FOUND",
    count: "3 of 3 collected",
  },
  {
    id: "finish",
    label: "05 / YOU MADE IT",
    title: "Finish one. Start another.",
    body: "Complete the route, share the result and find your next Orriii adventure.",
    callout: "ROUTE COMPLETE",
    count: "3 checkpoints collected",
  },
];

export const demoCheckpoints: DemoCheckpoint[] = [
  { id: "start", kind: "start", name: "Start gate", callout: "START HERE", coordinates: [49.932, 40.5809] },
  { id: "compass", number: "01", kind: "compass", name: "Compass point", callout: "COMPASS FOUND", coordinates: [49.935, 40.5824] },
  { id: "camera", number: "02", kind: "camera", name: "Photo stop", callout: "PHOTO STOP", coordinates: [49.9362, 40.5811] },
  { id: "water", number: "03", kind: "water", name: "Waterfront", callout: "WATERFRONT FOUND", coordinates: [49.9376, 40.5796] },
  { id: "finish", kind: "finish", name: "Finish flag", callout: "ROUTE COMPLETE", coordinates: [49.934, 40.5768] },
];

export const routeSegments: Coordinate[][] = [
  [
    demoCheckpoints[0].coordinates,
    [49.9325, 40.5811],
    [49.9331, 40.5817],
    [49.934, 40.5822],
    demoCheckpoints[1].coordinates,
  ],
  [
    demoCheckpoints[1].coordinates,
    [49.9356, 40.5821],
    [49.936, 40.5817],
    demoCheckpoints[2].coordinates,
  ],
  [
    demoCheckpoints[2].coordinates,
    [49.9368, 40.5808],
    [49.9373, 40.5802],
    demoCheckpoints[3].coordinates,
  ],
  [
    demoCheckpoints[3].coordinates,
    [49.9374, 40.579],
    [49.9369, 40.5783],
    [49.9362, 40.5777],
    [49.9357, 40.5773],
    [49.9348, 40.5769],
    demoCheckpoints[4].coordinates,
  ],
];

export const fullRouteCoordinates = routeSegments.flatMap((segment, index) =>
  index === 0 ? segment : segment.slice(1),
);
