/**
 * The tree moves in the wind, stiffly. Branches are wood, so they do not bend
 * like rubber: the cut-out is drawn through a 48x28 grid in which three rigid
 * bodies turn about their joints (the whole crown about the fork, the left
 * bough about its base, the right branches about theirs), blended only in
 * narrow zones at the joints, where a real tree gives. Inside a body every
 * point turns by the same angle, so branches stay straight and the tips travel
 * most. A tiny tremor is added on the foliage alone. The trunk never moves.
 *
 * The still tree image stays underneath for reduced motion, phones and browsers
 * without WebGL; it is hidden once the canvas has drawn. Tuning lives in WIND.
 * Positions are in units of the painting's width; y is scaled by the aspect so
 * angles are true.
 */
type Cleanup = () => void;

/**
 * Two paintings, two geometries: the wide one on desktop and the square one on phones (chosen by <picture>). Each
 * has its trunk axis, its joints and the two pixels that prove a drawn frame. Positions are in units of the width.
 */
type Body = { pivot: readonly [number, number]; degrees: number; lag: number };
type Frame = {
  aspect: number;
  /** The painting's pixel size: the texture is drawn at this, whatever candidate the browser fetched. */
  source: [number, number];
  axis: Array<[number, number]>;
  crown: Body;
  left: Body & { blend: [number, number] };
  right: Body & { blend: [number, number]; rows: [number, number] };
  trunk: { below: number; within: number };
  check: { trunk: [number, number]; ground: [number, number] };
};
const FRAMES: Record<"wide" | "square", Frame> = {
  wide: {
    aspect: 1672 / 941,
    source: [1672, 941],
    axis: [
      [0.815, 1.0],
      [0.81, 0.8],
      [0.79, 0.68],
      [0.76, 0.56],
    ],
    crown: { pivot: [0.76, 0.56], degrees: 0.6, lag: 0 }, // the whole crown, the slow lean
    left: { pivot: [0.69, 0.48], degrees: 1.0, lag: 0.35, blend: [0.62, 0.55] }, // the long bough and its canopy
    right: { pivot: [0.8, 0.55], degrees: 1.2, lag: 0.25, blend: [0.86, 0.9], rows: [0.75, 0.6] }, // the right-hand branches
    trunk: { below: 0.6, within: 0.1 },
    check: { trunk: [0.815, 0.92], ground: [0.5, 0.99] },
  },
  square: {
    aspect: 1,
    source: [1254, 1254],
    axis: [
      [0.85, 1.0],
      [0.845, 0.84],
      [0.83, 0.72],
      [0.8, 0.62],
    ],
    crown: { pivot: [0.8, 0.62], degrees: 0.6, lag: 0 },
    left: { pivot: [0.66, 0.56], degrees: 1.0, lag: 0.35, blend: [0.66, 0.58] },
    right: { pivot: [0.87, 0.6], degrees: 1.2, lag: 0.25, blend: [0.86, 0.92], rows: [0.78, 0.62] },
    trunk: { below: 0.65, within: 0.1 },
    check: { trunk: [0.85, 0.95], ground: [0.2, 0.97] },
  },
};
const WIND = {
  tremor: 0.0015, // foliage shimmer, share of the width
  periods: [6.1, 2.7, 1.1], // slow lean, medium sway, fine tremor
  weights: [0.55, 0.3, 0.15],
  phases: [0, 1.3, 0.4],
};
const COLS = 48;
const ROWS = 28;

const VERT = `
attribute vec2 a_pos;
attribute vec3 a_w;
attribute float a_leaf;
uniform float u_t;
uniform vec3 u_angles;
uniform vec2 u_pivotCrown;
uniform vec2 u_pivotLeft;
uniform vec2 u_pivotRight;
uniform float u_tremor;
uniform float u_aspect;
varying vec2 v_uv;
vec2 turn(vec2 p, vec2 pivot, float a) {
  vec2 q = vec2(p.x - pivot.x, (p.y - pivot.y) / u_aspect);
  float c = cos(a), s = sin(a);
  q = vec2(q.x * c - q.y * s, q.x * s + q.y * c);
  return vec2(q.x + pivot.x, q.y * u_aspect + pivot.y);
}
void main() {
  vec2 p = a_pos;
  p = turn(p, u_pivotCrown, u_angles.x * a_w.x);
  p = turn(p, u_pivotLeft, u_angles.y * a_w.y);
  p = turn(p, u_pivotRight, u_angles.z * a_w.z);
  p.x += u_tremor * a_leaf * sin(6.0 * u_t + 40.0 * a_pos.x + 25.0 * a_pos.y);
  v_uv = a_pos;
  gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
}`;
const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
varying vec2 v_uv;
void main() {
  gl_FragColor = texture2D(u_tex, v_uv);
}`;

function distanceToAxis(x: number, y: number, f: Frame): number {
  const px = x, py = y / f.aspect;
  let best = Infinity;
  for (let i = 0; i < f.axis.length - 1; i++) {
    const [ax, ay0] = f.axis[i], [bx, by0] = f.axis[i + 1];
    const ay = ay0 / f.aspect, by = by0 / f.aspect;
    const vx = bx - ax, vy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
    best = Math.min(best, Math.hypot(px - (ax + t * vx), py - (ay + t * vy)));
  }
  return best;
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Body weights for a point: crown, left bough, right branches. The trunk gets none. */
export function weightsAt(x: number, y: number, f: Frame = FRAMES.wide): [number, number, number] {
  const d = distanceToAxis(x, y, f);
  const trunk = y > f.trunk.below && d < f.trunk.within ? 0 : smoothstep(0.02, 0.09, d);
  const left = smoothstep(f.left.blend[0], f.left.blend[1], x); // 1 left of the bough's base, blending in at the joint
  const right = smoothstep(f.right.blend[0], f.right.blend[1], x) * smoothstep(f.right.rows[0], f.right.rows[1], y); // the branches leaving the trunk to the right
  return [trunk, trunk * left, trunk * right];
}

/** How much a point trembles: the foliage, not the wood. */
export function leafAt(x: number, y: number, f: Frame = FRAMES.wide): number {
  return smoothstep(0.25, 0.5, distanceToAxis(x, y, f));
}

function gust(t: number): number {
  let g = 0;
  for (let i = 0; i < 3; i++) g += WIND.weights[i] * Math.sin((2 * Math.PI * t) / WIND.periods[i] + WIND.phases[i]);
  return g;
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
}

export function treeSway(): Cleanup {
  const art = document.querySelector<HTMLElement>(".hero-art");
  if (!art) return () => {};
  const images = Array.from(art.querySelectorAll<HTMLImageElement>("img.hero-tree"));
  if (!images.length) return () => {};
  const canvas = document.createElement("canvas");
  canvas.className = "hero-sway";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return () => {};
  art.appendChild(canvas);

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  if (!vs || !fs || !program) {
    canvas.remove();
    return () => {};
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);

  const positions: number[] = [];
  for (let r = 0; r <= ROWS; r++)
    for (let c = 0; c <= COLS; c++) positions.push(c / COLS, r / ROWS);
  const bodies = (f: Frame) => {
    const weights: number[] = [];
    const leaf: number[] = [];
    for (let r = 0; r <= ROWS; r++)
      for (let c = 0; c <= COLS; c++) {
        weights.push(...weightsAt(c / COLS, r / ROWS, f));
        leaf.push(leafAt(c / COLS, r / ROWS, f));
      }
    return { weights, leaf };
  };
  const indices: number[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const i = r * (COLS + 1) + c;
      indices.push(i, i + 1, i + COLS + 1, i + 1, i + COLS + 2, i + COLS + 1);
    }
  const bind = (name: string, data: number[], size: number) => {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    return buf;
  };
  bind("a_pos", positions, 2);
  const first = bodies(FRAMES.wide);
  const weightBuf = bind("a_w", first.weights, 3);
  const leafBuf = bind("a_leaf", first.leaf, 1);
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  const u = (name: string) => gl.getUniformLocation(program, name);
  gl.uniform1f(u("u_tremor"), WIND.tremor);
  const uT = u("u_t");
  const uAngles = u("u_angles");
  const rad = Math.PI / 180;
  // The frame follows the image the browser chose: square on phones, wide elsewhere.
  let geo: Frame = FRAMES.wide;
  const setFrame = (f: Frame) => {
    geo = f;
    gl.uniform2fv(u("u_pivotCrown"), f.crown.pivot as unknown as number[]);
    gl.uniform2fv(u("u_pivotLeft"), f.left.pivot as unknown as number[]);
    gl.uniform2fv(u("u_pivotRight"), f.right.pivot as unknown as number[]);
    gl.uniform1f(u("u_aspect"), f.aspect);
    const b = bodies(f);
    gl.bindBuffer(gl.ARRAY_BUFFER, weightBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(b.weights), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, leafBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(b.leaf), gl.STATIC_DRAW);
  };
  setFrame(FRAMES.wide);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  let disposed = false;
  let raf = 0;
  let textured = false;
  const start = performance.now();
  // Software rendering (no GPU: some VMs, remote desktops) gets a smaller canvas and half the frames.
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  const software = /swiftshader|llvmpipe|software/i.test(renderer);
  // A pixel budget rather than a fixed ratio: a phone-sized square may draw at 3x (the knot patches beside it are
  // drawn at full density by the browser, so a 2x tree would look soft), desktop stays at 2x.
  const maxDpr = () => (software ? 1 : Math.max(2, 1800 / Math.max(1, art.clientWidth)));
  let tick = 0;

  const visibleImage = () => {
    const theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    return images.find((img) => img.dataset.variant === theme) ?? images[0];
  };
  // The first frame after every upload is checked before the still tree is hidden (see `frameLooksRight`).
  let verified = false;
  const scratch = document.createElement("canvas");
  const upload = () => {
    const img = visibleImage();
    const apply = () => {
      if (disposed || !img.naturalWidth) return;
      // Through a 2D canvas: every browser uploads a canvas faithfully, whatever the image's encoding or decode
      // state. Safari has handed WebGL an opaque black texture straight from an <img>. The canvas is the painting's
      // own size, never naturalWidth: for a responsive image that is divided by the candidate's pixel density
      // (1254 px served for a 3x phone reads as 305), and a texture that small is a blurry tree.
      const square = Math.abs(img.naturalWidth / img.naturalHeight - 1) < 0.05;
      const next = square ? FRAMES.square : FRAMES.wide;
      const [sw, sh] = next.source;
      scratch.width = sw;
      scratch.height = sh;
      const ctx = scratch.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, sw, sh);
      ctx.drawImage(img, 0, 0, sw, sh);
      canvas.dataset.texture = `${sw}x${sh}`;
      if (next !== geo) setFrame(next);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
      textured = true;
      verified = false;
    };
    const ready = () => {
      const decoded = typeof img.decode === "function" ? img.decode().catch(() => undefined) : Promise.resolve();
      decoded.then(apply);
    };
    if (img.complete && img.naturalWidth) ready();
    else img.addEventListener("load", ready, { once: true });
  };
  upload();
  const themeObserver = new MutationObserver(upload);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  // The <picture> swaps its source when the viewport crosses the phone width: the image loads again, so re-upload.
  const phone = window.matchMedia("(max-width: 819px)");
  const onFrameChange = () => upload();
  phone.addEventListener("change", onFrameChange);
  images.forEach((img) => img.addEventListener("load", onFrameChange));

  // Two pixels prove a frame: the trunk (opaque and pale in both cut-outs) and the empty ground below the crown
  // (fully transparent). A browser that uploaded the texture as opaque black, or lost the context, fails this and
  // the still tree stays in view instead of a black frame.
  const px = new Uint8Array(4);
  const read = (u: number, v: number) => {
    gl.readPixels(Math.round(u * (canvas.width - 1)), Math.round((1 - v) * (canvas.height - 1)), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return Array.from(px);
  };
  const frameLooksRight = () => {
    if (gl.getError() !== gl.NO_ERROR) return false;
    const trunk = read(...geo.check.trunk);
    const ground = read(...geo.check.ground);
    return trunk[3] > 200 && trunk[0] + trunk[1] + trunk[2] > 60 && ground[3] === 0;
  };

  // The backing store follows the pinch zoom too (visualViewport.scale): a zoomed-in tree is redrawn at the
  // zoomed density instead of being stretched, within a 3072 px width: a square at that size stays well under the
  // 16.7 million pixel canvas limit of iOS Safari.
  const resize = () => {
    const zoom = window.visualViewport?.scale || 1;
    const cw = Math.max(1, art.clientWidth);
    const dpr = Math.min((window.devicePixelRatio || 1) * zoom, maxDpr() * zoom, 3072 / cw);
    const w = Math.round(cw * dpr), h = Math.round(art.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };
  const ro = new ResizeObserver(resize);
  ro.observe(art);
  window.visualViewport?.addEventListener("resize", resize);
  resize();

  const frame = () => {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (!textured || !canvas.width) return;
    if (software && tick++ % 2) return;
    // Wait for the hero's entrance to finish before the first draw, so the two never compete for the main thread.
    if (document.documentElement.dataset.hero === "pending") return;
    const t = (performance.now() - start) / 1000;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uT, t);
    gl.uniform3f(
      uAngles,
      geo.crown.degrees * rad * gust(t - geo.crown.lag),
      geo.left.degrees * rad * gust(t - geo.left.lag),
      geo.right.degrees * rad * gust(t - geo.right.lag),
    );
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    if (!verified) {
      if (!frameLooksRight()) {
        stop();
        return;
      }
      verified = true;
    }
    if (!art.dataset.sway) {
      art.dataset.sway = "";
      // Whatever the entrance left inline, the still tree now yields to the canvas.
      images.forEach((img) => img.style.removeProperty("opacity"));
    }
  };
  raf = requestAnimationFrame(frame);

  const stop = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.visualViewport?.removeEventListener("resize", resize);
    themeObserver.disconnect();
    phone.removeEventListener("change", onFrameChange);
    images.forEach((img) => img.removeEventListener("load", onFrameChange));
    canvas.removeEventListener("webglcontextlost", onLost);
    delete art.dataset.sway;
    canvas.remove();
  };
  // A lost context (phones drop WebGL when the tab is backgrounded) hands the layer back to the still tree.
  const onLost = (e: Event) => {
    e.preventDefault();
    stop();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  return stop;
}
