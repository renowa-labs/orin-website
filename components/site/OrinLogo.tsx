import Image from "next/image";

export function OrinLogo() {
  return (
    <span className="orin-brand">
      <span className="orin-brand__mark" aria-hidden="true">
        <Image src="/brand/orin-app-icon-64.png" alt="" width={64} height={64} />
      </span>
      <span>Orin</span>
    </span>
  );
}
