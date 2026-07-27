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
    progressLabel: "WHAT IT IS",
    label: "ORIN / MOBILE ORIENTEERING",
    headline: "Turn any place into a course.",
    body: "Orin connects event organizers with people who want to navigate, explore and compete in the real world.",
    coordinates: [13.342, 52.5143],
    kind: "start",
  },
  {
    id: "control-01",
    chapterId: "participants",
    mapLabel: "1",
    progressLabel: "PARTICIPANTS",
    label: "FOR PARTICIPANTS",
    headline: "Find an event. Then go outside.",
    body: "Browse a nearby course, check its distance and difficulty, and continue in the Orin app when you are ready to start.",
    coordinates: [13.346, 52.516],
    kind: "control",
  },
  {
    id: "control-02",
    chapterId: "mobile-app",
    mapLabel: "2",
    progressLabel: "MOBILE APP",
    label: "THE MOBILE EXPERIENCE",
    headline: "Navigate to real control points.",
    body: "Orin shows the next control, your distance and your progress while you move through the real-world course.",
    coordinates: [13.3497, 52.5128],
    kind: "control",
  },
  {
    id: "control-03",
    chapterId: "organizers",
    mapLabel: "3",
    progressLabel: "ORGANIZERS",
    label: "FOR ORGANIZERS",
    headline: "Create an event anywhere.",
    body: "Choose a suitable location, place the controls and publish an experience for participants to complete in the real world.",
    coordinates: [13.3543, 52.5152],
    kind: "control",
  },
  {
    id: "finish",
    chapterId: "finish",
    mapLabel: "F",
    progressLabel: "GET ORIN",
    label: "FINISH / NEXT START",
    headline: "Start your next course with Orin.",
    body: "Discover events, navigate real controls and experience familiar places from a different direction.",
    coordinates: [13.3582, 52.5132],
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
  [13.3562, 52.5165],
  [13.3567, 52.5117],
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
