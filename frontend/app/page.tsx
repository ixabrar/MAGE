"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSession, signOut } from "next-auth/react";
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

// Public landing exposes only Face + Hand (blood/report flow is doctor-only per spec)
const publicModalities = modalities.filter((m) => m.id !== "blood") as unknown as typeof modalities;
type ModalityId = (typeof modalities)[number]["id"];
type PublicModalityId = (typeof publicModalities)[number]["id"];

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
  const [activeModalities, setActiveModalities] = useState<PublicModalityId[]>(["face", "dorsal_hand"]);
  const panel = useMemo(() => buildPanelState(activeModalities), [activeModalities]);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLDivElement | null>(null);
  const fieldRef = useRef<{ triggerExplosion: (x: number, y: number) => void } | null>(null);
  const audioRef = useRef<{ playClick: () => void } | null>(null);
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const isLoggedIn = !!session?.user;
  const isDoctor = role === "doctor" || role === "clinician";
  const isAdmin = role === "admin" || role === "system_admin" || role === "organization_admin";

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

  const toggle = (id: PublicModalityId) => {
    playClick();
    setActiveModalities((current) =>
      current.includes(id) ? (current.filter((item) => item !== id) as PublicModalityId[]) : [...current, id]
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

            <div className="hidden md:flex items-center gap-6">
              {/* Public user: no dashboard — only public assessment & role logins */}
              {!isLoggedIn && (
                <>
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
                    href="/fusion"
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
                    Fusion
                  </a>
                  <a
                    href="/auth/signin?role=doctor"
                    className="rounded-full border px-5 py-2 text-sm font-semibold transition-colors duration-150 hover:border-white hover:bg-white/10"
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      letterSpacing: "0px",
                      borderColor: "#3f3a52",
                      color: "#bcbac9",
                    }}
                  >
                    Doctor Login
                  </a>
                  <a
                    href="/auth/signin?role=admin"
                    className="rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-150"
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "14px",
                      fontWeight: 700,
                      letterSpacing: "0px",
                      background: "#c9b4fa",
                      color: "#1b1938",
                    }}
                  >
                    Admin Login
                  </a>
                </>
              )}
              {isLoggedIn && isDoctor && (
                <>
                  <a
                    href="/dashboard/patients"
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
                    Patients
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
                  <span
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "13px",
                      color: "#5a5772",
                    }}
                  >
                    {session?.user?.email}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="rounded-full border px-5 py-2 text-sm font-semibold transition-colors duration-150 hover:border-white hover:bg-white/10"
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      letterSpacing: "0px",
                      borderColor: "#3f3a52",
                      color: "#bcbac9",
                    }}
                  >
                    Sign out
                  </button>
                  <a
                    href="/dashboard/patients"
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
                    Patients
                  </a>
                </>
              )}
              {isLoggedIn && isAdmin && (
                <>
                  <a
                    href="/dashboard/users"
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
                    Manage Doctors
                  </a>
                  <a
                    href="/dashboard/audit"
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
                    Audit
                  </a>
                  <span
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "13px",
                      color: "#5a5772",
                    }}
                  >
                    {session?.user?.email}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="rounded-full border px-5 py-2 text-sm font-semibold transition-colors duration-150 hover:border-white hover:bg-white/10"
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      letterSpacing: "0px",
                      borderColor: "#3f3a52",
                      color: "#bcbac9",
                    }}
                  >
                    Sign out
                  </button>
                  <a
                    href="/dashboard/users"
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
                    Admin
                  </a>
                </>
              )}
              {/* Logged-in but generic user (no dashboard) */}
              {isLoggedIn && !isDoctor && !isAdmin && (
                <>
                  <span
                    style={{
                      fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                      fontSize: "13px",
                      color: "#5a5772",
                    }}
                  >
                    {session?.user?.email}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="rounded-full border px-5 py-2 text-sm font-semibold"
                    style={{ borderColor: "#3f3a52", color: "#bcbac9", fontSize: "14px", fontWeight: 600 }}
                  >
                    Sign out
                  </button>
                </>
              )}
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

        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16" aria-hidden="true">
          <div className="h-px w-full" style={{ background: "linear-gradient(to right, transparent, #1e1c2a, transparent)" }} />
        </div>

        {/* Fusion layer */}
        <FusionLayer />

        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16" aria-hidden="true">
          <div className="h-px w-full" style={{ background: "linear-gradient(to right, transparent, #1e1c2a, transparent)" }} />
        </div>

        {/* Security and privacy — refreshed */}
        <section className="relative py-20 sm:py-28 bg-black" suppressHydrationWarning>
          <div className="absolute inset-x-0 top-0 h-32 bg-fade-top pointer-events-none" aria-hidden="true" />
          <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 relative z-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase" style={{ letterSpacing: "1.6px", color: "#c9b4fa", borderColor: "rgba(201,180,250,0.25)", background: "rgba(201,180,250,0.06)" }}>
                Security • Privacy • Trust
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif", color: "#fff", lineHeight: 0.95 }}>
                Protected by design.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: "#bcbac9" }}>
                Healthcare-grade handling: identity is separated from biometrics, every sensitive action is audited.
              </p>
            </div>

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

        {/* Divider between Security and Closing */}
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16" aria-hidden="true">
          <div className="h-px w-full" style={{ background: "linear-gradient(to right, transparent, #1e1c2a, transparent)" }} />
        </div>

        {/* Closing band — public age, doctor biological age separate */}
        <section className="relative py-16 sm:py-20 bg-black" suppressHydrationWarning>
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(to right, transparent, #1e1c2a, transparent)" }} aria-hidden="true" />
          <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif", color: "#fff", lineHeight: 1.1 }}>
                Ready to estimate your age?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: "#bcbac9" }}>
                Public: instant age from Face or Hand. Doctors get biological age + gap & SHAP from reports in the portal.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a href="/assessment" className="inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold" style={{ background: "#c9b4fa", color: "#1b1938", fontWeight: 700 }}>
                  Start assessment →
                </a>
                <a href="/auth/signin?role=doctor" className="inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold text-white hover:bg-white/10" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                  Doctor login
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer — proper, compact, user-friendly */}
        <footer className="relative border-t" style={{ background: "#08080a", borderColor: "#1e1c2a" }}>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/60" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 py-12">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold" style={{ background: "#c9b4fa", color: "#1b1938" }}>M</span>
                  <span style={{ fontFamily: "var(--font-display, 'Rajdhani'), system-ui, sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "0.5px", color: "#fff" }}>MAGE</span>
                  <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ letterSpacing: "1.2px", color: "#c9b4fa", borderColor: "rgba(201,180,250,0.3)", background: "rgba(201,180,250,0.08)" }}>Team Mobius</span>
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

              <div className="lg:col-span-2">
                <p className="text-xs font-semibold uppercase" style={{ letterSpacing: "1.4px", color: "#c9b4fa" }}>Product</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {[
                    { label: "Assessment", href: "/assessment" },
                    { label: "Fusion", href: "/fusion" },
                    { label: "Doctors", href: "/auth/signin?role=doctor" },
                    { label: "Admin", href: "/auth/signin?role=admin" },
                  ].map((item) => (
                    <li key={item.href}><a href={item.href} className="transition-colors hover:text-white" style={{ color: "#bcbac9" }}>{item.label}</a></li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-2">
                <p className="text-xs font-semibold uppercase" style={{ letterSpacing: "1.4px", color: "#c9b4fa" }}>Resources</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {[
                    { label: "How it works", href: "#how-it-works" },
                    { label: "Security", href: "#fusion-layer" },
                    { label: "Privacy", href: "/privacy" },
                    { label: "Terms", href: "/terms" },
                  ].map((item) => (
                    <li key={item.label}><a href={item.href} className="transition-colors hover:text-white" style={{ color: "#bcbac9" }}>{item.label}</a></li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-3">
                <p className="text-xs font-semibold uppercase" style={{ letterSpacing: "1.4px", color: "#c9b4fa" }}>Status</p>
                <div className="mt-4 rounded-xl border p-4" style={{ background: "#0e0c1f", borderColor: "#1e1c2a" }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "#bcbac9" }}>
                    <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "#22c55e" }} /> All systems operational
                  </div>
                  <p className="mt-2 text-xs" style={{ color: "#5a5772" }}>ResNet18 dorsal 128M • XGBoost blood • ARM/PFM fusion</p>
                  <a href="/assessment" className="mt-3 inline-flex rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: "#c9b4fa", color: "#1b1938" }}>Start free check →</a>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "#1e1c2a", color: "#5a5772" }}>
              <p>© {new Date().getFullYear()} MAGE • Team Mobius. Research use only.</p>
              <div className="flex items-center gap-4">
                <a href="/terms" className="hover:text-white">Terms</a>
                <a href="/privacy" className="hover:text-white">Privacy</a>
                <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "#1e1c2a", background: "rgba(255,255,255,0.04)" }}>v0.1 • ResNet18 + XGBoost</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
