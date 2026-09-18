import { notFound } from "next/navigation";
import { EditorDemo } from "./EditorDemo";

export const dynamic = "force-dynamic";

/**
 * The story editor on its own, with fixture content and no database, so the
 * tests and a local check can drive it. Only when EDITOR_DEMO=1 (the
 * Playwright server sets it); a deployment never has the variable.
 */
export default function EditorDemoPage() {
  if (process.env.EDITOR_DEMO !== "1") notFound();
  return <EditorDemo />;
}
