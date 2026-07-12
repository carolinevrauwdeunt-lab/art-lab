import { useEffect, useRef } from "react";
import { LION_MESH } from "./lionMeshData.js";
import lionSourceImg from "./lion-source.jpg";

/**
 * WireframeLionPlate
 * The lion photo with a triangulated wireframe mesh traced over it: node
 * positions and connections were sampled offline from the photo's edge and
 * texture detail (mane, eyes, jaw, paw), same idea as ParticleTulipHero but
 * structured as a technical-drawing node graph instead of a dust of
 * particles. Nodes drift gently at rest and push away from pointer/touch,
 * with the mesh lines stretching live between them; a handful of
 * high-feature nodes get a bracket marker and a live coordinate readout.
 *
 * Drop this in as <WireframeLionPlate /> — it fills its nearest positioned
 * ancestor.
 */
export default function WireframeLionPlate() {
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

    const featureSet = new Set(LION_MESH.featureNodes);
    const nodes = LION_MESH.nodes.map(([bx, by, score], i) => ({
      bx,
      by,
      score,
      feature: featureSet.has(i),
      phase: Math.random() * Math.PI * 2,
      speed: 0.0002 + Math.random() * 0.00035,
      ampX: 1.2 + Math.random() * 2.4,
      ampY: 1.2 + Math.random() * 2.4,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    }));
    const edges = LION_MESH.edges;

    // ---------- layout: fit the photo's aspect ratio into the container ----------
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let originX = 0;
    let originY = 0;
    let dispW = 1;
    let dispH = 1;

    function getSize() {
      const parent = canvas.parentElement;
      return { w: parent.clientWidth, h: parent.clientHeight };
    }

    function layout() {
      const { w, h } = getSize();
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (w / h > LION_MESH.aspect) {
        dispH = h;
        dispW = h * LION_MESH.aspect;
      } else {
        dispW = w;
        dispH = w / LION_MESH.aspect;
      }
      originX = (w - dispW) / 2;
      originY = (h - dispH) / 2;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x = originX + n.bx * dispW;
        n.y = originY + n.by * dispH;
      }
    }

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(canvas.parentElement);

    // ---------- pointer interaction ----------
    const pointer = { x: -9999, y: -9999, active: false };
    let radius = 90;

    function setPointer(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
      pointer.active = true;
    }
    function onMove(e) {
      setPointer(e.clientX, e.clientY);
    }
    function onLeave() {
      pointer.active = false;
    }

    if (!prefersReduced) {
      canvas.addEventListener("pointermove", onMove, { passive: true });
      canvas.addEventListener("pointerdown", onMove, { passive: true });
      canvas.addEventListener("pointerup", onLeave, { passive: true });
      canvas.addEventListener("pointerleave", onLeave, { passive: true });
    }

    // ---------- animate ----------
    const SPRING = 0.05;
    const DAMPING = 0.86;

    function frame(t) {
      if (destroyed) return;
      const { w, h } = getSize();
      radius = Math.min(w, h) * 0.34;
      const pushStrength = radius * 0.85;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const baseX = originX + n.bx * dispW;
        const baseY = originY + n.by * dispH;

        let targetX = baseX;
        let targetY = baseY;

        if (!prefersReduced) {
          targetX += Math.sin(t * n.speed + n.phase) * n.ampX;
          targetY += Math.cos(t * n.speed * 1.3 + n.phase) * n.ampY;

          if (pointer.active) {
            const dx = n.x - pointer.x;
            const dy = n.y - pointer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius && dist > 0.001) {
              let force = 1 - dist / radius;
              force *= force;
              targetX += (dx / dist) * force * pushStrength;
              targetY += (dy / dist) * force * pushStrength;
            }
          }

          n.vx += (targetX - n.x) * SPRING;
          n.vy += (targetY - n.y) * SPRING;
          n.vx *= DAMPING;
          n.vy *= DAMPING;
          n.x += n.vx;
          n.y += n.vy;
        } else {
          n.x = targetX;
          n.y = targetY;
        }
      }

      // mesh lines
      ctx.strokeStyle = "rgba(230,225,211,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < edges.length; i++) {
        const [a, b] = edges[i];
        const na = nodes[a];
        const nb = nodes[b];
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
      }
      ctx.stroke();

      // nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const r = n.feature ? 2.4 : 1.5;
        ctx.fillStyle = n.feature ? "rgba(210,169,95,0.95)" : "rgba(230,225,211,0.85)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // feature brackets + live coordinate readout
      ctx.font = "9px monospace";
      ctx.fillStyle = "rgba(210,169,95,0.9)";
      ctx.strokeStyle = "rgba(210,169,95,0.55)";
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!n.feature) continue;
        const s = 9;
        ctx.strokeRect(n.x - s, n.y - s, s * 2, s * 2);
        const label = Math.round(n.x - originX) + "," + Math.round(n.y - originY);
        ctx.fillText(label, n.x + s + 3, n.y - s);
      }

      if (!prefersReduced) raf = requestAnimationFrame(frame);
    }

    if (prefersReduced) frame(0);
    else raf = requestAnimationFrame(frame);

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onMove);
      canvas.removeEventListener("pointerup", onLeave);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden" }}>
      <img
        src={lionSourceImg}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.55,
          filter: "saturate(0.85) brightness(0.8)",
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
