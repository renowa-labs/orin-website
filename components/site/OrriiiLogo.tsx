import Image from "next/image";

export function OrriiiLogo({ full = false }: { full?: boolean }) {
  if (full) {
    return (
      <span className="orriii-logo orriii-logo--full" aria-label="Orriii">
        <Image
          src="/assets/orriii-brand.png"
          alt="Orriii runner and compass brand artwork"
          width={520}
          height={520}
        />
      </span>
    );
  }

  return (
    <span className="orriii-logo" aria-label="Orriii">
      <span className="orriii-logo__mark" aria-hidden="true">
        <Image
          src="/assets/orriii-brand.png"
          alt=""
          width={520}
          height={520}
        />
      </span>
      <span className="orriii-logo__wordmark">Orriii</span>
    </span>
  );
}
