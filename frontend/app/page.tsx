"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ConstellationField } from "@/components/effects/ConstellationField";
import GalleryHeading from "@/components/effects/GalleryHeading";
import PortalFieldCollection from "@/components/effects/PortalFieldCollection";
import HowItWorks from "@/components/sections/HowItWorks";
import FusionLayer from "@/components/sections/FusionLayer";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const modalities = [
  {
    id: "face",
    label: "Face",
    description: "Visual aging signal from facial features.",
    inputType: "Camera / Upload",
    status: "AGE-RELATED SIGNAL",
  },
  {
    id: "dorsal_hand",
    label: "Dorsal Hand",
    description: "Hand-aging characteristics from dorsal imaging.",
    inputType: "Camera / Upload",
    status: "AGE-RELATED SIGNAL",
  },
  {
    id: "blood",
    label: "Blood",
    description: "Blood-derived laboratory features.",
    inputType: "PDF / Image",
    status: "BLOOD-DERIVED SIGNAL",
  },
] as const;

type ModalityId = (typeof modalities)[number]["id"];

const modalityOrder: ModalityId[] = ["face", "dorsal_hand", "blood"];

function buildPanelState(active: ModalityId[]) {
  const map = new Map<ModalityId, string>();
  for (const id of modalityOrder) {
    map.set(id, active.includes(id) ? "ACTIVE" : "NOT SELECTED");
  }

  let fusion = "READY";
  if (active.length === 1) {
    fusion = `${active[0].replace("_", " ").toUpperCase()} ONLY`;
  } else if (active.length === 0) {
    fusion = "IDLE";
  }

  return { map, fusion };
}

export default function Home() {
  const [activeModalities, setActiveModalities] = useState<ModalityId[]>(["face", "dorsal_hand", "blood"]);
  const panel = useMemo(() => buildPanelState(activeModalities), [activeModalities]);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLDivElement | null>(null);
  const fieldRef = useRef<{ triggerExplosion: (x: number, y: number) => void } | null>(null);
  const audioRef = useRef<{ playClick: () => void } | null>(null);

  const handleHeroClick = (event: React.MouseEvent<HTMLDivElement>) => {
    fieldRef.current?.triggerExplosion(event.clientX, event.clientY);
    audioRef.current?.playClick();
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1200;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    audioRef.current = {
      playClick: () => {
        const t = ctx.currentTime;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      },
    };

    const hero = heroRef.current;
    if (!hero) return;

    const elements = hero.querySelectorAll("[data-animate]");
    gsap.fromTo(
      elements,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.1,
      }
    );

    return () => {
      ctx.close().catch(() => {});
    };
  }, []);

  const playClick = () => {
    audioRef.current?.playClick();
  };

  const toggle = (id: ModalityId) => {
    playClick();
    setActiveModalities((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  return (
    <div className="relative min-h-screen bg-black text-white" suppressHydrationWarning>
      {/* Global background */}
      <div className="fixed inset-0 z-0">
        <PortalFieldCollection />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" aria-hidden="true" />
      </div>

      {/* Hero */}
      <section className="relative z-10">
        <div className="absolute inset-0 z-0">
          <ConstellationField ref={fieldRef} />
        </div>
        <div
          ref={heroSectionRef}
          onClick={handleHeroClick}
          className="relative mx-auto flex min-h-screen max-w-7xl flex-col"
        >
          {/* Nav */}
          <nav className="flex items-center justify-between px-6 py-6 sm:px-10 lg:px-16">
            <div className="flex items-center gap-3">
              <span className="flex h-4 w-4 grid-cols-2 grid-rows-2 gap-[2px]" aria-hidden="true">
                <span className="col-span-2 h-[2px] w-full bg-white" />
                <span className="h-[2px] w-full bg-white" />
                <span className="h-[2px] w-full bg-white" />
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "18px",
                  lineHeight: 1,
                  letterSpacing: "0px",
                  color: "#ffffff",
                }}
              >
                MAGE
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="/dashboard"
                className="transition-colors duration-150 hover:text-white"
                style={{
                  fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                  fontSize: "16px",
                  fontWeight: 460,
                  lineHeight: 1.5,
                  letterSpacing: "0px",
                  color: "#bcbac9",
                }}
              >
                Dashboard
              </a>
              <a
                href="/assessment"
                className="transition-colors duration-150 hover:text-white"
                style={{
                  fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                  fontSize: "16px",
                  fontWeight: 460,
                  lineHeight: 1.5,
                  letterSpacing: "0px",
                  color: "#bcbac9",
                }}
              >
                Assessment
              </a>
              <a
                href="/history"
                className="transition-colors duration-150 hover:text-white"
                style={{
                  fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                  fontSize: "16px",
                  fontWeight: 460,
                  lineHeight: 1.5,
                  letterSpacing: "0px",
                  color: "#bcbac9",
                }}
              >
                History
              </a>
              <a
                href="/privacy"
                className="transition-colors duration-150 hover:text-white"
                style={{
                  fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                  fontSize: "16px",
                  fontWeight: 460,
                  lineHeight: 1.5,
                  letterSpacing: "0px",
                  color: "#bcbac9",
                }}
              >
                Privacy
              </a>
              <a
                href="/assessment"
                className="rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-150"
                style={{
                  fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                  fontSize: "16px",
                  fontWeight: 700,
                  lineHeight: 1.0,
                  letterSpacing: "0px",
                  background: "#c9b4fa",
                  color: "#1b1938",
                }}
              >
                Start assessment
              </a>
            </div>
          </nav>

          {/* Hero content */}
          <div ref={heroRef} className="flex flex-1 flex-col justify-center px-6 pb-16 pt-28 sm:px-10 lg:px-16">
            <div className="flex flex-col items-start gap-6 md:max-w-2xl">
              <div>
                <p
                  data-animate
                  className="text-white/70"
                  style={{
                    fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    lineHeight: 1.0,
                    letterSpacing: "1.8px",
                    textTransform: "uppercase",
                  }}
                >
                  Multimodal biological age
                </p>

                <h1
                  data-animate
                  className="mt-6"
                  style={{
                    fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                    fontSize: "clamp(38px, 5.2vw, 64px)",
                    fontWeight: 540,
                    lineHeight: 0.96,
                    letterSpacing: "0px",
                    color: "#ffffff",
                    maxWidth: "18ch",
                  }}
                >
                  One estimate.
                  <span className="block" style={{ color: "#bcbac9" }}>Multiple biological signals.</span>
                  <span className="block">One fusion layer.</span>
                </h1>

                <p
                  data-animate
                  className="mt-8"
                  style={{
                    fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                    fontSize: "18px",
                    fontWeight: 540,
                    lineHeight: 1.5,
                    letterSpacing: "-0.135px",
                    color: "#bcbac9",
                    maxWidth: "52ch",
                  }}
                >
                  MAGE combines available biological signals from facial, dorsal-hand, and blood-derived data through a
                  modality-aware fusion architecture.
                </p>

                <div data-animate className="mt-10 flex flex-col items-start gap-3">
                  <motion.a
                    href="/assessment"
                    className="inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-semibold"
                    style={{
                      fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                      fontSize: "16px",
                      fontWeight: 700,
                      lineHeight: 1.0,
                      letterSpacing: "0px",
                      background: "#c9b4fa",
                      color: "#1b1938",
                    }}
                    whileHover={{ backgroundColor: "#d4c2fb" }}
                    transition={{ duration: 0.12 }}
                  >
                    Start an assessment
                  </motion.a>
                  <a
                    href="/fusion"
                    className="inline-flex items-center justify-center rounded-md border border-white/35 px-6 py-3 text-base font-semibold text-white transition-colors duration-150 hover:border-white hover:bg-white/10"
                    style={{
                      fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                      fontSize: "16px",
                      fontWeight: 700,
                      lineHeight: 1.0,
                      letterSpacing: "0px",
                    }}
                  >
                    Explore the fusion layer
                  </a>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {modalities.map((modality) => {
                  const isActive = activeModalities.includes(modality.id);
                  return (
                    <button
                      key={modality.id}
                      onClick={() => toggle(modality.id)}
                      className="rounded-full border px-4 py-1.5 transition-colors duration-150"
                      style={{
                        fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                        fontSize: "14px",
                        fontWeight: 600,
                        lineHeight: 1.0,
                        letterSpacing: "0px",
                        borderColor: isActive ? "#3f3a52" : "transparent",
                        color: isActive ? "#ffffff" : "#bcbac9",
                        background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                      }}
                    >
                      {modality.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="hidden md:flex items-end justify-between"
              style={{
                fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                fontSize: "12px",
                fontWeight: 540,
                lineHeight: 1.4,
                letterSpacing: "0px",
                color: "#bcbac9",
              }}
            >
              <div className="flex items-center gap-8">
                <div>
                  <span className="block text-white" style={{ fontSize: "20px", fontWeight: 540 }}>
                    3
                  </span>
                  <span className="mt-1 block">Modalities</span>
                </div>
                <div>
                  <span className="block text-white" style={{ fontSize: "20px", fontWeight: 540 }}>
                    {Math.pow(2, 3) - 1}
                  </span>
                  <span className="mt-1 block">Combinations</span>
                </div>
                <div>
                  <span className="block text-white" style={{ fontSize: "20px", fontWeight: 540 }}>
                    1
                  </span>
                  <span className="mt-1 block">Fusion layer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body sections */}
      <main suppressHydrationWarning className="relative z-10">
        {/* Modalities section */}
        <section className="relative py-24 bg-black" suppressHydrationWarning>
          <div className="absolute inset-x-0 top-0 h-32 bg-fade-top pointer-events-none" aria-hidden="true" />
          <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 relative z-10">
            <h2
              className="text-4xl font-medium tracking-tight"
              style={{
                fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                fontSize: "48px",
                fontWeight: 460,
                lineHeight: 0.96,
                letterSpacing: "-1.32px",
                color: "#ffffff",
              }}
            >
              Modalities
            </h2>
            <p
              className="mt-6 max-w-2xl text-lg"
              style={{
                fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                fontSize: "18px",
                fontWeight: 540,
                lineHeight: 1.5,
                letterSpacing: "-0.135px",
                color: "#bcbac9",
              }}
            >
              Each modality contributes an independent biological signal. The fusion layer adapts to whichever
              combination is available at assessment time.
            </p>

            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {modalities.map((modality) => (
                <div
                  key={modality.id}
                  className="rounded-xl border p-8"
                  style={{
                    background: "#000000",
                    borderColor: "#3f3a52",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  <h3
                    className="text-xl font-medium"
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "22px",
                      fontWeight: 460,
                      lineHeight: 1.1,
                      letterSpacing: "-0.315px",
                      color: "#ffffff",
                    }}
                  >
                    {modality.label}
                  </h3>
                  <p
                    className="mt-3 text-base"
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "16px",
                      fontWeight: 460,
                      lineHeight: 1.5,
                      letterSpacing: "0px",
                      color: "#bcbac9",
                    }}
                  >
                    {modality.description}
                  </p>
                  <p
                    className="mt-4 text-sm"
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "14px",
                      fontWeight: 460,
                      lineHeight: 1.4,
                      letterSpacing: "0px",
                      color: "#5a5772",
                    }}
                  >
                    {modality.inputType}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery / signature visual */}
        <section className="relative bg-black" suppressHydrationWarning>
          <div className="absolute inset-x-0 top-0 h-32 bg-fade-top pointer-events-none" aria-hidden="true" />
          <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 relative z-10">
            <GalleryHeading />
          </div>
        </section>

        {/* How MAGE works */}
        <HowItWorks />

        {/* Fusion layer */}
        <FusionLayer />

        {/* Security and privacy */}
        <section className="relative py-24 bg-black" suppressHydrationWarning>
          <div className="absolute inset-x-0 top-0 h-32 bg-fade-top pointer-events-none" aria-hidden="true" />
          <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 relative z-10">
            <h2
              className="text-4xl font-medium tracking-tight"
              style={{
                fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                fontSize: "48px",
                fontWeight: 460,
                lineHeight: 0.96,
                letterSpacing: "-1.32px",
                color: "#ffffff",
              }}
            >
              Security and privacy
            </h2>
            <p
              className="mt-6 max-w-2xl text-lg"
              style={{
                fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                fontSize: "18px",
                fontWeight: 540,
                lineHeight: 1.5,
                letterSpacing: "-0.135px",
                color: "#bcbac9",
              }}
            >
              Sensitive inputs are protected by design. MAGE separates identity from biometric data, records auditable
              actions, and keeps raw files out of ordinary frontend flows.
            </p>

            <div className="mt-16 grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Secure upload",
                  description:
                    "Face images and blood reports are transferred over encrypted channels and are never exposed through public asset URLs.",
                },
                {
                  title: "Private storage",
                  description:
                    "Sensitive assets are stored separately from identity data, with retention and deletion controls designed from the start.",
                },
                {
                  title: "Consent and control",
                  description:
                    "Processing only begins after clear consent. Users can review, delete, or request deletion of their stored data where supported.",
                },
                {
                  title: "Auditability",
                  description:
                    "Important actions are recorded in protected audit logs so sensitive access remains reviewable without exposing raw biometric content.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border p-8"
                  style={{
                    background: "#000000",
                    borderColor: "#3f3a52",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  <h3
                    className="text-xl font-medium"
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "22px",
                      fontWeight: 460,
                      lineHeight: 1.1,
                      letterSpacing: "-0.315px",
                      color: "#ffffff",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="mt-3 text-base"
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "16px",
                      fontWeight: 460,
                      lineHeight: 1.5,
                      letterSpacing: "0px",
                      color: "#bcbac9",
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Assessment builder */}
        <section className="py-24 bg-black" suppressHydrationWarning>
          <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
            <h2
              className="text-4xl font-medium tracking-tight"
              style={{
                fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                fontSize: "48px",
                fontWeight: 460,
                lineHeight: 0.96,
                letterSpacing: "-1.32px",
                color: "#ffffff",
              }}
            >
              New assessment
            </h2>
            <p
              className="mt-6 max-w-2xl text-lg"
              style={{
                fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                fontSize: "18px",
                fontWeight: 540,
                lineHeight: 1.5,
                letterSpacing: "-0.135px",
                color: "#bcbac9",
              }}
            >
              Select the biological signals you want to include. The backend will activate only the relevant modality
              branches and route their representations through the fusion layer.
            </p>

            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {modalities.map((modality) => {
                const isActive = activeModalities.includes(modality.id);
                return (
                  <div
                    key={modality.id}
                    className="rounded-xl border p-8"
                    style={{
                      background: "#000000",
                      borderColor: isActive ? "#c9b4fa" : "#3f3a52",
                      boxShadow: isActive ? "0 0 0 1px rgba(201,180,250,0.25)" : "0 1px 3px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3
                        className="text-xl font-medium"
                        style={{
                          fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                          fontSize: "22px",
                          fontWeight: 460,
                          lineHeight: 1.1,
                          letterSpacing: "-0.315px",
                          color: "#ffffff",
                        }}
                      >
                        {modality.label}
                      </h3>
                      <button
                        type="button"
                        onClick={() => toggle(modality.id)}
                        className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-150"
                        style={{
                          fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                          fontSize: "14px",
                          fontWeight: 600,
                          lineHeight: 1.0,
                          letterSpacing: "0px",
                          borderColor: isActive ? "#c9b4fa" : "transparent",
                          color: isActive ? "#1b1938" : "#bcbac9",
                          background: isActive ? "#c9b4fa" : "transparent",
                        }}
                      >
                        {isActive ? "Selected" : "Select"}
                      </button>
                    </div>
                    <p
                      className="mt-3 text-base"
                      style={{
                        fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                        fontSize: "16px",
                        fontWeight: 460,
                        lineHeight: 1.5,
                        letterSpacing: "0px",
                        color: "#bcbac9",
                      }}
                    >
                      {modality.description}
                    </p>
                    <p
                      className="mt-4 text-sm"
                      style={{
                        fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                        fontSize: "14px",
                        fontWeight: 460,
                        lineHeight: 1.4,
                        letterSpacing: "0px",
                        color: "#5a5772",
                      }}
                    >
                      {modality.inputType}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Closing band */}
        <section
          className="py-24 bg-black"
          suppressHydrationWarning
        >
          <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
            <h2
              className="text-3xl font-medium tracking-tight"
              style={{
                fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                fontSize: "28px",
                fontWeight: 540,
                lineHeight: 1.14,
                letterSpacing: "-0.63px",
              }}
            >
              Ready to assess biological age?
            </h2>
            <p
              className="mt-6 max-w-2xl text-lg"
              style={{
                fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                fontSize: "18px",
                fontWeight: 540,
                lineHeight: 1.5,
                letterSpacing: "-0.135px",
                color: "#bcbac9",
              }}
            >
              Start an assessment and the fusion layer will use every available modality to produce a single,
              coherent estimate.
            </p>
            <a
              href="#assessment"
              className="mt-10 inline-flex items-center justify-center rounded-md border border-white/35 px-6 py-3 text-base font-semibold text-white transition-colors duration-150 hover:border-white hover:bg-white/6"
              style={{
                fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: "0px",
              }}
            >
              Start an assessment
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t" style={{ background: "#0a0a0c", borderColor: "#3f3a52" }}>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/40 to-black" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 py-16">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 grid-cols-2 grid-rows-2 gap-[2px]" aria-hidden="true">
                    <span className="col-span-2 h-[2px] w-full bg-white" />
                    <span className="h-[2px] w-full bg-white" />
                    <span className="h-[2px] w-full bg-white" />
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif",
                      fontWeight: 700,
                      fontSize: "20px",
                      lineHeight: 1,
                      letterSpacing: "0px",
                      color: "#ffffff",
                    }}
                  >
                    TEAM MOBIUS
                  </span>
                </div>
                <p
                  className="mt-4 max-w-sm"
                  style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: "#bcbac9",
                  }}
                >
                  A continuous loop of research, engineering, and design — building the next generation of
                  multimodal biological-age estimation.
                </p>
                <div className="mt-6 flex items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase"
                    style={{
                      borderColor: "#c9b4fa",
                      color: "#c9b4fa",
                      fontFamily: "var(--font-mono, 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace)",
                      fontSize: "11px",
                      letterSpacing: "1.8px",
                    }}
                  >
                    ∞ Mobius
                  </span>
                  <span
                    className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase"
                    style={{
                      borderColor: "rgba(255,255,255,0.18)",
                      color: "rgba(255,255,255,0.7)",
                      fontFamily: "var(--font-mono, 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace)",
                      fontSize: "11px",
                      letterSpacing: "1.8px",
                    }}
                  >
                    Continuous Research
                  </span>
                </div>
              </div>

              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono, 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace)",
                    fontSize: "11px",
                    fontWeight: 600,
                    lineHeight: 1,
                    letterSpacing: "1.8px",
                    textTransform: "uppercase",
                    color: "#c9b4fa",
                  }}
                >
                  Contributing members
                </p>
                <ul className="mt-4 space-y-3">
                  {["Vikas", "Abrar", "Pruvesh"].map((name) => (
                    <li
                      key={name}
                      style={{
                        fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                        fontSize: "15px",
                        lineHeight: 1.5,
                        color: "#bcbac9",
                      }}
                    >
                      <span className="mr-2 text-white/60">•</span>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono, 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace)",
                    fontSize: "11px",
                    fontWeight: 600,
                    lineHeight: 1,
                    letterSpacing: "1.8px",
                    textTransform: "uppercase",
                    color: "#c9b4fa",
                  }}
                >
                  Platform
                </p>
                <ul className="mt-4 space-y-3">
                  {[
                    { label: "Home", href: "/" },
                    { label: "Assessment", href: "/assessment" },
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Fusion API", href: "/fusion" },
                    { label: "History", href: "/history" },
                    { label: "Privacy", href: "/privacy" },
                  ].map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className="transition-colors duration-150 hover:text-white"
                        style={{
                          fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                          fontSize: "15px",
                          lineHeight: 1.5,
                          color: "#bcbac9",
                        }}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div
              className="mt-12 flex flex-col gap-4 border-t pt-8 md:flex-row md:items-center md:justify-between"
              style={{ borderColor: "#3f3a52" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  color: "#5a5772",
                }}
              >
                © {new Date().getFullYear()} Team Mobius. All rights reserved.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <a
                  href="/terms"
                  className="transition-colors duration-150 hover:text-white"
                  style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "13px",
                    lineHeight: 1.5,
                    color: "#5a5772",
                  }}
                >
                  Terms
                </a>
                <a
                  href="/privacy"
                  className="transition-colors duration-150 hover:text-white"
                  style={{
                    fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                    fontSize: "13px",
                    lineHeight: 1.5,
                    color: "#5a5772",
                  }}
                >
                  Privacy
                </a>
                <span
                  style={{
                    fontFamily: "var(--font-mono, 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace)",
                    fontSize: "12px",
                    lineHeight: 1,
                    color: "#5a5772",
                  }}
                >
                  MAGE v0.1
                </span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
