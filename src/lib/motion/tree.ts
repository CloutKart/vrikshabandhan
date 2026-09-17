/**
 * The tree moves in the wind. The cut-out is drawn through a 48x28 grid whose
 * vertices are displaced by one gust signal, weighted by how far each vertex is
 * from a rigid axis through the trunk: nothing at the base, a little on the
 * boughs, most at the tips and the outer canopy, with the tips lagging a beat
 * behind. The static cut-out image stays underneath for reduced motion, phones
 * and browsers without WebGL; it is hidden once the canvas has drawn a frame.
 *
 * Tuning lives in WIND below. Distances are in units of the painting's width.
 */
type Cleanup = () => void;

const WIND = {
  amplitude: 0.022, // sideways travel at flex 1 (about 27 px of a 1250 px painting)
  dip: 0.35, // downward share of the amplitude when a gust loads a branch
  flutter: 0.1, // fine tremor across the canopy, share of the amplitude
  lag: 0.45, // seconds by which the tips trail the boughs
  periods: [6.1, 2.7, 1.1], // slow lean, medium sway, fine tremor
  weights: [0.55, 0.3, 0.15],
  phases: [0, 1.3, 0.4],
};
const COLS = 48;
const ROWS = 28;
const ASPECT = 1672 / 941;
/** The trunk, bottom to fork, in (x, y) of the painting. Vertices near it do not move. */
const AXIS: Array<[number, number]> = [
  [0.815, 1.0],
  [0.81, 0.8],
  [0.79, 0.68],
  [0.76, 0.56],
];

const VERT = `
attribute vec2 a_pos;
attribute float a_flex;
uniform float u_t;
uniform float u_amp;
uniform float u_dip;
uniform float u_flutter;
uniform float u_lag;
uniform vec3 u_periods;
uniform vec3 u_weights;
uniform vec3 u_phases;
varying vec2 v_uv;
float gust(float t) {
  vec3 w = u_weights * sin(6.2831853 * t / u_periods + u_phases);
  return w.x + w.y + w.z;
}
void main() {
  float t = u_t - u_lag * a_flex;
  float g = gust(t);
  float dx = u_amp * a_flex * g + u_flutter * u_amp * a_flex * sin(6.0 * u_t + 40.0 * a_pos.x + 25.0 * a_pos.y);
  float dy = u_dip * u_amp * a_flex * g * g;
  vec2 p = a_pos + vec2(dx, dy * ${ASPECT.toFixed(4)});
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

function distanceToAxis(x: number, y: number): number {
  // Work in width units: y is scaled by the aspect so distances are isotropic.
  const px = x, py = y / ASPECT;
  let best = Infinity;
  for (let i = 0; i < AXIS.length - 1; i++) {
    const [ax, ay0] = AXIS[i], [bx, by0] = AXIS[i + 1];
    const ay = ay0 / ASPECT, by = by0 / ASPECT;
    const vx = bx - ax, vy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
    const dx = px - (ax + t * vx), dy = py - (ay + t * vy);
    best = Math.min(best, Math.hypot(dx, dy));
  }
  return best;
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** How much a point may move: 0 on the trunk, 1 at the far tips. */
export function flexAt(x: number, y: number): number {
  const d = distanceToAxis(x, y);
  if (y > 0.6 && d < 0.1) return 0;
  return Math.pow(smoothstep(0.03, 0.55, d), 1.5);
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
  const images = Array.from(art.querySelectorAll<HTMLImageElement>("img.hero-cutout:not(.hero-tassel)"));
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

  // The grid: positions in painting units and a flex value per vertex.
  const positions: number[] = [];
  const flex: number[] = [];
  for (let r = 0; r <= ROWS; r++)
    for (let c = 0; c <= COLS; c++) {
      const x = c / COLS, y = r / ROWS;
      positions.push(x, y);
      flex.push(flexAt(x, y));
    }
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
  };
  bind("a_pos", positions, 2);
  bind("a_flex", flex, 1);
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  const u = (name: string) => gl.getUniformLocation(program, name);
  gl.uniform1f(u("u_amp"), WIND.amplitude);
  gl.uniform1f(u("u_dip"), WIND.dip);
  gl.uniform1f(u("u_flutter"), WIND.flutter);
  gl.uniform1f(u("u_lag"), WIND.lag);
  gl.uniform3fv(u("u_periods"), WIND.periods);
  gl.uniform3fv(u("u_weights"), WIND.weights);
  gl.uniform3fv(u("u_phases"), WIND.phases);
  const uT = u("u_t");

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

  const visibleImage = () => {
    const theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    return images.find((img) => img.dataset.variant === theme) ?? images[0];
  };
  const upload = () => {
    const img = visibleImage();
    const apply = () => {
      if (disposed || !img.naturalWidth) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      textured = true;
    };
    if (img.complete && img.naturalWidth) apply();
    else img.addEventListener("load", apply, { once: true });
  };
  upload();
  const themeObserver = new MutationObserver(upload);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(art.clientWidth * dpr), h = Math.round(art.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };
  const ro = new ResizeObserver(resize);
  ro.observe(art);
  resize();

  const frame = () => {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (!textured || !canvas.width) return;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uT, (performance.now() - start) / 1000);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    if (!art.dataset.sway) art.dataset.sway = "";
  };
  raf = requestAnimationFrame(frame);

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    themeObserver.disconnect();
    delete art.dataset.sway;
    canvas.remove();
  };
}
