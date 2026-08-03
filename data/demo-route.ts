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
    label: "ORIN / MOBILE ORIENTEERING",
    headline: "Make every place worth exploring.",
    body: "Orin connects partner organisations with people who want to navigate, explore and compete in the real world.",
    coordinates: [49.9322, 40.5805],
    kind: "start",
  },
  {
    id: "control-01",
    chapterId: "participants",
    mapLabel: "1",
    progressLabel: "PARTICIPANTS",
    label: "FOR PARTICIPANTS",
    headline: "Find an event. Then go outside.",
    body: "Browse a nearby event, check the distance and difficulty, and continue in the Orin app when you are ready to start.",
    coordinates: [49.9352, 40.5826],
    kind: "control",
  },
  {
    id: "control-02",
    chapterId: "mobile-app",
    mapLabel: "2",
    progressLabel: "MOBILE APP",
    label: "THE MOBILE EXPERIENCE",
    headline: "Navigate to real control points.",
    body: "Orin shows the next control, your distance and your progress while you move through the event.",
    coordinates: [49.9383, 40.5794],
    kind: "control",
  },
  {
    id: "control-03",
    chapterId: "organizers",
    mapLabel: "3",
    progressLabel: "PARTNERS",
    label: "FOR PARTNER ORGANISATIONS",
    headline: "Partner with Orin to publish.",
    body: "Orin events are created with partner organisations. Choose a place, shape the experience and invite people to explore it in the real world.",
    coordinates: [49.935, 40.5766],
    kind: "control",
  },
  {
    id: "finish",
    chapterId: "finish",
    mapLabel: "F",
    progressLabel: "GET ORIN",
    label: "FINISH / NEXT START",
    headline: "Find your next reason to go outside.",
    body: "Discover partner-led events, navigate real controls and experience familiar places from a different direction.",
    coordinates: [49.9316, 40.5778],
    kind: "finish",
  },
];

export const controlCoordinates: Coordinate[] = storyCheckpoints.map(
  (checkpoint) => checkpoint.coordinates,
);

type ControlProperties = {
  id: string;
  chapterId: string;
  index: number;
  label: string;
  kind: StoryCheckpoint["kind"];
  status: ControlStatus;
  icon: string;
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
          icon: `${checkpoint.kind}-${status}`,
        },
        geometry: {
          type: "Point",
          coordinates: checkpoint.coordinates,
        },
      };
    }),
  };
}

export const collectionRadiusGeoJSON: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: storyCheckpoints[2].coordinates,
      },
    },
  ],
};

export const organizerDraftCoordinates: Coordinate[] = [
  [49.939, 40.581],
  [49.9304, 40.5757],
];

export const organizerDraftPointsGeoJSON: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: organizerDraftCoordinates.map((coordinates, index) => ({
    type: "Feature",
    properties: { label: `D${index + 1}` },
    geometry: { type: "Point", coordinates },
  })),
};

function circlePolygon(
  center: Coordinate,
  radiusMeters = 32,
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
