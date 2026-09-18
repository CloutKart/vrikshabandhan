"use client";

import { useEffect } from "react";
import { NEWSLETTER_STORAGE_KEY } from "@/lib/theme/constants";

/** Remembers that this visitor subscribed, so the invitation never asks them. */
export function MarkSubscribed() {
  useEffect(() => {
    try {
      localStorage.setItem(NEWSLETTER_STORAGE_KEY, "subscribed");
    } catch {
      // nothing to remember with
    }
  }, []);
  return null;
}
