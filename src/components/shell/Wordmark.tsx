import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** The Abhiyan's logo: the tree held in two hands. Decorative next to the name, which carries the meaning. */
export function Mark({ size = 44 }: { size?: number }) {
  return <Image data-mark src="/images/logo.png" alt="" width={size} height={size} className="shrink-0" priority={size <= 48} />;
}

export function Wordmark() {
  const t = useTranslations("brand");
  return (
    <Link href="/" className="flex items-center gap-3 min-[820px]:whitespace-nowrap">
      <Mark />
      <span className="flex flex-col leading-tight">
        <span className="text-xl">{t("name")}</span>
        <span className="font-sans text-sm text-ink-2">{t("place")}</span>
      </span>
    </Link>
  );
}
