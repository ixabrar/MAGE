"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

export interface ConstellationFieldHandle {
  triggerExplosion: (x: number, y: number) => void;
}

export const ConstellationField = forwardRef<ConstellationFieldHandle>(function ConstellationField(props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    triggerExplosion: (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const canvasX = (x - rect.left) * dpr;
      const canvasY = (y - rect.top) * dpr;

      const explosions = (canvas as any).__mageExplosions || [];
      explosions.push({ x: canvasX, y: canvasY, radius: 0, life: 1 });
      (canvas as any).__mageExplosions = explosions;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cvs = canvas;
    const cx = ctx;
    (canvas as any).__mageExplosions = [];

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      cvs.width = width * dpr;
      cvs.height = height * dpr;
      cvs.style.width = `${width}px`;
      cvs.style.height = `${height}px`;
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    const numPaths = 30;
    const paths: {
      isLeft: boolean;
      startY: number;
      particles: { t: number; speed: number }[];
    }[] = [];

    for (let i = 0; i < numPaths; i++) {
      paths.push({
        isLeft: i % 2 === 0,
        startY: (i / numPaths) * height * 1.4 - height * 0.2,
        particles: [
          {
            t: Math.random(),
            speed: 0.00001 + Math.random() * 0.00002,
          },
        ],
      });
    }

    function getBezierPoint(
      t: number,
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number }
    ) {
      const u = 1 - t;
      return {
        x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
        y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
      };
    }

    function render() {
      cx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      const explosions = (canvas as any).__mageExplosions || [];
      explosions.forEach((exp: { x: number; y: number; radius: number; life: number }) => {
        exp.radius += 3;
        exp.life -= 0.005;
      });
      (canvas as any).__mageExplosions = explosions.filter((exp: { life: number }) => exp.life > 0);

      paths.forEach((path) => {
        const p0 = { x: path.isLeft ? 0 : width, y: path.startY };
        const p1 = {
          x: path.isLeft ? centerX * 0.5 : width - centerX * 0.5,
          y: path.startY,
        };
        const p2 = {
          x: path.isLeft ? centerX * 0.8 : width - centerX * 0.8,
          y: centerY,
        };
        const p3 = { x: centerX, y: centerY };

        cx.beginPath();
        cx.moveTo(p0.x, p0.y);
        cx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        cx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        cx.lineWidth = 1.2;
        cx.setLineDash([1, 4]);
        cx.stroke();
        cx.setLineDash([]);

        path.particles.forEach((p) => {
          p.t += p.speed;
          if (p.t > 1) {
            p.t = 0;
            path.startY += (Math.random() - 0.5) * 10;
          }

          const pos = getBezierPoint(p.t, p0, p1, p2, p3);
          let dxTotal = 0;
          let dyTotal = 0;
          explosions.forEach((exp: { x: number; y: number; radius: number; life: number }) => {
            const dx = pos.x - exp.x;
            const dy = pos.y - exp.y;
            const dist = Math.hypot(dx, dy);
            if (dist < exp.radius + 120 && dist > exp.radius - 120) {
              const force = (1 - Math.abs(dist - exp.radius) / 120) * exp.life;
              dxTotal += (dx / dist) * force * 80;
              dyTotal += (dy / dist) * force * 80;
            }
          });

          cx.fillStyle = "rgba(255, 255, 255, 0.7)";
          cx.fillRect(pos.x - 1.5, pos.y - 1.5, 3, 3);
        });
      });

      requestAnimationFrame(render);
    }

    let paused = false;
    let raf = 0;
    const onVisibility = () => {
      paused = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    function loop() {
      if (!paused) render();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 h-full w-full"
      style={{ pointerEvents: "auto" }}
    />
  );
});

export default ConstellationField;
