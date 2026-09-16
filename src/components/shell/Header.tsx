import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitch } from "./LocaleSwitch";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const t = useTranslations("brand");
  const nav = useTranslations("nav");
  return (
    <header className="sticky top-0 z-40 bg-ground">
      <div className="page flex min-h-[var(--header-h)] items-center justify-between gap-6">
        <Link href="/" className="group flex flex-col leading-tight">
          <span className="text-xl">{t("name")}</span>
          <span className="font-sans text-sm text-ink-2">{t("place")}</span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-7 min-[820px]:flex">
          <NavLinks orientation="row" />
          <LocaleSwitch />
          <ThemeToggle />
        </nav>
        <div className="flex items-center gap-1 min-[820px]:hidden">
          <ThemeToggle />
          <MobileNav labels={{ menu: nav("menu"), close: nav("close") }}>
            <NavLinks orientation="column" />
            <div className="mt-8">
              <LocaleSwitch />
            </div>
          </MobileNav>
        </div>
      </div>
    </header>
  );
}
