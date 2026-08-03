export type MascotPose = "idle" | "running" | "celebrating" | "pointing";

export function OrriiiMascot({
  pose = "idle",
  className = "",
  title,
}: {
  pose?: MascotPose;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={`orriii-mascot orriii-mascot--${pose} ${className}`.trim()}
      role={title ? "img" : undefined}
      viewBox="0 0 116 132"
    >
      {title ? <title>{title}</title> : null}
      <ellipse className="mascot-shadow" cx="58" cy="124" rx="29" ry="5" />
      <path className="mascot-scarf" d="M30 50c-12 8-17 17-27 14 7 9 18 13 31 5" />
      <path className="mascot-scarf-tail" d="M21 58c-7 7-13 8-20 6" />
      <path className="mascot-hair" d="M33 35c-1-16 10-26 25-26 12 0 21 8 22 19-3-4-7-6-11-5-5 1-7 5-13 4-7-1-10 5-12 10Z" />
      <circle className="mascot-face" cx="58" cy="38" r="18" />
      <path className="mascot-fringe" d="M42 32c6 5 11 1 15-4 5 5 11 5 17 1" />
      <circle className="mascot-eye" cx="52" cy="38" r="2" />
      <circle className="mascot-eye" cx="64" cy="38" r="2" />
      <path className="mascot-smile" d="M54 45c3 3 7 3 10 0" />
      <path className="mascot-neck" d="M52 53h12v8H52z" />
      <path className="mascot-body" d="M42 57c8 3 23 3 31 0l5 33c-11 7-30 7-41 0Z" />
      <path className="mascot-arm mascot-arm--left" d="M43 63c-8 6-13 14-17 23-2 5 5 9 9 5 5-5 7-12 13-17" />
      <path className="mascot-arm mascot-arm--right" d="M73 63c8 2 12 7 17 13 4 5 11 1 9-4-4-10-12-16-23-19" />
      <path className="mascot-heart" d="M94 69c-4-7-13-1-8 5 5 6 8 8 8 8s3-2 8-8c5-6-4-12-8-5Z" />
      <path className="mascot-leg mascot-leg--left" d="M45 88c-1 10-7 17-16 23-5 4-1 11 5 9 13-4 22-13 25-26" />
      <path className="mascot-leg mascot-leg--right" d="M67 89c6 9 13 15 24 18 6 2 9-6 4-9-9-6-14-12-16-21" />
      <path className="mascot-shoe" d="M29 108c-7 1-13 5-14 11 7 4 16 1 24-4l-1-7Z" />
      <path className="mascot-shoe" d="M91 105c7 1 14 4 17 9-4 6-15 5-23 0l-1-7Z" />
      <path className="mascot-compass" d="m28 19 4 5 6-1-4 5 2 6-6-3-5 4 1-6-4-5 6 1Z" />
      <path className="mascot-celebrate mascot-celebrate--left" d="m17 29-8-6m10 0-2-9" />
      <path className="mascot-celebrate mascot-celebrate--right" d="m91 28 8-7m-6 1 2-9" />
      <path className="mascot-point" d="M94 65h18m-5-5 5 5-5 5" />
    </svg>
  );
}
