export type Coordinate = [number, number];

export type StoryChapterId =
  | "start"
  | "participants"
  | "mobile-app"
  | "organizers"
  | "finish";

export type ControlKind = "start" | "control" | "finish";
export type ControlStatus = "future" | "active" | "complete";

export type StoryCheckpoint = {
  id: string;
  chapterId: StoryChapterId;
  mapLabel: string;
  progressLabel: string;
  label: string;
  headline: string;
  body: string;
  coordinates: Coordinate;
  kind: ControlKind;
};
