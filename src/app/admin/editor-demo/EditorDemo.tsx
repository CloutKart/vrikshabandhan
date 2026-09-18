"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Locale } from "@/i18n/routing";
import type { MediaItem } from "@/lib/content/types";

const StoryEditor = dynamic(() => import("@/components/admin/StoryEditor"), { ssr: false });

const MEDIA: MediaItem[] = [{ path: "images/seed-bombers-2023.jpg", url: "/images/seed-bombers-2023.jpg", type: "image", alt_en: "Volunteers with the campaign banner", alt_hi: "", width: 1600, height: 1200 }];
const EN = "Seed bombs are made **before the monsoon**.\n## What is a seed bomb\n> Be careful in time. — Manoj Dhyani\n- Mud\n- Seeds\n![Volunteers](media:images/seed-bombers-2023.jpg)";
const HI = "बीज बम मानसून से पहले बनते हैं।";

/** Shows the text the editor writes back, so a test can read the saved format. */
export function EditorDemo() {
  const [text, setText] = useState<Record<Locale, string>>({ en: EN, hi: HI });
  return (
    <main id="content" className="page py-16">
      <h1 className="text-[2.5rem] leading-tight">Editor demo</h1>
      <div className="mt-10">
        <StoryEditor en={EN} hi={HI} media={MEDIA} onChange={(lang, t) => setText((s) => ({ ...s, [lang]: t }))} />
      </div>
      <pre data-saved-en className="mt-8 whitespace-pre-wrap font-sans text-sm text-ink-2">{text.en}</pre>
      <pre data-saved-hi className="mt-4 whitespace-pre-wrap font-sans text-sm text-ink-2" lang="hi">{text.hi}</pre>
    </main>
  );
}
