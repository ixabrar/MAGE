"use client";

import { useEffect, useRef } from "react";

const DW = 2962;
const DH = 2160;
const DASP = DW / DH;

const RING = {
  cx: 1484,
  cy: 1108,
  a: 712,
  ratio: 0.492,
  axis: 25.5,
  n: 12,
  tile: 346,
  radius: 0.22,
  dist: 13,
  phase: 93,
};

const DUR = 15.015;

const HEAD = [
  { s: "MAGE", top: 930, w: 1370, fill: "#d0d0d0" },
  { s: "MULTIMODAL AGE-GUIDED ESTIMATION", top: 1114, w: 1775, fill: "#ffffff" },
];

const CAP = 142;
const SMALL = 22;
const SANS = '"Helvetica Neue",Helvetica,"Inter",Arial,system-ui,sans-serif';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

function mkc(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function fitText(
  x: CanvasRenderingContext2D,
  str: string,
  font: string,
  weight: string,
  cap: number,
  cx: number,
  capTop: number,
  targetW: number,
  color: string,
  align?: string
) {
  const probe = 100;
  x.font = `${weight} ${probe}px ${font}`;
  const m = x.measureText("H");
  const capUnit = (m.actualBoundingBoxAscent || 71) / probe;
  const size = cap / capUnit;
  x.font = `${weight} ${size}px ${font}`;
  const mm = x.measureText(str);
  const inkW = (mm.actualBoundingBoxRight || mm.width) + (mm.actualBoundingBoxLeft || 0);
  const sx = targetW ? targetW / inkW : 1;
  x.save();
  x.fillStyle = color;
  x.textBaseline = "alphabetic";
  x.translate(cx, capTop + cap);
  x.scale(sx, 1);
  x.textAlign = (align || "center") as CanvasTextAlign;
  const left = mm.actualBoundingBoxLeft || 0;
  x.fillText(str, align === "left" ? left : 0, 0);
  x.restore();
  return inkW * sx;
}

export default function GalleryHeading() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cv = canvas;
    const x = ctx;

    let W = 0;
    let H = 0;
    let K = 1;
    let OX = 0;
    let OY = 0;
    let headLayer: HTMLCanvasElement | null = null;
    let labelLayer: HTMLCanvasElement | null = null;
    let t0 = performance.now();
    let tNow = 0;
    let playing = true;
    let raf = 0;

    const r = rng(42);
    const grainTile = mkc(128, 128);
    const gtx = grainTile.getContext("2d");
    if (gtx) {
      const img = gtx.createImageData(128, 128);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 128 + (r() - 0.5) * 116;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      gtx.putImageData(img, 0, 0);
    }

    const TS = 512;

    function lin(
      cx: CanvasRenderingContext2D,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      stops: [number, string][]
    ) {
      const g = cx.createLinearGradient(x0 * TS, y0 * TS, x1 * TS, y1 * TS);
      for (let i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
      return g;
    }

    function rad(
      cx: CanvasRenderingContext2D,
      cx2: number,
      cy: number,
      r: number,
      stops: [number, string][],
      r0?: number
    ) {
      const g = cx.createRadialGradient(
        cx2 * TS,
        cy * TS,
        (r0 || 0) * TS,
        cx2 * TS,
        cy * TS,
        r * TS
      );
      for (let i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
      return g;
    }

    function fill(cx: CanvasRenderingContext2D, style: string | CanvasGradient) {
      cx.fillStyle = style;
      cx.fillRect(0, 0, TS, TS);
    }

    function band(
      cx: CanvasRenderingContext2D,
      pts: [number, number][],
      color: string,
      width: number,
      blur: number,
      passes?: number
    ) {
      cx.save();
      cx.translate(-2 * TS, 0);
      cx.shadowOffsetX = 2 * TS;
      cx.shadowBlur = blur * TS;
      cx.shadowColor = color;
      cx.strokeStyle = color;
      cx.lineWidth = width * TS;
      cx.lineCap = "round";
      cx.lineJoin = "round";
      cx.beginPath();
      cx.moveTo(pts[0][0] * TS, pts[0][1] * TS);
      for (let i = 1; i < pts.length - 1; i += 2) {
        cx.quadraticCurveTo(pts[i][0] * TS, pts[i][1] * TS, pts[i + 1][0] * TS, pts[i + 1][1] * TS);
      }
      for (let p = 0; p < (passes || 1); p++) cx.stroke();
      cx.restore();
    }

    function glow(
      cx: CanvasRenderingContext2D,
      cx2: number,
      cy: number,
      r: number,
      color: string,
      mode?: string
    ) {
      cx.save();
      cx.globalCompositeOperation = (mode || "lighter") as GlobalCompositeOperation;
      cx.fillStyle = rad(cx, cx2, cy, r, [[0, color], [1, "rgba(0,0,0,0)"]]);
      cx.fillRect(0, 0, TS, TS);
      cx.restore();
    }

    function spine(y0: number, amp: number, ph: number, tilt: number) {
      const p: [number, number][] = [];
      for (let i = 0; i < 5; i++) {
        const u = -0.12 + i * 0.31;
        p.push([u, y0 + amp * Math.sin(ph + u * 4.2) + tilt * u]);
      }
      return p;
    }

    function wavy(
      cx: CanvasRenderingContext2D,
      y0: number,
      ph: number,
      amp: number,
      freq: number,
      tilt: number
    ) {
      cx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const u = -0.12 + i * 0.124;
        const y = y0 + amp * Math.sin(ph + u * freq) + (tilt || 0) * u;
        if (i === 0) cx.moveTo(u * TS, y * TS);
        else cx.lineTo(u * TS, y * TS);
      }
    }

    function wavyStroke(
      cx: CanvasRenderingContext2D,
      y0: number,
      ph: number,
      amp: number,
      freq: number,
      tilt: number,
      color: string,
      w: number,
      blur: number
    ) {
      cx.save();
      cx.translate(-2 * TS, 0);
      cx.shadowOffsetX = 2 * TS;
      cx.shadowBlur = blur * TS;
      cx.shadowColor = color;
      cx.strokeStyle = color;
      cx.lineWidth = w * TS;
      cx.lineCap = "round";
      wavy(cx, y0, ph, amp, freq, tilt);
      cx.stroke();
      cx.stroke();
      cx.restore();
    }

    function bandPath(
      cx: CanvasRenderingContext2D,
      y0: number,
      h: number,
      ph: number,
      amp: number,
      freq: number,
      tilt: number
    ) {
      cx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const u = -0.12 + i * 0.124;
        cx.lineTo(u * TS, (y0 + amp * Math.sin(ph + u * freq) + tilt * u) * TS);
      }
      for (let i = 10; i >= 0; i--) {
        const u = -0.12 + i * 0.124;
        cx.lineTo(
          u * TS,
          (y0 + h + amp * 0.62 * Math.sin(ph + 1.9 + u * freq * 0.86) + tilt * u) * TS
        );
      }
      cx.closePath();
    }

    function chrome(
      cx: CanvasRenderingContext2D,
      y0: number,
      h: number,
      ph: number,
      amp: number,
      freq: number,
      tilt: number,
      hot: string
    ) {
      cx.save();
      cx.translate(-2 * TS, 0);
      cx.shadowOffsetX = 2 * TS;
      cx.shadowBlur = 0.06 * TS;
      cx.shadowColor = "rgba(132,12,0,0.9)";
      cx.fillStyle = "#000";
      bandPath(cx, y0 - 0.018, h + 0.036, ph, amp, freq, tilt);
      cx.fill();
      cx.fill();
      cx.restore();

      cx.save();
      bandPath(cx, y0, h, ph, amp, freq, tilt);
      cx.clip();
      const g = cx.createLinearGradient(0, (y0 - 0.03) * TS, 0, (y0 + h + 0.03) * TS);
      g.addColorStop(0, "rgba(8,0,2,1)");
      g.addColorStop(0.12, "rgba(58,2,6,1)");
      g.addColorStop(0.3, "rgba(146,10,8,1)");
      g.addColorStop(0.43, "rgba(220,42,16,1)");
      g.addColorStop(0.49, hot);
      g.addColorStop(0.56, "rgba(206,28,12,1)");
      g.addColorStop(0.72, "rgba(90,4,6,1)");
      g.addColorStop(0.88, "rgba(26,0,4,1)");
      g.addColorStop(1, "rgba(5,0,2,1)");
      cx.fillStyle = g;
      cx.fillRect(0, 0, TS, TS);
      cx.restore();

      wavyStroke(cx, y0 + 0.004, ph, amp, freq, tilt, "rgba(255,238,214,0.55)", 0.005, 0.004);
      wavyStroke(
        cx,
        y0 + h - 0.006,
        ph + 1.9,
        amp * 0.62,
        freq * 0.86,
        tilt,
        "rgba(40,220,200,0.42)",
        0.008,
        0.009
      );
      wavyStroke(
        cx,
        y0 + h + 0.012,
        ph + 1.9,
        amp * 0.62,
        freq * 0.86,
        tilt,
        "rgba(170,230,80,0.28)",
        0.006,
        0.008
      );
    }

    function shade(cx: CanvasRenderingContext2D, x0: number, x1: number, strength: number) {
      cx.save();
      const g = cx.createLinearGradient(x0 * TS, 0, x1 * TS, 0);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.55, `rgba(0,0,0,${(strength * 0.7).toFixed(2)})`);
      g.addColorStop(1, `rgba(0,0,0,${strength.toFixed(2)})`);
      cx.fillStyle = g;
      cx.fillRect(0, 0, TS, TS);
      cx.restore();
    }

    const ART = [
      function (cx: CanvasRenderingContext2D) {
        fill(
          cx,
          rad(cx, 0.5, 0.48, 0.82, [
            [0, "#020105"],
            [0.3, "#030106"],
            [0.37, "#1d0a48"],
            [0.46, "#4f2c94"],
            [0.54, "#38167e"],
            [0.66, "#22084e"],
            [0.86, "#0a0218"],
            [1, "#04010a"],
          ])
        );
        glow(cx, 0.3, 0.24, 0.4, "rgba(96,66,180,0.4)");
        glow(cx, 0.76, 0.8, 0.3, "rgba(52,18,110,0.35)");
      },
      function (cx: CanvasRenderingContext2D) {
        fill(cx, "#fbf9fb");
        band(cx, spine(0.52, 0.09, 0.6, -0.18), "rgba(236,44,140,0.92)", 0.19, 0.055, 2);
        band(cx, spine(0.66, 0.07, 2.2, -0.14), "rgba(255,96,26,0.9)", 0.16, 0.05, 2);
        band(cx, spine(0.4, 0.06, 3.4, -0.1), "rgba(70,120,255,0.55)", 0.09, 0.05, 1);
        band(cx, spine(0.58, 0.08, 1.2, -0.16), "rgba(255,255,255,0.9)", 0.05, 0.03, 2);
        band(cx, spine(0.86, 0.05, 0.2, -0.05), "rgba(150,40,200,0.5)", 0.1, 0.06, 1);
        glow(cx, 0.22, 0.14, 0.46, "rgba(255,255,255,0.85)");
      },
      function (cx: CanvasRenderingContext2D) {
        fill(
          cx,
          lin(cx, 0.98, 0, 0.06, 1, [
            [0, "#01020e"],
            [0.3, "#03082e"],
            [0.56, "#0820c4"],
            [0.76, "#1a4dff"],
            [0.95, "#7ea8ff"],
            [1, "#b6ccff"],
          ])
        );
        glow(cx, 0.2, 0.86, 0.3, "rgba(176,206,255,0.8)");
        glow(cx, 0.06, 0.98, 0.22, "rgba(226,120,220,0.55)");
        glow(cx, 0.92, 0.06, 0.44, "rgba(0,0,8,0.75)", "source-over");
      },
      function (cx: CanvasRenderingContext2D) {
        fill(
          cx,
          lin(cx, 0.08, 0, 0, 1, [
            [0, "#9dbccd"],
            [0.14, "#5b87ad"],
            [0.26, "#245693"],
            [0.36, "#7793a8"],
            [0.45, "#e2523a"],
            [0.52, "#e07a5e"],
            [0.58, "#82aec8"],
            [0.68, "#2467a8"],
            [0.8, "#0e3970"],
            [0.92, "#081c40"],
            [1, "#051026"],
          ])
        );
        band(cx, spine(0.42, 0.02, 1.0, 0.03), "rgba(240,140,105,0.45)", 0.05, 0.03, 1);
        band(cx, spine(0.63, 0.02, 2.4, -0.03), "rgba(150,200,235,0.4)", 0.05, 0.03, 1);
      },
      function (cx: CanvasRenderingContext2D) {
        fill(
          cx,
          lin(cx, 0.88, 0.04, 0.14, 0.96, [
            [0, "#010103"],
            [0.34, "#030316"],
            [0.58, "#0d066a"],
            [0.78, "#2a10b8"],
            [0.93, "#5a38e0"],
            [1, "#8464f4"],
          ])
        );
        glow(cx, 0.14, 0.92, 0.3, "rgba(110,86,210,0.55)");
        glow(cx, 0.9, 0.08, 0.42, "rgba(0,0,4,0.75)", "source-over");
      },
      function (cx: CanvasRenderingContext2D) {
        fill(cx, "#020104");
        band(cx, spine(0.46, 0.07, 1.4, -0.1), "rgba(88,30,18,0.7)", 0.24, 0.13, 2);
        band(cx, spine(0.44, 0.07, 1.4, -0.1), "rgba(168,64,36,0.45)", 0.08, 0.07, 1);
        glow(cx, 0.16, 0.2, 0.32, "rgba(20,30,64,0.35)");
        glow(cx, 0.9, 0.88, 0.22, "rgba(70,64,110,0.3)");
      },
      function (cx: CanvasRenderingContext2D) {
        fill(cx, "#e3dcec");
        band(cx, spine(0.42, 0.1, 2.6, 0.16), "rgba(132,58,220,0.9)", 0.18, 0.055, 2);
        band(cx, spine(0.6, 0.09, 1.1, 0.2), "rgba(240,104,20,0.92)", 0.16, 0.05, 2);
        band(cx, spine(0.5, 0.09, 2.0, 0.18), "rgba(245,40,140,0.65)", 0.1, 0.045, 1);
        band(cx, spine(0.55, 0.09, 1.6, 0.18), "rgba(255,255,255,0.8)", 0.04, 0.03, 2);
        glow(cx, 0.82, 0.94, 0.36, "rgba(255,255,255,0.7)");
        glow(cx, 0.08, 0.08, 0.26, "rgba(60,40,110,0.4)", "source-over");
      },
      function (cx: CanvasRenderingContext2D) {
        fill(cx, "#12030a");
        glow(cx, 0.02, 0.04, 0.42, "rgba(255,142,36,0.85)");
        glow(cx, 0.5, 0.5, 0.62, "rgba(178,26,14,0.8)");
        chrome(cx, 0.18, 0.58, 1.1, 0.07, 4.2, -0.1, "rgba(255,216,158,1)");
        shade(cx, 0.55, 1.2, 0.45);
        glow(cx, 0.94, 0.94, 0.3, "rgba(60,14,96,0.45)");
      },
      function (cx: CanvasRenderingContext2D) {
        fill(cx, "#040103");
        glow(cx, 0.4, 0.46, 0.5, "rgba(48,14,10,0.8)");
        chrome(cx, 0.3, 0.44, 2.4, 0.06, 4.8, 0.1, "rgba(255,190,110,1)");
        shade(cx, 0.3, 1.15, 0.72);
        band(cx, spine(0.9, 0.05, 0.4, 0.1), "rgba(70,16,110,0.45)", 0.12, 0.08, 1);
      },
      function (cx: CanvasRenderingContext2D) {
        fill(
          cx,
          lin(cx, 0.4, 0, 0.6, 1, [
            [0, "#03040e"],
            [0.42, "#060a22"],
            [0.72, "#070412"],
            [1, "#030106"],
          ])
        );
        glow(cx, 0.28, 0.14, 0.42, "rgba(18,32,84,0.55)");
        chrome(cx, 0.6, 0.3, 0.9, 0.05, 3.8, -0.08, "rgba(255,198,120,1)");
        shade(cx, 0.3, 1.1, 0.8);
      },
      function (cx: CanvasRenderingContext2D) {
        fill(cx, "#050208");
        chrome(cx, 0.02, 0.34, 2.0, 0.045, 4.4, -0.07, "rgba(255,206,132,1)");
        shade(cx, 0.45, 1.1, 0.7);
        cx.save();
        cx.beginPath();
        cx.moveTo(0, TS * 0.72);
        cx.lineTo(TS, TS * 0.56);
        cx.lineTo(TS, TS);
        cx.lineTo(0, TS);
        cx.closePath();
        cx.clip();
        fill(cx, lin(cx, 0, 0.5, 0.4, 1, [[0, "#cfd6dc"], [0.6, "#e8eaee"], [1, "#f4f5f7"]]));
        band(cx, spine(0.7, 0.03, 1.0, -0.1), "rgba(245,44,96,0.8)", 0.055, 0.03, 2);
        band(cx, spine(0.76, 0.03, 1.6, -0.1), "rgba(30,146,245,0.75)", 0.045, 0.026, 2);
        band(cx, spine(0.82, 0.03, 2.2, -0.08), "rgba(245,130,54,0.5)", 0.035, 0.026, 1);
        cx.restore();
      },
      function (cx: CanvasRenderingContext2D) {
        fill(cx, "#08050a");
        for (let i = 0; i < 9; i++) {
          const y0 = 0.06 + i * 0.045;
          const a = 0.8 - i * 0.06;
          band(
            cx,
            spine(y0, 0.02, 0.4 + i * 0.5, -0.2),
            `rgba(${250 - i * 3},${30 + i * 15},${80 + i * 5},${a.toFixed(2)})`,
            0.032,
            0.018,
            2
          );
        }
        band(cx, spine(0.28, 0.02, 1.2, -0.18), "rgba(255,120,72,0.55)", 0.05, 0.035, 1);
        band(cx, spine(0.14, 0.02, 2.4, -0.2), "rgba(120,190,255,0.4)", 0.03, 0.02, 1);
        cx.save();
        cx.beginPath();
        cx.moveTo(0, TS * 0.72);
        cx.lineTo(TS, TS * 0.4);
        cx.lineTo(TS, TS);
        cx.lineTo(0, TS);
        cx.closePath();
        cx.clip();
        fill(cx, lin(cx, 0.1, 0.4, 0.6, 1, [[0, "#c6c7cd"], [0.5, "#e2e2e6"], [1, "#f2f2f4"]]));
        cx.restore();
      },
    ];

    function buildTextures() {
      const front: HTMLCanvasElement[] = [];
      const back: HTMLCanvasElement[] = [];
      for (let i = 0; i < ART.length; i++) {
        const c = mkc(TS, TS);
        const cx2 = c.getContext("2d");
        if (cx2) {
          ART[i](cx2);
          cx2.save();
          cx2.globalCompositeOperation = "overlay";
          cx2.globalAlpha = 0.15;
          const p = cx2.createPattern(grainTile, "repeat");
          if (p) {
            cx2.fillStyle = p;
            cx2.fillRect(0, 0, TS, TS);
          }
          cx2.restore();
        }
        front.push(c);

        const d = mkc(TS, TS);
        const y = d.getContext("2d");
        if (y && c) {
          y.drawImage(c, 0, 0);
          y.globalCompositeOperation = "saturation";
          y.fillStyle = "rgba(128,128,128,0.2)";
          y.fillRect(0, 0, TS, TS);
          y.globalCompositeOperation = "multiply";
          y.fillStyle = "rgba(6,8,18,0.75)";
          y.fillRect(0, 0, TS, TS);
        }
        back.push(d);
      }
      return { front, back };
    }

    const TEX = buildTextures();

    const ax = (RING.axis * Math.PI) / 180;
    const cf = RING.ratio;
    const sf = Math.sqrt(1 - cf * cf);
    const U = [Math.cos(ax), Math.sin(ax), 0];
    const V = [-Math.sin(ax) * cf, Math.cos(ax) * cf, sf];
    const AXIS = [
      U[1] * V[2] - U[2] * V[1],
      U[2] * V[0] - U[0] * V[2],
      U[0] * V[1] - U[1] * V[0],
    ];

    function d2sx(dx: number) {
      return OX + dx * K;
    }
    function d2sy(dy: number) {
      return OY + dy * K;
    }

    function buildHead() {
      headLayer = mkc(Math.max(1, W), Math.max(1, H));
      const hx = headLayer.getContext("2d");
      if (!hx) return;
      for (let i = 0; i < HEAD.length; i++) {
        const h = HEAD[i];
        fitText(hx, h.s, SANS, "700", CAP * K, d2sx(1481), d2sy(h.top), h.w * K, h.fill);
      }
    }

    function buildLabels() {
      labelLayer = mkc(Math.max(1, W), Math.max(1, H));
      const lx = labelLayer.getContext("2d");
      if (!lx) return;
      const cap = SMALL * K;
      const dim = "#b0b0b0";
      const pad = 88 * K;
      lx.save();
      lx.fillStyle = dim;
      lx.textBaseline = "alphabetic";
      lx.textAlign = "left";
      const f = `400 ${cap / 0.717}px ${SANS}`;
      lx.font = f;
      if (lx.letterSpacing !== undefined) lx.letterSpacing = `${0.03 * cap}px`;
      lx.fillText("VOID BLUE   /   GRADIENT STRIPS   /   RED AURA", pad, pad + cap);
      lx.fillText("2026", pad, H - pad);
      lx.textAlign = "right";
      lx.fillText("MAGE.SUPPLY", W - pad, H - pad);
      lx.restore();

      const pitch = 33 * K;
      const L = ["(3) Modalities", "Face / Hand / Blood", "Fusion Ready"];
      for (let i = 0; i < L.length; i++)
        fitText(lx, L[i], SANS, "500", cap, d2sx(344), d2sy(1148) + i * pitch, 0, "#ffffff", "left");
      const Rt = ["Multimodal", "Biological Age", "Estimation"];
      for (let j = 0; j < Rt.length; j++)
        fitText(
          lx,
          Rt[j],
          SANS,
          "500",
          cap,
          d2sx(2310),
          d2sy(932) + j * 32.5 * K,
          0,
          "#ffffff",
          "left"
        );
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.round(window.innerWidth * dpr);
      H = Math.round(window.innerHeight * dpr);
      cv.width = W;
      cv.height = H;
      const S = Math.min(W, H * DASP);
      K = S / DW;
      OX = (W - DW * K) / 2;
      OY = (H - DH * K) / 2;
      buildHead();
      buildLabels();
    }

    function project(p: [number, number, number]) {
      const k = (RING.a * K * RING.dist) / (RING.dist - p[2]);
      return [d2sx(RING.cx) + k * p[0], d2sy(RING.cy) + k * p[1], k];
    }

    function drawTile(i: number, psi: number) {
      const c = Math.cos(psi);
      const s = Math.sin(psi);
      const C = [c * U[0] + s * V[0], c * U[1] + s * V[1], c * U[2] + s * V[2]];
      const T = [-s * U[0] + c * V[0], -s * U[1] + c * V[1], -s * U[2] + c * V[2]];
      const h = RING.tile / (2 * RING.a);
      const p0 = project([C[0], C[1], C[2]]);
      const pT = project([C[0] + T[0] * h, C[1] + T[1] * h, C[2] + T[2] * h]);
      const pA = project([C[0] + AXIS[0] * h, C[1] + AXIS[1] * h, C[2] + AXIS[2] * h]);
      const ex = pT[0] - p0[0];
      const ey = pT[1] - p0[1];
      const fx = pA[0] - p0[0];
      const fy = pA[1] - p0[1];
      if (Math.abs(ex * fy - ey * fx) < 0.4) return;

      const facing = C[2] > 0;
      const img = (facing ? TEX.front : TEX.back)[i % TEX.front.length];
      x.save();
      x.setTransform((ex * 2) / TS, (ey * 2) / TS, (fx * 2) / TS, (fy * 2) / TS, p0[0], p0[1]);
      x.beginPath();
      x.moveTo(-TS / 2 + RING.radius * TS, -TS / 2);
      x.lineTo(TS / 2 - RING.radius * TS, -TS / 2);
      x.quadraticCurveTo(TS / 2, -TS / 2, TS / 2, -TS / 2 + RING.radius * TS);
      x.lineTo(TS / 2, TS / 2 - RING.radius * TS);
      x.quadraticCurveTo(TS / 2, TS / 2, TS / 2 - RING.radius * TS, TS / 2);
      x.lineTo(-TS / 2 + RING.radius * TS, TS / 2);
      x.quadraticCurveTo(-TS / 2, TS / 2, -TS / 2, TS / 2 - RING.radius * TS);
      x.lineTo(-TS / 2, -TS / 2 + RING.radius * TS);
      x.quadraticCurveTo(-TS / 2, -TS / 2, -TS / 2 + RING.radius * TS, -TS / 2);
      x.closePath();
      x.clip();
      x.drawImage(img, -TS / 2, -TS / 2, TS, TS);
      x.restore();
      x.setTransform(1, 0, 0, 1, 0, 0);
    }

    function render(t: number) {
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.fillStyle = "#000";
      x.fillRect(0, 0, W, H);
      x.imageSmoothingQuality = "high";

      const spin = (t / DUR) * Math.PI * 2;
      const list: { i: number; psi: number; z: number }[] = [];
      for (let i = 0; i < RING.n; i++) {
        const psi = (RING.phase * Math.PI) / 180 - (i * 2 * Math.PI) / RING.n + spin;
        const c = Math.cos(psi);
        const s = Math.sin(psi);
        list.push({ i, psi, z: c * U[2] + s * V[2] });
      }
      list.sort((a, b) => a.z - b.z);

      let drawnText = false;
      for (let i = 0; i < list.length; i++) {
        if (!drawnText && list[i].z > 0) {
          if (headLayer) x.drawImage(headLayer, 0, 0);
          drawnText = true;
        }
        drawTile(list[i].i, list[i].psi);
      }
      if (!drawnText && headLayer) x.drawImage(headLayer, 0, 0);
      if (labelLayer) x.drawImage(labelLayer, 0, 0);
    }

    function frame(now: number) {
      if (playing) {
        tNow = ((now - t0) / 1000) % DUR;
        render(tNow);
      }
      raf = requestAnimationFrame(frame);
    }

    let hoverPause = false;

    function onPointerEnter() {
      hoverPause = false;
      const elapsed = ((performance.now() - t0) / 1000) % DUR;
      t0 = performance.now() - elapsed * 1000;
      playing = true;
    }

    function onPointerLeave() {
      hoverPause = true;
      const elapsed = ((performance.now() - t0) / 1000) % DUR;
      t0 = performance.now() - elapsed * 1000;
      playing = false;
      render(tNow);
    }

    resize();
    window.addEventListener("resize", () => {
      resize();
      render(tNow);
    });
    container?.addEventListener("pointerenter", onPointerEnter);
    container?.addEventListener("pointerleave", onPointerLeave);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      container?.removeEventListener("pointerenter", onPointerEnter);
      container?.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-black"
      style={{ height: "clamp(320px, 60vh, 860px)" }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
