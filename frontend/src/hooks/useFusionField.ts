"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";

export type Point = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  opacity: number;
  targetOpacity: number;
  vx: number;
  vy: number;
  size: number;
};

export type FusionFieldOptions = {
  activeModalities: string[];
  reducedMotion?: boolean;
  pattern?: "scatter" | "spiral" | "grid";
};

function createSpiral(width: number, height: number, count: number): Point[] {
  const points: Point[] = [];
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) * 0.42;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = t * Math.PI * 6;
    const radius = t * maxRadius;
    const jitter = (1 - t * 0.6) * 28;

    const x = cx + Math.cos(angle) * radius + (Math.random() - 0.5) * jitter;
    const y = cy + Math.sin(angle) * radius + (Math.random() - 0.5) * jitter;
    points.push({
      x,
      y,
      baseX: x,
      baseY: y,
      opacity: 0.15 + Math.random() * 0.85,
      targetOpacity: 0.15 + Math.random() * 0.85,
      vx: 0,
      vy: 0,
      size: 0.8 + Math.random() * 1.2,
    });
  }

  return points;
}

function createGrid(width: number, height: number, count: number): Point[] {
  const points: Point[] = [];
  const cols = Math.ceil(Math.sqrt(count * (width / height)));
  const rows = Math.ceil(count / cols);
  const gapX = width / (cols + 1);
  const gapY = height / (rows + 1);

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = gapX * (col + 1) + (Math.random() - 0.5) * 14;
    const y = gapY * (row + 1) + (Math.random() - 0.5) * 14;
    points.push({
      x,
      y,
      baseX: x,
      baseY: y,
      opacity: 0.12 + Math.random() * 0.88,
      targetOpacity: 0.12 + Math.random() * 0.88,
      vx: 0,
      vy: 0,
      size: 0.7 + Math.random() * 1.1,
    });
  }

  return points;
}

function createScatter(width: number, height: number, count: number): Point[] {
  const points: Point[] = [];
  const margin = 64;

  for (let i = 0; i < count; i++) {
    const x = margin + Math.random() * (width - margin * 2);
    const y = margin + Math.random() * (height - margin * 2);
    points.push({
      x,
      y,
      baseX: x,
      baseY: y,
      opacity: 0.12 + Math.random() * 0.88,
      targetOpacity: 0.12 + Math.random() * 0.88,
      vx: 0,
      vy: 0,
      size: 0.7 + Math.random() * 1.3,
    });
  }

  return points;
}

export function useFusionField({ activeModalities, reducedMotion = false, pattern = "scatter" }: FusionFieldOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });

  const initialize = useCallback((width: number, height: number) => {
    const area = width * height;
    const density = Math.max(70, Math.min(260, Math.floor(area / 6500)));
    const points =
      pattern === "spiral" ? createSpiral(width, height, density) :
      pattern === "grid" ? createGrid(width, height, density) :
      createScatter(width, height, density);
    pointsRef.current = points;
  }, [pattern]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    sizeRef.current = { width, height, dpr };
    initialize(width, height);
  }, [initialize]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = sizeRef.current;
    ctx.clearRect(0, 0, width, height);

    const active = activeModalities.length > 0;
    const targetOpacityDelta = active ? 0.04 : -0.015;

    for (const point of pointsRef.current) {
      if (!reducedMotion) {
        point.targetOpacity += targetOpacityDelta;
        point.targetOpacity = Math.max(0.1, Math.min(1, point.targetOpacity));

        const dx = mouseRef.current.x - point.x;
        const dy = mouseRef.current.y - point.y;
        const dist = Math.hypot(dx, dy);
        const maxDist = 200;

        if (mouseRef.current.active && dist < maxDist) {
          const force = (1 - dist / maxDist) * 0.16;
          point.vx += (dx / (dist || 1)) * force;
          point.vy += (dy / (dist || 1)) * force;
        }

        point.vx += (point.baseX - point.x) * 0.012;
        point.vy += (point.baseY - point.y) * 0.012;
        point.vx *= 0.84;
        point.vy *= 0.84;
        point.x += point.vx;
        point.y += point.vy;
      }

      point.opacity += (point.targetOpacity - point.opacity) * 0.12;
      ctx.fillStyle = `rgba(255,255,255,${point.opacity.toFixed(3)})`;
      ctx.fillRect(point.x, point.y, point.size, point.size);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [activeModalities, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    resize();
    rafRef.current = requestAnimationFrame(draw);

    const onResize = () => resize();
    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: true,
      };
    };
    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };
    const onTouchMove = (event: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top,
        active: true,
      };
    };
    const onTouchEnd = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("resize", onResize);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [resize, draw]);

  return { canvasRef };
}
