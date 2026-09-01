"use client";

import { motion } from "framer-motion";
import { tokens } from "@/lib/design-tokens";

const navLinks = [
  { label: "Models", href: "#modalities" },
  { label: "Fusion", href: "/fusion" },
  { label: "Research", href: "#research" },
  { label: "API", href: "#api" },
];

export function SiteNav() {
  return (
    <nav
      className="fixed inset-x-0 top-0 z-40 h-16 flex items-center px-6 sm:px-10 lg:px-14"
      style={{
        background: "rgba(77, 20, 215, 0.92)",
        borderBottom: `1px solid ${tokens.colors.hairline}`,
        backdropFilter: "blur(14px)",
      }}
    >
      <div className="flex w-full items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <span className="flex h-4 w-4 grid-cols-2 grid-rows-2 gap-[2px]" aria-hidden="true">
            <span className="col-span-2 h-[2px] w-full bg-white" />
            <span className="h-[2px] w-full bg-white" />
            <span className="h-[2px] w-full bg-white" />
          </span>
          <span
            className="text-white"
            style={{
              fontFamily: tokens.font.mono,
              fontWeight: 700,
              fontSize: "18px",
              lineHeight: 1,
              letterSpacing: "1.5px",
            }}
          >
            MAGE
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-white/70 transition-colors duration-150 hover:text-white"
              style={{ fontFamily: tokens.font.mono, fontSize: "14px", letterSpacing: "0.5px" }}
            >
              {item.label}
            </a>
          ))}
        </div>

        <motion.a
          href="#assessment"
          className="hidden md:inline-flex bg-white px-5 py-2 text-black"
          style={{ fontFamily: tokens.font.mono, fontSize: "14px", letterSpacing: "0px" }}
          whileHover={{ backgroundColor: "#f0f0f0" }}
          transition={{ duration: 0.12 }}
        >
          Start an assessment
        </motion.a>
      </div>
    </nav>
  );
}
