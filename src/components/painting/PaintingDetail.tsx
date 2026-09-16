import Image from "next/image";

type Crop = "knot" | "canopy" | "trunk";
type Ratio = "4/5" | "4/3" | "16/9" | "3/1" | "1/1";

const POSITION: Record<Crop, string> = { knot: "74% 86%", canopy: "22% 28%", trunk: "80% 58%" };
const RATIO: Record<Ratio, string> = { "4/5": "4 / 5", "4/3": "4 / 3", "16/9": "16 / 9", "3/1": "3 / 1", "1/1": "1 / 1" };

/**
 * A detail of the painting, cropped by CSS alone. The site has no event
 * photographs yet; the painting's knot, canopy and trunk are its imagery.
 */
export function PaintingDetail({
  crop,
  ratio = "4/5",
  alt,
  sizes = "(min-width: 1024px) 40vw, 100vw",
  className = "",
}: {
  crop: Crop;
  ratio?: Ratio;
  alt: string;
  sizes?: string;
  className?: string;
}) {
  return (
    <div
      data-painting-detail={crop}
      data-reveal="mask"
      className={`relative overflow-hidden rounded-[var(--radius-panel)] bg-stone ${className}`}
      style={{ aspectRatio: RATIO[ratio] }}
    >
      <Image
        src="/images/tree-painting.jpg"
        alt={alt}
        fill
        sizes={sizes}
        quality={62}
        className="object-cover"
        style={{ objectPosition: POSITION[crop] }}
      />
    </div>
  );
}
