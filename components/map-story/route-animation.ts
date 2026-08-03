import type { Coordinate } from "../../data/orriii-demo-route";

export function distanceBetween(a: Coordinate, b: Coordinate) {
  const dx = (b[0] - a[0]) * Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  const dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export function interpolateRoute(
  coordinates: Coordinate[],
  progress: number,
): { point: Coordinate; heading: number } {
  if (coordinates.length < 2) {
    return { point: coordinates[0] ?? [0, 0], heading: 0 };
  }

  const clamped = Math.max(0, Math.min(1, progress));
  const lengths = coordinates.slice(0, -1).map((coordinate, index) =>
    distanceBetween(coordinate, coordinates[index + 1]),
  );
  const total = lengths.reduce((sum, length) => sum + length, 0) || 1;
  let remaining = clamped * total;

  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index];
    if (remaining <= length || index === lengths.length - 1) {
      const ratio = length ? remaining / length : 0;
      const start = coordinates[index];
      const end = coordinates[index + 1];
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      return {
        point: [start[0] + dx * ratio, start[1] + dy * ratio],
        heading: Math.atan2(dx, dy) * (180 / Math.PI),
      };
    }
    remaining -= length;
  }

  return { point: coordinates[coordinates.length - 1], heading: 0 };
}

export function routeSliceAtProgress(
  coordinates: Coordinate[],
  progress: number,
): Coordinate[] {
  if (coordinates.length < 2) return coordinates;
  const clamped = Math.max(0, Math.min(1, progress));
  if (clamped <= 0) return [coordinates[0]];
  if (clamped >= 1) return coordinates;

  const lengths = coordinates.slice(0, -1).map((coordinate, index) =>
    distanceBetween(coordinate, coordinates[index + 1]),
  );
  const total = lengths.reduce((sum, length) => sum + length, 0) || 1;
  let remaining = clamped * total;
  const result = [coordinates[0]];

  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index];
    if (remaining <= length || index === lengths.length - 1) {
      const ratio = length ? remaining / length : 0;
      const start = coordinates[index];
      const end = coordinates[index + 1];
      result.push([
        start[0] + (end[0] - start[0]) * ratio,
        start[1] + (end[1] - start[1]) * ratio,
      ]);
      return result;
    }
    result.push(coordinates[index + 1]);
    remaining -= length;
  }

  return result;
}

export function flattenThroughCheckpoint(
  segments: Coordinate[][],
  checkpointIndex: number,
) {
  const result: Coordinate[] = [];
  segments.slice(0, checkpointIndex).forEach((segment, index) => {
    result.push(...(index === 0 ? segment : segment.slice(1)));
  });
  return result.length ? result : [segments[0][0]];
}
