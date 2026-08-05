export function GeometricShapes({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`geometric-shapes ${className}`.trim()}
      viewBox="0 0 540 420"
      fill="none"
    >
      <circle cx="386" cy="204" r="128" />
      <circle cx="386" cy="204" r="86" />
      <rect x="122" y="75" width="116" height="116" rx="18" transform="rotate(23 122 75)" />
      <path d="M268 333 356 78l94 252-182 3Z" />
      <path d="m105 296 49-54 50 54-50 54-49-54Z" />
      <path d="M48 354h446M74 377h294" />
      <circle cx="474" cy="78" r="7" />
      <circle cx="112" cy="115" r="5" />
    </svg>
  );
}
