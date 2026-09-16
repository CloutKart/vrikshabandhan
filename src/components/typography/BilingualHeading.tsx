import type { CSSProperties } from "react";
import type { Locale } from "@/i18n/routing";

type Props = {
  as?: "h1" | "h2" | "h3";
  primary: string;
  primaryLang: Locale;
  secondary?: string;
  secondaryLang?: Locale;
  className?: string;
  secondaryClassName?: string;
  /** "hero": the home hero owns this heading's entrance. "title": arrives as words on page load. */
  reveal?: "hero" | "title";
  /** The second-language line rises into place once it is in view. */
  riseSecondary?: boolean;
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
  reveal,
  riseSecondary = false,
}: Props) {
  const tagAttrs = reveal === "hero" ? { "data-hero-title": "" } : {};
  const primaryAttrs = reveal === "title" ? { "data-title-reveal": "" } : {};
  const secondaryAttrs = riseSecondary ? { "data-reveal": "rise", style: { "--i": 1.5 } as CSSProperties } : {};
  return (
    <Tag className={className} {...tagAttrs}>
      <span lang={primaryLang} className="block text-balance" {...primaryAttrs}>
        {primary}
      </span>
      {secondary && secondaryLang ? (
        <span lang={secondaryLang} className={`block text-balance text-[0.55em] ${secondaryClassName}`} {...secondaryAttrs}>
          {secondary}
        </span>
      ) : null}
    </Tag>
  );
}
