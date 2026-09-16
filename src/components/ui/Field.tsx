import type { ReactNode } from "react";

type Props = { id: string; label: string; hint?: string; error?: string; children: ReactNode; lang?: string };

/** A labelled control: the label points at the control, the error is announced and linked to it. */
export function Field({ id, label, hint, error, children, lang }: Props) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="font-sans text-sm text-ink-2" lang={lang}>
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="font-sans text-xs text-ink-2">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="font-sans text-sm text-sutra">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "field-input w-full min-h-11 rounded-sm border border-moss bg-ground-2 px-3 py-2 text-ink placeholder:text-ink-2/70 aria-[invalid=true]:border-sutra";
