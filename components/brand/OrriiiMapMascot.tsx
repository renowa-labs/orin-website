export type MapMascotPose = "idle" | "running" | "celebrating";

export function OrriiiMapMascot({ pose = "idle" }: { pose?: MapMascotPose }) {
  return (
    <svg
      aria-hidden="true"
      className={`orriii-map-mascot orriii-map-mascot--${pose}`}
      viewBox="0 0 100 112"
    >
      <ellipse className="map-mascot__shadow" cx="52" cy="107" rx="30" ry="3.5" />

      <g className="map-mascot__scarf-tails">
        <path d="M45 37C32 29 25 40 8 33c2 5 0 9-1 13 13 7 25-5 39-3Z" />
        <path d="M44 41C31 39 23 51 8 46c8 9 21 8 38 1Z" />
      </g>

      <path className="map-mascot__leg map-mascot__leg--back" d="M49 73c-2 8-6 15-11 19-5 4-11 1-17 0l-4 10c12 4 23 5 31-3 6-6 10-14 12-22Z" />
      <path className="map-mascot__shoe map-mascot__shoe--back" d="M21 91c-5-1-9 1-11 7l-2 8c-1 4 5 6 8 3l8-12Z" />
      <path className="map-mascot__leg map-mascot__leg--front" d="M56 73c9 6 15 13 21 25l-10 4c-7-11-14-17-25-21Z" />
      <path className="map-mascot__shoe map-mascot__shoe--front" d="M67 99l10-4 5 6c6-2 12-1 14 2-4 6-12 7-21 8Z" />

      <path className="map-mascot__arm map-mascot__arm--back" d="M44 48c-7 0-12 5-16 12l-6 12 9 4 7-12c3-5 5-7 10-8Z" />
      <path className="map-mascot__hand map-mascot__hand--back" d="M24 69c-5-1-8 2-8 7 0 4 3 7 7 7 5 0 8-4 8-9Z" />

      <path className="map-mascot__body" d="M43 44c6 3 15 4 21 1l3 29c-7 4-18 4-28 0Z" />

      <g className="map-mascot__arm-front">
        <path className="map-mascot__arm map-mascot__arm--front" d="M63 48c5 7 10 8 16 3l7-7 7 7-9 11c-9 9-20 6-27-3Z" />
        <path className="map-mascot__hand map-mascot__hand--front" d="M84 44c0-5 5-7 8-3 3-4 8-2 8 3 0 4-4 7-9 11l-9-8Z" />
      </g>

      <path className="map-mascot__collar" d="M42 38c6 7 17 9 25 2l1 7c-7 8-20 7-28-1Z" />
      <path className="map-mascot__head" d="M40 22C40 11 48 5 59 7c10 2 15 11 13 22-2 10-9 16-18 14-7-1-12-6-14-12-6 1-8-7-3-9Z" />
      <path className="map-mascot__hair" d="M39 23c-3-5-1-10 5-12 2-5 8-6 12-4 4-6 9-3 10 2 5-3 9 2 6 7 5 2 3 8-2 10-4-6-7-8-13-7-6 2-9 6-13 4Z" />
      <circle className="map-mascot__eye" cx="58" cy="25" r="1.8" />
      <circle className="map-mascot__eye" cx="68" cy="23" r="1.8" />
      <path className="map-mascot__smile" d="M59 32c4 5 9 4 12-1" />
    </svg>
  );
}
