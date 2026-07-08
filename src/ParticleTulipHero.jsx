import { useEffect, useRef } from "react";
import { PARTICLE_DATA_B64, SOURCE_ASPECT } from "./particleData.js";
import tulipSourceImg from "./tulip-source.jpg";

/**
 * ParticleTulipHero
 * Full-screen hero: the source tulip photograph rendered as thousands of white
 * light particles on black. Particle positions and brightness were sampled
 * offline directly from the photo's pixels (petal color/edges plus a masked
 * corridor for the stem), so the shape traces the real photo rather than a
 * drawn approximation. The particle data ships baked into particleData.js —
 * no image asset is fetched at runtime.
 *
 * Drop this in as <ParticleTulipHero /> — it fills its nearest positioned ancestor,
 * or the viewport if used at the page root.
 */
export default function ParticleTulipHero() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let destroyed = false;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---------- 1. Decode the baked particle data ----------
    function decodeParticles(b64) {
      const bin = atob(b64);
      const buf = new ArrayBuffer(bin.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
      return new Float32Array(buf);
    }

    const flat = decodeParticles(PARTICLE_DATA_B64);
    const particles = [];
    for (let i = 0; i < flat.length; i += 3) {
      particles.push({
        bx: flat[i],
        by: flat[i + 1],
        brightness: flat[i + 2],
        warm: Math.random(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.00025 + Math.random() * 0.0004,
        ampX: 0.7 + Math.random() * 1.6,
        ampY: 0.7 + Math.random() * 1.6,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      });
    }

    // ---------- 2. Layout: fit the photo's aspect ratio into the viewport ----------
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let originX = 0;
    let originY = 0;
    let dispW = 1;
    let dispH = 1;

    function getSize() {
      const parent = canvas.parentElement;
      if (parent && parent !== document.body) {
        return { w: parent.clientWidth, h: parent.clientHeight };
      }
      return { w: window.innerWidth, h: window.innerHeight };
    }

    function layout() {
      const { w, h } = getSize();
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const boxW = w * 0.92;
      const boxH = h * 0.92;
      if (boxW / boxH > SOURCE_ASPECT) {
        dispH = boxH;
        dispW = boxH * SOURCE_ASPECT;
      } else {
        dispW = boxW;
        dispH = boxW / SOURCE_ASPECT;
      }
      originX = (w - dispW) / 2;
      originY = (h - dispH) / 2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x = originX + p.bx * dispW;
        p.y = originY + p.by * dispH;
      }
    }

    layout();
    window.addEventListener("resize", layout);
    window.addEventListener("orientationchange", layout);

    // ---------- 3. Pointer interaction (mouse + touch) ----------
    const mouse = { x: -9999, y: -9999, active: false };
    let MOUSE_RADIUS = Math.min(window.innerWidth, window.innerHeight) * 0.16;

    function setPointer(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;
      mouse.active = true;
    }

    function onPointerMove(e) {
      setPointer(e.clientX, e.clientY);
    }
    function onPointerLeave() {
      mouse.active = false;
    }
    function onResizeRadius() {
      MOUSE_RADIUS = Math.min(window.innerWidth, window.innerHeight) * 0.16;
    }

    if (!prefersReduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerMove, { passive: true });
      window.addEventListener("pointerup", onPointerLeave, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave, { passive: true });
      window.addEventListener("resize", onResizeRadius);
    }

    // ---------- 4. Animate ----------
    const SPRING = 0.055;
    const DAMPING = 0.88;

    function frame(t) {
      if (destroyed) return;
      const { w, h } = getSize();
      const pushStrength = MOUSE_RADIUS * 0.9;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const baseX = originX + p.bx * dispW;
        const baseY = originY + p.by * dispH;

        let targetX = baseX;
        let targetY = baseY;

        if (!prefersReduced) {
          targetX += Math.sin(t * p.speed + p.phase) * p.ampX;
          targetY += Math.cos(t * p.speed * 1.3 + p.phase) * p.ampY;

          if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_RADIUS && dist > 0.001) {
              let force = 1 - dist / MOUSE_RADIUS;
              force *= force;
              targetX += (dx / dist) * force * pushStrength;
              targetY += (dy / dist) * force * pushStrength;
            }
          }

          p.vx += (targetX - p.x) * SPRING;
          p.vy += (targetY - p.y) * SPRING;
          p.vx *= DAMPING;
          p.vy *= DAMPING;
          p.x += p.vx;
          p.y += p.vy;
        } else {
          p.x = targetX;
          p.y = targetY;
        }

        const size = 0.55 + p.brightness * 1.35;
        const alpha = 0.22 + p.brightness * 0.78;
        const mix = p.warm * (1 - p.brightness * 0.5);
        const g = Math.round(255 - mix * 45);
        const b = Math.round(255 - mix * 175);
        ctx.fillStyle = `rgba(255,${g},${b},${alpha})`;
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      }

      if (!prefersReduced) raf = requestAnimationFrame(frame);
    }

    if (prefersReduced) {
      frame(0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", layout);
      window.removeEventListener("orientationchange", layout);
      window.removeEventListener("resize", onResizeRadius);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      window.removeEventListener("pointerup", onPointerLeave);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "#000", overflow: "hidden" }}>
      <img
        src={tulipSourceImg}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          maxWidth: "92vw",
          maxHeight: "92vh",
          width: "auto",
          height: "auto",
          opacity: 0.5,
          filter: "saturate(0.9) brightness(1.05)",
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: "relative", display: "block", width: "100%", height: "100%", touchAction: "pan-y" }}
      />
    </div>
  );
}
