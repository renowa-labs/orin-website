import type { FeatureCollection, Point, Polygon } from "geojson";
import type {
  ControlStatus,
  Coordinate,
  StoryCheckpoint,
} from "../types/story";

export const storyCheckpoints: StoryCheckpoint[] = [
  {
    id: "start",
    chapterId: "start",
    mapLabel: "S",
    progressLabel: "HOW IT WORKS",
    label: "EXPLORE. NAVIGATE. CONNECT.",
    headline: "Orriii turns any place into an adventure.",
    body: "Orriii connects partner-published events with people who want to explore real places in a new way.",
    coordinates: [49.9322, 40.5805],
    kind: "start",
  },
  {
    id: "control-01",
    chapterId: "participants",
    mapLabel: "1",
    progressLabel: "PARTICIPANTS",
    label: "FOR PARTICIPANTS",
    headline: "Choose an event worth exploring.",
    body: "Browse published events, understand the distance and difficulty, and join when you are ready.",
    coordinates: [49.9352, 40.5826],
    kind: "control",
  },
  {
    id: "control-02",
    chapterId: "mobile-app",
    mapLabel: "2",
    progressLabel: "MOBILE APP",
    label: "THE ORRIII APP",
    headline: "Know where to go next.",
    body: "See the distance to the next checkpoint and track your progress while moving through the real world.",
    coordinates: [49.9383, 40.5794],
    kind: "control",
  },
  {
    id: "control-03",
    chapterId: "organizers",
    mapLabel: "3",
    progressLabel: "ORGANIZERS",
    label: "FOR ORGANIZERS",
    headline: "Publish an event for your place.",
    body: "Partners can create checkpoints around a park, resort, campus or community and publish an event for visitors.",
    coordinates: [49.935, 40.5766],
    kind: "control",
  },
  {
    id: "finish",
    chapterId: "finish",
    mapLabel: "F",
    progressLabel: "GET ORRIII",
    label: "FINISH / NEXT ADVENTURE",
    headline: "The finish is only the next beginning.",
    body: "Bring outdoor discovery, navigation and playful competition to the places people already love.",
    coordinates: [49.9316, 40.5778],
    kind: "finish",
  },
];

export const controlCoordinates: Coordinate[] = storyCheckpoints.map(
  (checkpoint) => checkpoint.coordinates,
);

export type ControlProperties = {
  id: string;
  chapterId: string;
  index: number;
  label: string;
  kind: StoryCheckpoint["kind"];
  status: ControlStatus;
};

export function createControlGeoJSON(
  activeChapterIndex: number,
): FeatureCollection<Point, ControlProperties> {
  return {
    type: "FeatureCollection",
    features: storyCheckpoints.map((checkpoint, index) => {
      const status: ControlStatus =
        index < activeChapterIndex
          ? "complete"
          : index === activeChapterIndex
            ? "active"
            : "future";

      return {
        type: "Feature",
        properties: {
          id: checkpoint.id,
          chapterId: checkpoint.chapterId,
          index,
          label: checkpoint.mapLabel,
          kind: checkpoint.kind,
          status,
        },
        geometry: {
          type: "Point",
          coordinates: checkpoint.coordinates,
        },
      };
    }),
  };
}

export const organizerDraftCoordinates: Coordinate[] = [
  [49.939, 40.581],
  [49.9304, 40.5757],
];

export const organizerDraftPointsGeoJSON: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: organizerDraftCoordinates.map((coordinates, index) => ({
    type: "Feature",
    properties: { label: `P${index + 1}` },
    geometry: { type: "Point", coordinates },
  })),
};

function circlePolygon(
  center: Coordinate,
  radiusMeters = 34,
  steps = 40,
): Coordinate[] {
  const [longitude, latitude] = center;
  const latitudeOffset = radiusMeters / 110_540;
  const longitudeOffset =
    radiusMeters / (111_320 * Math.cos((latitude * Math.PI) / 180));

  const coordinates: Coordinate[] = Array.from(
    { length: steps },
    (_, index) => {
      const angle = (index / steps) * Math.PI * 2;
      return [
        longitude + Math.cos(angle) * longitudeOffset,
        latitude + Math.sin(angle) * latitudeOffset,
      ];
    },
  );

  coordinates.push(coordinates[0]);
  return coordinates;
}

export const organizerDraftRingsGeoJSON: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: organizerDraftCoordinates.map((coordinates) => ({
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [circlePolygon(coordinates)],
    },
  })),
};
