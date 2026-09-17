import Image from "next/image";
import type { CSSProperties } from "react";

type Ratio = "4/5" | "4/3" | "16/9" | "3/2" | "1/1";
const RATIO: Record<Ratio, string> = { "4/5": "4 / 5", "4/3": "4 / 3", "16/9": "16 / 9", "3/2": "3 / 2", "1/1": "1 / 1" };

/**
 * A field photograph in a rounded panel that reveals once it is in view.
 * One ratio from 820 px up and, optionally, a shorter one on phones.
 */
export function PhotoPanel({
  name,
  src,
  alt,
  ratio = "4/5",
  phoneRatio = ratio,
  position = "50% 50%",
  sizes = "(min-width: 1024px) 40vw, 100vw",
  quality = 70,
  className = "",
}: {
  name: string;
  src: string;
  alt: string;
  ratio?: Ratio;
  phoneRatio?: Ratio;
  position?: string;
  sizes?: string;
  quality?: number;
  className?: string;
}) {
  return (
    <div
      data-photo={name}
      data-reveal="mask"
      className={`painting-detail relative overflow-hidden rounded-[var(--radius-panel)] bg-stone ${className}`}
      style={{ "--ratio": RATIO[ratio], "--ratio-phone": RATIO[phoneRatio] } as CSSProperties}
    >
      <Image src={src} alt={alt} fill sizes={sizes} quality={quality} className="object-cover" style={{ objectPosition: position }} />
    </div>
  );
}
