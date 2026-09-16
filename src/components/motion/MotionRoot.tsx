"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Loads the motion chunk after hydration and mounts it for the current route.
 * The chunk is not part of the first-load JavaScript of any page.
 */
export function MotionRoot() {
  const pathname = usePathname();
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    import("@/lib/motion/site").then((m) => {
      if (cancelled) return;
      cleanup = m.mount(pathname);
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [pathname]);
  return null;
}
