import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type Variant = "solid" | "line";

const base =
  "inline-flex min-h-11 items-center justify-center rounded-sm px-5 font-sans text-base transition-[background-color,border-color,color,transform] duration-150 ease-enter active:scale-[var(--scale-press)]";

const variants: Record<Variant, string> = {
  solid: "bg-sutra text-white hover:bg-sutra/90",
  line: "border border-ink/40 text-ink hover:border-ink",
};

type LinkProps = { href: ComponentProps<typeof Link>["href"]; variant?: Variant; children: ReactNode; className?: string };
type ButtonProps = { href?: undefined; variant?: Variant; children: ReactNode; className?: string; type?: "button" | "submit"; onClick?: () => void; disabled?: boolean };

/** A link that looks like a button when it navigates, a real button when it acts. */
export function Button(props: LinkProps | ButtonProps) {
  const { variant = "solid", children, className = "" } = props;
  const cls = `${base} ${variants[variant]} ${className}`;
  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={cls}>
        {children}
      </Link>
    );
  }
  const { type = "button", onClick, disabled } = props;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
