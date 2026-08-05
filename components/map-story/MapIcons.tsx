type IconProps = { className?: string };

export function StartGate({ className = "" }: IconProps) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 64 64"><path d="M16 52V25c0-7 7-13 16-13s16 6 16 13v27M11 52h42M22 52V30c0-4 4-7 10-7s10 3 10 7v22" /><path className="icon-fill-orange" d="m30 18 11 4-11 4Z" /></svg>;
}

export function CompassIcon({ className = "" }: IconProps) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 64 64"><path className="icon-fill-yellow" d="m32 10 5 17 17 5-17 5-5 17-5-17-17-5 17-5Z" /><path d="m39 25-5 14-9 3 5-13Z" /><path className="icon-fill-orange" d="m39 25-5 14-4-9Z" /><circle cx="32" cy="32" r="22" /></svg>;
}

export function CameraIcon({ className = "" }: IconProps) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 64 64"><path className="icon-fill-blue" d="M14 22h10l4-6h8l4 6h10c3 0 5 2 5 5v20c0 3-2 5-5 5H14c-3 0-5-2-5-5V27c0-3 2-5 5-5Z" /><path d="M32 28a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm14-2h.1" /></svg>;
}

export function WaterIcon({ className = "" }: IconProps) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 64 64"><path className="icon-fill-yellow" d="M46 18a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path className="icon-fill-blue" d="M7 39c8-8 15 8 23 0s15 8 27 0v12H7Z" /><path d="M9 34c8-8 15 8 23 0s15 8 23 0M18 15c-1-4 2-7 5-8" /></svg>;
}

export function DiscoveryIcon({ className = "" }: IconProps) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 64 64"><path className="icon-fill-yellow" d="m32 9 6 15 17 2-13 11 4 17-14-9-14 9 4-17L9 26l17-2Z" /><path d="M32 9v15m17 2H37m9 28-14-9m-14 9 4-17" /></svg>;
}

export function FinishFlag({ className = "" }: IconProps) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 64 64"><path d="M19 55V9m0 2h30l-8 10 8 10H19" /><path className="icon-fill-orange" d="M22 14h23l-5 7 5 7H22Z" /><path className="icon-fill-yellow" d="M22 14h11v7H22Zm11 14h12l-5 7H33Z" /></svg>;
}

export function CollectedStamp({ className = "" }: IconProps) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 28 28"><circle cx="14" cy="14" r="11" /><path d="m8 14 4 4 8-9" /></svg>;
}

export function LocationArrow({ className = "" }: IconProps) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 32 32"><path className="icon-fill-orange" d="m16 3 8 23-8-5-8 5Z" /><path d="M16 3v18" /></svg>;
}

export function PartnerIcon({ className = "" }: IconProps) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 64 64"><path className="icon-fill-blue" d="M10 27 32 11l22 16v26H10Z" /><path d="M8 27h48M18 53V33h28v20M26 53V42h12v11M24 23h16" /></svg>;
}

export function OrganizerFlag({ className = "" }: IconProps) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 64 64"><path d="M18 55V10m0 2h29L39 23l8 11H18" /><path className="icon-fill-yellow" d="M22 16h20l-5 7 5 7H22Z" /><path className="icon-fill-orange" d="M15 55h7l-4-8Z" /></svg>;
}

export function TopoPattern({ className = "" }: IconProps) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 520 330" preserveAspectRatio="none"><path d="M-20 80c73-70 113 53 188-9s130-49 190 4 112 40 187-18M-35 131c82-69 122 59 195-2s128-44 188 7 109 38 185-19M-25 187c71-55 113 43 183-7s125-36 181 10 106 35 185-13M-15 242c67-48 106 38 172-5s118-32 174 11 105 29 179-10M-28 291c65-41 105 33 168-4s111-27 165 10 101 26 176-9" /></svg>;
}

export function IconForKind({ kind, className = "" }: { kind: "start" | "compass" | "camera" | "water" | "discovery" | "finish"; className?: string }) {
  if (kind === "start") return <StartGate className={className} />;
  if (kind === "compass") return <CompassIcon className={className} />;
  if (kind === "camera") return <CameraIcon className={className} />;
  if (kind === "water") return <WaterIcon className={className} />;
  if (kind === "discovery") return <DiscoveryIcon className={className} />;
  return <FinishFlag className={className} />;
}
