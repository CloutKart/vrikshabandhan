import Image from "next/image";
import type { CSSProperties } from "react";

type Crop = "knot" | "canopy" | "trunk";
type Ratio = "4/5" | "4/3" | "16/9" | "3/1" | "1/1";

const POSITION: Record<Crop, string> = { knot: "82% 82%", canopy: "24% 32%", trunk: "80% 62%" };
const RATIO: Record<Ratio, string> = { "4/5": "4 / 5", "4/3": "4 / 3", "16/9": "16 / 9", "3/1": "3 / 1", "1/1": "1 / 1" };

/**
 * A detail of the painting, cropped by CSS alone. The site has no event
 * photographs yet; the painting's knot, canopy and trunk are its imagery.
 * The box keeps `ratio` from 820 px up and `phoneRatio` (default: the same)
 * below it, so a tall panel on desktop can be a short band on a phone.
 */
export function PaintingDetail({
  crop,
  ratio = "4/5",
  phoneRatio = ratio,
  zoom = 1,
  alt,
  sizes = "(min-width: 1024px) 40vw, 100vw",
  className = "",
}: {
  crop: Crop;
  ratio?: Ratio;
  phoneRatio?: Ratio;
  /** Magnification about the crop point, so a wide box can still show a detail. */
  zoom?: number;
  alt: string;
  sizes?: string;
  className?: string;
}) {
  return (
    <div
      data-painting-detail={crop}
      data-reveal="mask"
      className={`painting-detail relative overflow-hidden rounded-[var(--radius-panel)] bg-stone ${className}`}
      style={{ "--ratio": RATIO[ratio], "--ratio-phone": RATIO[phoneRatio] } as CSSProperties}
    >
      {(["dark", "light"] as const).map((variant) => (
        <Image
          key={variant}
          src={variant === "dark" ? "/images/tree-painting.jpg" : "/images/tree-painting-light.jpg"}
          alt={alt}
          fill
          sizes={sizes}
          quality={62}
          loading="lazy"
          className="object-cover"
          data-variant={variant}
          style={{ objectPosition: POSITION[crop], transformOrigin: POSITION[crop], transform: zoom === 1 ? undefined : `scale(${zoom})` }}
        />
      ))}
    </div>
  );
}
