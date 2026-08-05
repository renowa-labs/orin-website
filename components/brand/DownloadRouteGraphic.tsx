export function DownloadRouteGraphic() {
  return (
    <svg
      aria-hidden="true"
      className="download-route-graphic"
      viewBox="0 0 680 620"
      fill="none"
    >
      <defs>
        <pattern id="download-route-grid" width="42" height="42" patternUnits="userSpaceOnUse">
          <path d="M42 0H0V42" stroke="currentColor" strokeOpacity="0.14" />
        </pattern>
      </defs>
      <rect width="680" height="620" fill="url(#download-route-grid)" />
      <g className="download-route-graphic__contours">
        <path d="M-40 500C65 444 105 554 218 490S371 314 496 387s126 123 251 41" />
        <path d="M-54 550C55 487 118 596 238 527s149-192 276-116 130 109 241 46" />
        <path d="M-18 447c112-45 165 49 271-14s129-149 240-96 128 104 216 45" />
      </g>
      <path
        className="download-route-graphic__route"
        d="M66 506C134 462 140 404 202 387c66-18 63 60 126 39 76-26 58-117 131-134 57-13 79 36 146 5"
      />
      <g className="download-route-graphic__checkpoint" transform="translate(66 506)">
        <circle r="17" />
        <path d="M-5 8V-7h10V8M-8-7h16M-3-12h6" />
      </g>
      <g className="download-route-graphic__checkpoint" transform="translate(328 426)">
        <circle r="17" />
        <path d="M-5 8V-7h10V8M-8-7h16M-3-12h6" />
      </g>
      <g className="download-route-graphic__checkpoint" transform="translate(605 297)">
        <circle r="17" />
        <path d="M-5 8V-7h10V8M-8-7h16M-3-12h6" />
      </g>
      <g className="download-route-graphic__compass" transform="translate(516 122)">
        <circle r="52" />
        <circle r="43" />
        <path d="m0-32 9 32-9 32-9-32 9-32Z" />
        <path d="m-32 0 32-9 32 9-32 9-32-9Z" />
        <path d="M0-68v16M0 52v16M-68 0h16M52 0h16" />
      </g>
    </svg>
  );
}
