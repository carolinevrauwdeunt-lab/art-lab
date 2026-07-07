import { useEffect, useRef } from "react";

/**
 * ParticleTulipHero
 * Full-screen hero: a tulip rendered as thousands of white light particles on black.
 * The subject (petals, stem, leaves) is drawn procedurally onto an offscreen source
 * canvas with internal light/shadow shading; particles are sampled from that source
 * weighted by brightness and edge strength, so density naturally traces the shape
 * and falls off into black (which doubles as the "no background" mask).
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

    // ---------- 1. Draw the tulip subject onto an offscreen source canvas ----------
    // Everything outside the flower/stem/leaves stays pure black, so brightness
    // thresholding alone is enough to discard the background.
    const SRC = 1000;

    function buildSource() {
      const off = document.createElement("canvas");
      off.width = SRC;
      off.height = SRC;
      const o = off.getContext("2d");
      o.fillStyle = "#000";
      o.fillRect(0, 0, SRC, SRC);

      const cx = 500;
      function petalPath() {
        o.beginPath();
        o.moveTo(cx, 565);
        o.bezierCurveTo(cx - 130, 560, cx - 205, 470, cx - 195, 400);
        o.bezierCurveTo(cx - 190, 330, cx - 230, 300, cx - 205, 250);
        o.bezierCurveTo(cx - 185, 275, cx - 140, 300, cx - 108, 300);
        o.bezierCurveTo(cx - 95, 340, cx - 55, 345, cx - 20, 350);
        o.bezierCurveTo(cx - 10, 280, cx - 35, 235, cx - 6, 178);
        o.bezierCurveTo(cx + 20, 235, cx + 6, 285, cx + 18, 350);
        o.bezierCurveTo(cx + 55, 345, cx + 95, 340, cx + 108, 300);
        o.bezierCurveTo(cx + 142, 300, cx + 186, 274, cx + 206, 250);
        o.bezierCurveTo(cx + 231, 300, cx + 191, 330, cx + 196, 400);
        o.bezierCurveTo(cx + 206, 470, cx + 131, 560, cx, 565);
        o.closePath();
      }

      // base color: dark maroon (shadow, left) -> hot red-orange (lit, right)
      petalPath();
      const baseGrad = o.createLinearGradient(cx - 210, 0, cx + 210, 0);
      baseGrad.addColorStop(0, "#3a0710");
      baseGrad.addColorStop(0.45, "#8f0f1c");
      baseGrad.addColorStop(0.72, "#c81f2b");
      baseGrad.addColorStop(1, "#ff5a3c");
      o.fillStyle = baseGrad;
      o.fill();

      o.save();
      petalPath();
      o.clip();

      // dark seam / shadow crease left-of-center
      const seam = o.createRadialGradient(cx - 65, 380, 10, cx - 65, 380, 200);
      seam.addColorStop(0, "rgba(15,2,4,0.65)");
      seam.addColorStop(1, "rgba(15,2,4,0)");
      o.fillStyle = seam;
      o.fillRect(0, 0, SRC, SRC);

      // lit highlight, upper right
      const lit = o.createRadialGradient(cx + 90, 260, 10, cx + 90, 260, 190);
      lit.addColorStop(0, "rgba(255,190,150,0.55)");
      lit.addColorStop(1, "rgba(255,190,150,0)");
      o.globalCompositeOperation = "lighter";
      o.fillStyle = lit;
      o.fillRect(0, 0, SRC, SRC);

      // small hot rim highlight near the top edge
      const hot = o.createRadialGradient(cx + 20, 205, 4, cx + 20, 205, 70);
      hot.addColorStop(0, "rgba(255,255,255,0.55)");
      hot.addColorStop(1, "rgba(255,255,255,0)");
      o.fillStyle = hot;
      o.fillRect(0, 0, SRC, SRC);
      o.globalCompositeOperation = "source-over";

      // lobe seams (vein lines) for extra edge detail
      o.strokeStyle = "rgba(20,2,6,0.45)";
      o.lineWidth = 7;
      o.beginPath();
      o.moveTo(cx - 108, 300);
      o.quadraticCurveTo(cx - 60, 430, cx - 20, 560);
      o.stroke();
      o.beginPath();
      o.moveTo(cx + 108, 300);
      o.quadraticCurveTo(cx + 60, 430, cx + 20, 560);
      o.stroke();

      o.restore();

      // outer rim light along the top-left silhouette
      petalPath();
      o.save();
      o.clip();
      o.strokeStyle = "rgba(255,220,210,0.35)";
      o.lineWidth = 10;
      o.beginPath();
      o.moveTo(cx - 205, 250);
      o.bezierCurveTo(cx - 140, 200, cx - 40, 190, cx - 6, 178);
      o.stroke();
      o.restore();

      // ----- stem -----
      const stemGrad = o.createLinearGradient(cx - 40, 0, cx + 40, 0);
      stemGrad.addColorStop(0, "#1f2c10");
      stemGrad.addColorStop(0.55, "#3f5c22");
      stemGrad.addColorStop(1, "#7c9a46");
      o.fillStyle = stemGrad;
      o.beginPath();
      o.moveTo(cx - 38, 555);
      o.bezierCurveTo(cx - 34, 700, cx - 30, 850, cx - 22, 995);
      o.lineTo(cx + 20, 995);
      o.bezierCurveTo(cx + 28, 850, cx + 32, 700, cx + 38, 555);
      o.closePath();
      o.fill();

      // ----- leaves -----
      function leaf(x0, y0, cx1, cy1, x1, y1, cx2, cy2, flip) {
        const g = o.createLinearGradient(x0, 0, x1, 0);
        if (flip) {
          g.addColorStop(0, "#7c9a46");
          g.addColorStop(1, "#233414");
        } else {
          g.addColorStop(0, "#233414");
          g.addColorStop(1, "#7c9a46");
        }
        o.fillStyle = g;
        o.beginPath();
        o.moveTo(x0, y0);
        o.quadraticCurveTo(cx1, cy1, x1, y1);
        o.quadraticCurveTo(cx2, cy2, x0, y0);
        o.closePath();
        o.fill();
      }
      leaf(cx - 30, 640, cx - 260, 760, cx - 300, 890, cx - 90, 760, false);
      leaf(cx + 32, 690, cx + 280, 810, cx + 330, 930, cx + 95, 810, true);
      leaf(cx - 10, 760, cx - 140, 950, cx - 160, 998, cx - 40, 940, false);

      return o.getImageData(0, 0, SRC, SRC);
    }

    const srcData = buildSource();
    const srcPixels = srcData.data;

    function luminanceAt(x, y) {
      if (x < 0 || y < 0 || x >= SRC || y >= SRC) return 0;
      const i = (y * SRC + x) * 4;
      return (0.299 * srcPixels[i] + 0.587 * srcPixels[i + 1] + 0.114 * srcPixels[i + 2]) / 255;
    }

    // ---------- 2. Turn the source into a cloud of particles ----------
    const STEP = 3;
    const particles = [];

    for (let y = 0; y < SRC; y += STEP) {
      for (let x = 0; x < SRC; x += STEP) {
        const b = luminanceAt(x, y);
        if (b < 0.03) continue;

        const gx = luminanceAt(x + STEP, y) - luminanceAt(x - STEP, y);
        const gy = luminanceAt(x, y + STEP) - luminanceAt(x, y - STEP);
        const edge = Math.min(1, Math.sqrt(gx * gx + gy * gy) * 2.2);

        const weight = b * 0.75 + edge * 0.6;
        if (weight < 0.05) continue;

        const chance = Math.min(1, weight * 1.15);
        if (Math.random() > chance) continue;

        particles.push({
          bx: (x + (Math.random() - 0.5) * STEP) / SRC,
          by: (y + (Math.random() - 0.5) * STEP) / SRC,
          brightness: Math.min(1, b * 0.6 + edge * 0.8),
          phase: Math.random() * Math.PI * 2,
          speed: 0.00025 + Math.random() * 0.0004,
          ampX: 0.8 + Math.random() * 1.8,
          ampY: 0.8 + Math.random() * 1.8,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
        });
      }
    }

    // ---------- 3. Layout: fit the square source into the viewport ----------
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let originX = 0;
    let originY = 0;
    let scale = 1;

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

      scale = Math.min(w, h) * 0.92;
      originX = (w - scale) / 2;
      originY = (h - scale) / 2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x = originX + p.bx * scale;
        p.y = originY + p.by * scale;
      }
    }

    layout();
    window.addEventListener("resize", layout);
    window.addEventListener("orientationchange", layout);

    // ---------- 4. Pointer interaction (mouse + touch) ----------
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

    // ---------- 5. Animate ----------
    const SPRING = 0.055;
    const DAMPING = 0.88;

    function frame(t) {
      if (destroyed) return;
      const { w, h } = getSize();
      const pushStrength = MOUSE_RADIUS * 0.9;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const baseX = originX + p.bx * scale;
        const baseY = originY + p.by * scale;

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
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
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
    <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", background: "#000" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }} />
    </div>
  );
}
