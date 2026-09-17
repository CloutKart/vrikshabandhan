import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";

let registered = false;

/** GSAP with the plugins this site uses, registered once. Only ever imported from the client motion chunk. */
export function getGsap() {
  if (!registered) {
    gsap.registerPlugin(SplitText, Flip);
    registered = true;
  }
  return { gsap, SplitText, Flip };
}
