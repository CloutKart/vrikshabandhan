import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** The rakhi medallion as the mark. Same drawing as the scroll knot, at wordmark size. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg data-mark width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" className="shrink-0">
      <circle cx="14" cy="14" r="12" fill="var(--gold)" />
      <circle cx="14" cy="14" r="8" fill="var(--sutra)" />
      <circle cx="14" cy="14" r="3" fill="var(--paper)" />
      <g fill="var(--paper)">
        <circle cx="14" cy="3.8" r="1.2" />
        <circle cx="24.2" cy="14" r="1.2" />
        <circle cx="14" cy="24.2" r="1.2" />
        <circle cx="3.8" cy="14" r="1.2" />
      </g>
    </svg>
  );
}

export function Wordmark() {
  const t = useTranslations("brand");
  return (
    <Link href="/" className="flex items-center gap-3 whitespace-nowrap">
      <Mark />
      <span className="flex flex-col leading-tight">
        <span className="text-xl">{t("name")}</span>
        <span className="font-sans text-sm text-ink-2">{t("place")}</span>
      </span>
    </Link>
  );
}
