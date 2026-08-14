import { useEffect, useRef, type RefObject } from "react";

/**
 * Continuous pointer-reactive smoke.
 *
 * Three things make this read as smoke rather than floating orbs:
 *  1. Irregular pre-rendered puff sprites (several offset blobs baked into one
 *     texture) drawn with drawImage — not perfect radial gradients, and far
 *     cheaper per particle, which is what allows enough of them to look dense.
 *  2. Curl-noise advection. Particles are pushed by the curl of a scrolling
 *     value-noise potential field, which is divergence-free — so they swirl and
 *     fold around each other instead of drifting in parallel lines.
 *  3. Continuous emission with long, staggered lifetimes. Particles are born at
 *     the emitter's perimeter at a steady rate and live long enough to cross the
 *     hero and fade out, so there is no visible respawn cycle.
 *
 * Cheap by construction: one pooled array, sprites rasterised once, rAF paused
 * off-screen and when hidden, disabled under prefers-reduced-motion.
 */

interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  grow: number;
  angle: number;
  spin: number;
  life: number;
  maxLife: number;
  alpha: number;
  sprite: number;
  active: boolean;
}

interface SmokeFieldProps {
  className?: string;
  /** Emit continuously from the perimeter of this element. */
  emitterRef?: RefObject<HTMLElement | null>;
  /** Multiplies emission rate + pool size. */
  density?: number;
  /** 0..1 overall opacity. */
  intensity?: number;
}

/* ---- cheap 2D value noise + curl, for turbulent advection ---- */
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
const smooth = (t: number) => t * t * (3 - 2 * t);
const noise2 = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = smooth(xf);
  const v = smooth(yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
};

/**
 * Bake wispy smoke sprites from fractal (fBm) noise.
 *
 * Photographic smoke PNGs read as smoke because their edges are fractal and
 * filamented, not because of clever physics. Round radial gradients always look
 * like glowing orbs no matter how they move. So the alpha channel here is
 * 5 octaves of value noise multiplied by a radial falloff — irregular, torn
 * edges that dissolve — generated once at mount so there is no external asset
 * to load and nothing to go missing offline.
 */
const makeSprites = (size: number, count: number): HTMLCanvasElement[] =>
  Array.from({ length: count }, (_, s) => {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d")!;
    const img = g.createImageData(size, size);
    const d = img.data;
    const seed = 17.3 + s * 91.7;
    const inv = 1 / size;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x * inv;
        const ny = y * inv;

        let amp = 1;
        let freq = 3.2;
        let sum = 0;
        let norm = 0;
        for (let o = 0; o < 5; o++) {
          sum += amp * noise2(nx * freq + seed, ny * freq + seed);
          norm += amp;
          amp *= 0.52;
          freq *= 2.13;
        }
        const n = sum / norm;

        // radial dissolve so the puff has no hard boundary
        const dx = nx - 0.5;
        const dy = ny - 0.5;
        const r = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2.05);
        const fall = 1 - r;

        let a = Math.pow(fall, 1.7) * Math.pow(n, 1.8) * 3.1;
        a = a > 1 ? 1 : a < 0 ? 0 : a;

        const i = (y * size + x) << 2;
        d[i] = 255;
        d[i + 1] = 219;
        d[i + 2] = 158; // warm gold, baked in
        d[i + 3] = (a * 255) | 0;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  });

const SmokeField = ({
  className = "",
  emitterRef,
  density = 1,
  intensity = 1,
}: SmokeFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointer = useRef({ x: -9999, y: -9999, px: 0, py: 0, vx: 0, vy: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // 160px is plenty: the sprites are drawn large and blurry, and generating
    // fBm per-pixel is the one expensive step, so it stays a one-off ~20ms.
    const sprites = makeSprites(160, 3);

    let width = 0;
    let height = 0;
    let pool: Puff[] = [];
    let raf = 0;
    let running = false;
    let emitAcc = 0;
    /** particles per second */
    let emitRate = 26 * density;

    let emitter: { x: number; y: number; w: number; h: number } | null = null;
    const refreshEmitter = () => {
      const el = emitterRef?.current;
      if (!el) {
        emitter = null;
        return;
      }
      const c = canvas.getBoundingClientRect();
      const e = el.getBoundingClientRect();
      emitter = { x: e.left - c.left, y: e.top - c.top, w: e.width, h: e.height };
    };

    /** Place a particle on the emitter perimeter (or the floor, without one). */
    const emit = (p: Puff, stagger = false) => {
      p.active = true;
      p.maxLife = 9000 + Math.random() * 9000;
      p.life = stagger ? Math.random() * p.maxLife : 0;
      p.sprite = (Math.random() * sprites.length) | 0;
      p.angle = Math.random() * Math.PI * 2;
      p.spin = (Math.random() - 0.5) * 0.00022;
      p.scale = 0.12 + Math.random() * 0.16;
      p.grow = 0.00012 + Math.random() * 0.00018;
      p.alpha = 0.5 + Math.random() * 0.5;

      if (emitter && emitter.w > 0) {
        const perim = 2 * (emitter.w + emitter.h);
        let t = Math.random() * perim;
        let nx = 0;
        let ny = 0;
        let px: number;
        let py: number;
        if (t < emitter.w) {
          px = emitter.x + t;
          py = emitter.y;
          ny = -1;
        } else if ((t -= emitter.w) < emitter.h) {
          px = emitter.x + emitter.w;
          py = emitter.y + t;
          nx = 1;
        } else if ((t -= emitter.h) < emitter.w) {
          px = emitter.x + emitter.w - t;
          py = emitter.y + emitter.h;
          ny = 1;
        } else {
          t -= emitter.w;
          px = emitter.x;
          py = emitter.y + emitter.h - t;
          nx = -1;
        }
        p.x = px + nx * 4;
        p.y = py + ny * 4;
        p.vx = nx * (0.012 + Math.random() * 0.022);
        p.vy = ny * (0.008 + Math.random() * 0.016) - (0.012 + Math.random() * 0.016);
      } else {
        p.x = Math.random() * width;
        p.y = height * (0.85 + Math.random() * 0.2);
        p.vx = (Math.random() - 0.5) * 0.02;
        p.vy = -(0.015 + Math.random() * 0.02);
      }
    };

    const blank = (): Puff => ({
      x: 0, y: 0, vx: 0, vy: 0, scale: 0.2, grow: 0, angle: 0, spin: 0,
      life: 0, maxLife: 1, alpha: 1, sprite: 0, active: false,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      refreshEmitter();

      const area = width * height;
      emitRate = Math.min(70, Math.max(14, area / 15000)) * density;
      const cap = Math.round(Math.min(320, Math.max(60, area / 4200)) * density);
      pool = Array.from({ length: cap }, () => blank());
      // prefill so the field is already full on first paint (no build-up)
      const prefill = Math.min(cap, Math.round(cap * 0.75));
      for (let i = 0; i < prefill; i++) emit(pool[i], true);
    };

    let last = performance.now();
    let sinceEmitterRefresh = 0;

    const frame = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      sinceEmitterRefresh += dt;
      if (sinceEmitterRefresh > 350) {
        sinceEmitterRefresh = 0;
        refreshEmitter();
      }

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      const ptr = pointer.current;
      ptr.vx *= 0.9;
      ptr.vy *= 0.9;

      // continuous emission
      emitAcc += (emitRate * dt) / 1000;
      while (emitAcc >= 1) {
        emitAcc -= 1;
        const free = pool.find((p) => !p.active);
        if (!free) break;
        emit(free);
      }

      const nt = now * 0.00004; // noise field scroll
      const FREQ = 0.0022;

      for (const p of pool) {
        if (!p.active) continue;
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          continue;
        }

        // curl of a scrolling potential field => divergence-free swirl
        const eps = 1.2;
        const n1 = noise2((p.x + eps) * FREQ + nt, p.y * FREQ - nt);
        const n2 = noise2((p.x - eps) * FREQ + nt, p.y * FREQ - nt);
        const n3 = noise2(p.x * FREQ + nt, (p.y + eps) * FREQ - nt);
        const n4 = noise2(p.x * FREQ + nt, (p.y - eps) * FREQ - nt);
        const curlX = (n3 - n4) / (2 * eps);
        const curlY = -(n1 - n2) / (2 * eps);
        p.vx += curlX * 26 * dt * 0.001;
        p.vy += curlY * 26 * dt * 0.001;

        p.vy -= 0.0000085 * dt; // buoyancy

        if (ptr.active) {
          const dx = p.x - ptr.x;
          const dy = p.y - ptr.y;
          const d2 = dx * dx + dy * dy;
          const R = 260;
          if (d2 < R * R) {
            const f = 1 - Math.sqrt(d2) / R;
            const push = f * f;
            // Deliberately gentle: the cursor should stir the smoke, not blast
            // it. Pointer delta is already clamped when sampled, and these
            // coefficients keep the added velocity well under the drift speed.
            p.vx += (ptr.vx * 0.0016 + dx * 0.00004) * push;
            p.vy += (ptr.vy * 0.0016 + dy * 0.00003) * push;
          }
        }

        // drag keeps velocities from compounding into streaks
        p.vx *= 0.982;
        p.vy *= 0.982;

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.spin * dt;
        p.scale += p.grow * dt;

        // fast fade-in, long fade-out — the classic smoke envelope
        const k = p.life / p.maxLife;
        const env = k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88;
        const a = env * env * 0.09 * p.alpha * intensity;
        if (a <= 0.002) continue;

        const size = 160 * p.scale * 3.4;
        if (p.x < -size || p.x > width + size || p.y < -size || p.y > height + size) continue;

        ctx.globalAlpha = a;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.drawImage(sprites[p.sprite], -size / 2, -size / 2, size, size);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const p = pointer.current;
      if (p.active) {
        // clamp the per-move delta: a fast flick across the hero would
        // otherwise inject a single enormous impulse and fling the field
        const CLAMP = 34;
        p.vx = Math.max(-CLAMP, Math.min(CLAMP, x - p.px));
        p.vy = Math.max(-CLAMP, Math.min(CLAMP, y - p.py));
      }
      p.x = x;
      p.y = y;
      p.px = x;
      p.py = y;
      p.active = true;
    };
    const onPointerLeave = () => {
      pointer.current.active = false;
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    if (emitterRef?.current) ro.observe(emitterRef.current);

    const io = new IntersectionObserver(
      (entries) => (entries.some((en) => en.isIntersecting) ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", refreshEmitter, { passive: true });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", refreshEmitter);
    };
  }, [density, intensity, emitterRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
};

export default SmokeField;
