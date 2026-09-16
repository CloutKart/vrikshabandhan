"use client";

import { useEffect, useState } from "react";

type ToastItem = { id: number; text: string; action?: { label: string; onClick: () => void }; ttl: number };
type Listener = (t: ToastItem) => void;

const listeners = new Set<Listener>();
let seq = 0;

/** Show a short status message; an optional action (Undo) keeps it up for longer. */
export function toast(text: string, action?: ToastItem["action"], ttl = action ? 8000 : 3500) {
  const item: ToastItem = { id: ++seq, text, action, ttl };
  listeners.forEach((l) => l(item));
}

/** Mount once. The region is polite live so assistive tech announces messages without motion. */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const timers = new Map<number, number>();
    const listener: Listener = (t) => {
      setItems((s) => [...s, t]);
      timers.set(
        t.id,
        window.setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), t.ttl),
      );
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const dismiss = (id: number) => setItems((s) => s.filter((x) => x.id !== id));

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex flex-col items-center gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="toast pointer-events-auto flex items-center gap-4 rounded-sm bg-ink px-4 py-3 font-sans text-sm text-ground shadow-lg"
        >
          <span>{t.text}</span>
          {t.action ? (
            <button
              type="button"
              className="u-thread min-h-8 text-gold"
              onClick={() => {
                t.action?.onClick();
                dismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
