import { useTranslations } from "next-intl";
import { LocaleSwitch } from "./LocaleSwitch";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";

export function Header() {
  const nav = useTranslations("nav");
  return (
    <header className="sticky top-0 z-40 bg-ground">
      <div className="page flex min-h-[var(--header-h)] items-center justify-between gap-4 min-[1200px]:gap-6">
        <Wordmark />
        <nav aria-label="Primary" className="hidden items-center gap-4 whitespace-nowrap min-[820px]:flex min-[1200px]:gap-7">
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
