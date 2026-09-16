import type { Locale } from "@/i18n/routing";

type Props = {
  as?: "h1" | "h2" | "h3";
  primary: string;
  primaryLang: Locale;
  secondary?: string;
  secondaryLang?: Locale;
  className?: string;
  secondaryClassName?: string;
};

/**
 * A heading that speaks both languages: the page's locale first, the other
 * beneath at a smaller size. Each line carries its own lang so screen readers
 * switch voice. The pair is one heading element, so the outline stays clean.
 */
export function BilingualHeading({
  as: Tag = "h2",
  primary,
  primaryLang,
  secondary,
  secondaryLang,
  className = "",
  secondaryClassName = "",
}: Props) {
  return (
    <Tag className={className}>
      <span lang={primaryLang} className="block text-balance">
        {primary}
      </span>
      {secondary && secondaryLang ? (
        <span lang={secondaryLang} className={`block text-balance text-[0.55em] ${secondaryClassName}`}>
          {secondary}
        </span>
      ) : null}
    </Tag>
  );
}
