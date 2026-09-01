# MAGE Frontend — Complete Learning Guide

This document explains every major frontend concept used in the MAGE platform, with exact code pointers back into the repository. It is written for a developer who wants to understand not just what the code does, but why each decision was made and how the pieces connect.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Next.js App Router](#2-nextjs-app-router)
3. [Server Components vs Client Components](#3-server-components-vs-client-components)
4. [TypeScript in MAGE](#4-typescript-in-mage)
5. [Tailwind CSS v4](#5-tailwind-css-v4)
6. [Design Tokens](#6-design-tokens)
7. [Hydration in React](#7-hydration-in-react)
8. [Hydration Issues in MAGE](#8-hydration-issues-in-mage)
9. [Framer Motion](#9-framer-motion)
10. [GSAP Animations](#10-gsap-animations)
11. [Authentication with next-auth v5](#11-authentication-with-next-auth-v5)
12. [RBAC — Role-Based Access Control](#12-rbac--role-based-access-control)
13. [Component Architecture](#13-component-architecture)
14. [State Management](#14-state-management)
15. [Routing and Navigation](#15-routing-and-navigation)
16. [Performance Considerations](#16-performance-considerations)
17. [Security in the Frontend](#17-security-in-the-frontend)
18. [Browser Compatibility — Brave](#18-browser-compatibility--brave)
19. [Code Pointers Index](#19-code-pointers-index)

---

## 1. Project Structure

```
D:/mage-app/
├── src/
│   ├── components/
│   │   ├── effects/
│   │   │   ├── ConstellationField.tsx   # Canvas 2D particle background
│   │   │   └── GalleryHeading.tsx       # Gallery heading ring renderer
│   │   ├── sections/
│   │   │   ├── HowItWorks.tsx           # Step-by-step explanation section
│   │   │   ├── FusionLayer.tsx          # Fusion architecture section
│   │   │   └── SecurityPrivacy.tsx      # Security/privacy section
│   │   ├── layout/
│   │   │   └── DashboardShell.tsx       # Authenticated app shell
│   │   ├── auth/
│   │   │   └── SignInForm.tsx           # Login form
│   │   ├── assessment/
│   │   │   └── AssessmentPageClient.tsx # Modality selector client logic
│   │   ├── results/
│   │   │   └── HistoryPageClient.tsx    # Assessment history client logic
│   │   └── security/
│   │       └── PrivacyPageClient.tsx    # Privacy center client logic
│   ├── lib/
│   │   ├── auth.ts                      # next-auth configuration
│   │   ├── utils.ts                     # cn() helper for class merging
│   │   └── design-tokens.ts             # Centralized design tokens
│   ├── context/
│   │   └── AppShellContext.tsx          # RBAC role provider
│   └── types/
│       └── index.ts                     # Shared TypeScript types
├── app/
│   ├── layout.tsx                       # Root layout with fonts
│   ├── page.tsx                         # Landing page (hero + sections)
│   ├── globals.css                      # Tailwind v4 entry + @theme tokens
│   ├── assessment/
│   │   ├── page.tsx                     # Step 1: modality selection
│   │   ├── upload/page.tsx             # Step 2: input upload
│   │   ├── processing/page.tsx         # Step 3: processing status
│   │   └── result/page.tsx             # Final result display
│   ├── dashboard/
│   │   ├── layout.tsx                   # Protected dashboard shell
│   │   ├── page.tsx                     # Dashboard home
│   │   ├── assessments/page.tsx         # Assessment management
│   │   ├── history/page.tsx             # Assessment history
│   │   └── privacy/page.tsx             # Privacy center
│   ├── auth/
│   │   └── signin/page.tsx             # Sign-in page
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts # Auth API route
│   └── login/page.tsx                   # Login redirect
├── tailwind.config.ts                   # Tailwind v4 configuration
├── package.json
└── tsconfig.json
```

### Key Concepts

- **Feature-based grouping**: Components are organized by feature (`assessment/`, `results/`, `security/`) rather than by type. This keeps related code together.
- **Shared library**: `src/lib/` contains utilities, auth config, and design tokens used across the app.
- **App Router**: All routes live under `app/`, following Next.js 13+ conventions.

---

## 2. Next.js App Router

MAGE uses Next.js 16.3.3 with the App Router (`app/` directory).

### File-based routing

| Path | URL | Purpose |
|------|-----|---------|
| `app/page.tsx` | `/` | Public landing page |
| `app/assessment/page.tsx` | `/assessment` | Step 1 of assessment |
| `app/assessment/upload/page.tsx` | `/assessment/upload` | Step 2 |
| `app/assessment/processing/page.tsx` | `/assessment/processing` | Step 3 |
| `app/assessment/result/page.tsx` | `/assessment/result` | Final result |
| `app/dashboard/page.tsx` | `/dashboard` | Authenticated dashboard |
| `app/dashboard/history/page.tsx` | `/dashboard/history` | Assessment history |
| `app/dashboard/privacy/page.tsx` | `/dashboard/privacy` | Privacy center |
| `app/auth/signin/page.tsx` | `/auth/signin` | Sign-in page |

### Layouts

**Root layout** — `app/layout.tsx`:
- Wraps every page in the app.
- Loads the Inter font from Google Fonts.
- Imports global CSS.
- Defines the `<html>` and `<body>` structure.

**Dashboard layout** — `app/dashboard/layout.tsx`:
- Server component that checks authentication.
- Redirects unauthenticated users to `/login`.
- Wraps dashboard pages in `<DashboardShell>`.
- Provides role context via `<AppShellProvider>`.

### Route groups

The `app/dashboard/` directory is a route group that shares a common layout. All nested pages (`assessments/`, `history/`, `privacy/`) automatically get the dashboard shell without repeating the layout code.

---

## 3. Server Components vs Client Components

Next.js App Router defaults to **Server Components**. These run only on the server and cannot use React hooks (`useState`, `useEffect`, etc.) or browser APIs.

### How to identify a Client Component

Any file with `"use client";` at the top is a Client Component. It runs in the browser and can use:
- React hooks (`useState`, `useEffect`, `useRef`, etc.)
- Browser APIs (`window`, `document`, `localStorage`)
- Event handlers (`onClick`, `onChange`, etc.)
- Third-party libraries that depend on the DOM

### Examples in MAGE

**Server Component** — `app/dashboard/layout.tsx`:
```tsx
export default async function DashboardLayout({ children }) {
  const session = await auth(); // Runs on server
  if (!session?.user) redirect("/login");
  return <DashboardShell>{children}</DashboardShell>;
}
```
- `auth()` is an async server-side call.
- No `"use client"` directive.
- Cannot use `useState` here.

**Client Component** — `app/page.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [active, setActive] = useState([]);
  // Can use hooks, event handlers, browser APIs
}
```
- The `"use client"` directive tells Next.js to bundle this for the browser.
- Uses `useState` for modality toggling.
- Uses `useEffect` for GSAP animations and Web Audio API.

### Why this matters

- **Server Components**: Reduce client JavaScript bundle size. Better for static content, data fetching, and SEO.
- **Client Components**: Necessary for interactivity. Use them sparingly — only where you need interactivity.

### Common mistake

Forgetting `"use client"` and trying to use `useState` in a Server Component will cause a build error like:
```
Error: React Hooks cannot be used in a Server Component
```

---

## 4. TypeScript in MAGE

MAGE is written in TypeScript for type safety and better developer experience.

### Key TypeScript patterns

**Literal types for enums:**
```tsx
const modalities = [
  { id: "face", ... },
  { id: "dorsal_hand", ... },
  { id: "blood", ... },
] as const;

type ModalityId = (typeof modalities)[number]["id"];
// Result: "face" | "dorsal_hand" | "blood"
```
This pattern, found in `app/page.tsx:14-38`, creates a type-safe union from an array. If you add a new modality, TypeScript will update `ModalityId` automatically.

**Discriminated unions for state:**
```tsx
type AssessmentState =
  | { status: "draft" }
  | { status: "processing"; stage: string }
  | { status: "complete"; result: number };
```
This ensures exhaustive type checking in switch statements.

**React type imports:**
```tsx
import type { NextAuthOptions } from "next-auth";
```
Using `import type` tells TypeScript this import is only for types and should be removed from the compiled JavaScript.

**Strict null checks:**
```tsx
const canvas = document.getElementById("stage");
if (!canvas) return; // Guard against null
const ctx = canvas.getContext("2d");
```
MAGE uses strict null checks. Every nullable value must be checked before use.

---

## 5. Tailwind CSS v4

MAGE uses Tailwind CSS v4, which has a different configuration syntax than v3.

### Key differences from v3

**v3 syntax (old):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**v4 syntax (current):**
```css
@import "tailwindcss";

@theme {
  --color-primary: #1b1938;
  --color-primary-deep: #0e0c1f;
  /* ... */
}
```

### Tailwind config

`tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        // ...
      },
    },
  },
};

export default config;
```

### Usage in components

MAGE uses a mix of Tailwind utilities and inline styles:

```tsx
<div className="rounded-xl border p-8" style={{ background: "#000000", borderColor: "#3f3a52" }}>
```

**Why both?**
- Tailwind utilities handle layout, spacing, and responsive design.
- Inline styles handle dynamic values (hover states, conditional colors) and design tokens that need to be exact.
- The `cn()` utility in `src/lib/utils.ts` merges class names safely.

---

## 6. Design Tokens

All design tokens are centralized in `src/lib/design-tokens.ts`.

### Color system

```ts
export const colors = {
  primary: "#1b1938",
  primaryDeep: "#0e0c1f",
  onPrimary: "#ffffff",
  ink: "#292827",
  inkMute: "#73706d",
  inkFaint: "#9a9794",
  canvas: "#ffffff",
  canvasSoft: "#fafaf9",
  teal: "#0e3030",
  tealLight: "#14b8a6",
  accent: "#c9b4fa", // Purple accent for interactive elements
} as const;
```

### Typography tokens

```ts
export const font = {
  sans: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "ui-monospace, 'SF Mono', 'Fira Code', monospace",
} as const;
```

### Usage pattern

Instead of hardcoding colors, components reference tokens:

```tsx
style={{ color: colors.accent, fontFamily: font.sans }}
```

This ensures consistency and makes theme updates trivial.

### Backward-compatible aliases

Some legacy code references `tokens.colors.muted` and `tokens.font.mono`. These are aliased in `design-tokens.ts` to prevent build breaks:

```ts
export const tokens = {
  colors: {
    ...colors,
    muted: colors.inkMute, // Backward compatibility
  },
  font: {
    ...font,
    mono: font.mono, // Backward compatibility
  },
};
```

---

## 7. Hydration in React

### What is hydration?

Hydration is the process where React **attaches event listeners and makes the page interactive** after the initial HTML is rendered. In Next.js:

1. Server renders the HTML for a page.
2. Browser downloads the HTML and displays it immediately.
3. JavaScript loads and React "hydrates" the static HTML, making it interactive.

### Why hydration matters

If the server-rendered HTML doesn't match the client-rendered HTML, React throws a **hydration mismatch error**. This can happen when:
- Browser extensions modify the DOM before React hydrates it.
- Dates/timestamps differ between server and client.
- Third-party scripts inject attributes or elements.

### How hydration works in MAGE

**Server-rendered HTML:**
```html
<div class="hero" data-hero="true">
  <h1>MAGE</h1>
</div>
```

**After hydration (React takes over):**
```html
<div class="hero" data-hero="true" onclick="...">
  <h1>MAGE</h1>
</div>
```

React attaches event listeners and manages state without re-rendering the entire page.

### Hydration strategies in Next.js

1. **Static rendering (default)**: HTML is generated at build time.
2. **Dynamic rendering**: HTML is generated on each request.
3. **Streaming**: HTML is sent in chunks as it's generated.

MAGE uses static rendering for most pages, with client-side interactivity added via Client Components.

---

## 8. Hydration Issues in MAGE

### The problem

Brave browser extensions inject `bis_skin_checked="1"` attributes into the DOM:

```html
<!-- Server renders: -->
<button>Click me</button>

<!-- Extension modifies: -->
<button bis_skin_checked="1">Click me</button>

<!-- React expects: -->
<button>Click me</button>
```

This mismatch causes React to throw errors and crash the dev server.

### The solution

**`suppressHydrationWarning`** — tells React to ignore mismatches on specific elements:

```tsx
<div suppressHydrationWarning>
  {/* React won't complain about extension-injected attributes here */}
</div>
```

**Where it's used in MAGE:**
- `app/page.tsx:127` — Root page container
- `app/page.tsx:349` — `<main>` element
- All `<section>` elements in the landing page
- All assessment pages
- All dashboard pages

**Code pointer:**
```tsx
// app/page.tsx:127
<div className="relative min-h-screen bg-black text-white" suppressHydrationWarning>
```

### Other hydration mitigations

1. **Avoid browser-only code in Server Components**: Don't use `window` or `document` in files without `"use client"`.
2. **Use `useEffect` for client-only initialization**: GSAP animations and Web Audio API are initialized in `useEffect` to ensure they run only on the client.
3. **Avoid dynamic content in Server Components**: Don't render dates, random values, or user-specific data without proper guards.

---

## 9. Framer Motion

Framer Motion is used for entrance animations and hover effects.

### Installation

```bash
npm install framer-motion
```

### Basic usage

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-60px" }}
  transition={{ duration: 0.6 }}
>
  Content
</motion.div>
```

### Key props

- **`initial`**: Starting state (before animation)
- **`animate`**: Target state (for continuous animations)
- **`whileInView`**: State when element enters viewport
- **`viewport`**: Controls when animation triggers
  - `once: true` — animate only once
  - `margin: "-60px"` — trigger 60px before element enters viewport
- **`transition`**: Timing and easing

### Usage in MAGE

**Modality cards** — `src/components/sections/HowItWorks.tsx`:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-60px" }}
  transition={{ duration: 0.6, delay: index * 0.1 }}
>
```

**CTA buttons** — `app/page.tsx:250-266`:
```tsx
<motion.a
  href="#assessment"
  whileHover={{ backgroundColor: "#d4c2fb" }}
  transition={{ duration: 0.12 }}
>
```

### Performance tips

1. **Use `once: true`** for scroll-triggered animations to avoid re-running.
2. **Avoid animating layout properties** (`width`, `height`, `top`, `left`) — use `transform` and `opacity` instead.
3. **Limit concurrent animations** — too many motion components can cause jank.

---

## 10. GSAP Animations

GSAP (GreenSock Animation Platform) is used for the hero entrance animation and click interactions.

### Installation

```bash
npm install gsap
npm install --save-dev @types/gsap
```

### Registration

```tsx
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
```

### Hero entrance animation

**Code pointer:** `app/page.tsx:93-108`

```tsx
useEffect(() => {
  const elements = heroRef.current.querySelectorAll("[data-animate]");
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
}, []);
```

**How it works:**
1. Selects all elements with `data-animate` attribute.
2. Animates them from `opacity: 0, y: 24` to `opacity: 1, y: 0`.
3. `stagger: 0.08` creates a cascading effect (each element starts 0.08s after the previous).
4. `ease: "power3.out"` gives a smooth deceleration.

### Why GSAP + Framer Motion?

- **Framer Motion**: Component-level animations (entrance, hover, exit).
- **GSAP**: Complex timelines, scroll-triggered animations, and interactions that need precise control.

---

## 11. Authentication with next-auth v5

MAGE uses `next-auth@beta` (v5 beta) for authentication.

### Configuration

**File:** `src/lib/auth.ts`

```ts
import NextAuth from "next-auth";
import Credentials from "@auth/core/providers/credentials";

export const { handlers, auth } = NextAuth({
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        // Placeholder: replace with real credential verification.
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.AUTH_SECRET,
});
```

### Key exports

- **`handlers`**: Used in the API route to handle auth requests.
- **`auth`**: Used in Server Components and middleware to check sessions.

### API route

**File:** `app/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

This creates the `/api/auth/*` endpoints that handle sign-in, sign-out, and session management.

### Using auth in Server Components

**File:** `app/dashboard/layout.tsx`

```tsx
export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
```

**How it works:**
1. `auth()` is an async function that retrieves the current session from cookies.
2. If no session exists, redirect to `/login`.
3. If session exists, render the dashboard with user context.

### Client-side sign-in

**File:** `app/auth/signin/page.tsx`

```tsx
"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <form
      action={async (formData) => {
        "use server";
        await signIn("credentials", formData);
      }}
    >
      {/* Form fields */}
    </form>
  );
}
```

### Session types

**File:** `src/types/index.ts`

```ts
export type UserRole = "user" | "clinician" | "organization_admin" | "ml_researcher" | "system_admin";

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}
```

---

## 12. RBAC — Role-Based Access Control

### What is RBAC?

RBAC (Role-Based Access Control) restricts system access based on user roles. In MAGE:

- **USER**: Can manage own profile, run assessments, view own results.
- **CLINICIAN**: Can access assigned users, view permitted assessments.
- **ORGANIZATION_ADMIN**: Can manage organization users, view aggregate analytics.
- **ML_RESEARCHER**: Can access approved research datasets, view model metrics.
- **SYSTEM_ADMIN**: Can manage platform configuration, users, models.

### How RBAC is implemented in MAGE

**1. Role storage in session**

The user's role is stored in the NextAuth session:

```ts
// src/lib/auth.ts
session: { strategy: "jwt" },
```

When a user signs in, their role is included in the JWT token and session.

**2. Role extraction in Server Components**

**File:** `app/dashboard/layout.tsx`

```tsx
const session = await auth();
const role = session.user.role ?? "user";
```

**3. Role context provider**

**File:** `src/context/AppShellContext.tsx`

```tsx
"use client";

import { createContext, useContext } from "react";
import type { UserRole } from "@/types";

interface AppShellContextValue {
  role: UserRole;
}

const AppShellContext = createContext<AppShellContextValue>({ role: "user" });

export function AppShellProvider({ role, children }) {
  return (
    <AppShellContext.Provider value={{ role }}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useRole() {
  return useContext(AppShellContext).role;
}
```

**How it works:**
1. `AppShellProvider` wraps the dashboard layout.
2. It receives the user's role from the session.
3. Any component inside can access the role via `useRole()`.

**4. Role-aware navigation**

**File:** `src/components/layout/DashboardShell.tsx`

```tsx
import { useRole } from "@/context/AppShellContext";

export function DashboardShell({ user, children }) {
  const role = useRole();

  const navigation = {
    user: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/assessments", label: "New Assessment" },
      { href: "/dashboard/history", label: "History" },
      { href: "/dashboard/privacy", label: "Privacy" },
    ],
    clinician: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/patients", label: "Patients" },
      { href: "/dashboard/assessments", label: "Assessments" },
    ],
    // ... other roles
  };

  const items = navigation[role] || navigation.user;

  return (
    <div>
      <nav>{/* Render items */}</nav>
      <main>{children}</main>
    </div>
  );
}
```

**5. Resource-level authorization**

Authorization happens on the **backend**, not just the frontend:

```tsx
// Example: API route
export async function GET(request, { params }) {
  const session = await auth();
  const assessment = await db.assessment.findUnique({ where: { id: params.id } });

  if (assessment.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(assessment);
}
```

**Why both frontend and backend?**
- Frontend RBAC: Hides UI elements the user can't access.
- Backend RBAC: Enforces actual access control. Never trust the frontend alone.

### RBAC flow diagram

```
User logs in
      ↓
Authentication (next-auth)
      ↓
Session with role
      ↓
AppShellProvider provides role
      ↓
DashboardShell renders role-aware navigation
      ↓
User sees only permitted links
      ↓
Backend verifies every request
      ↓
Resource-level authorization
```

---

## 13. Component Architecture

### Directory structure

```
src/components/
├── effects/           # Visual effects (Canvas, WebGL)
│   ├── ConstellationField.tsx
│   └── GalleryHeading.tsx
├── sections/          # Landing page sections
│   ├── HowItWorks.tsx
│   ├── FusionLayer.tsx
│   └── SecurityPrivacy.tsx
├── layout/            # Layout components
│   └── DashboardShell.tsx
├── auth/              # Authentication components
│   └── SignInForm.tsx
├── assessment/        # Assessment flow components
│   └── AssessmentPageClient.tsx
├── results/           # Results and history
│   └── HistoryPageClient.tsx
└── security/          # Privacy and security
    └── PrivacyPageClient.tsx
```

### Component types

**Container components** (pages):
- `app/page.tsx` — Landing page
- `app/assessment/page.tsx` — Assessment step 1
- `app/dashboard/page.tsx` — Dashboard home

**Presentational components** (UI):
- `src/components/sections/HowItWorks.tsx` — How It Works section
- `src/components/effects/ConstellationField.tsx` — Particle background

**Layout components**:
- `app/layout.tsx` — Root layout
- `app/dashboard/layout.tsx` — Dashboard layout
- `src/components/layout/DashboardShell.tsx` — Dashboard shell with nav

**Client components** (interactive):
- Any file with `"use client"`
- Must be imported into Server Components

### Composition pattern

MAGE uses composition over inheritance:

```tsx
// app/dashboard/assessments/page.tsx
export default async function AssessmentsIndex() {
  const session = await auth();

  return (
    <DashboardShell user={session.user}>
      <AssessmentPageClient />
    </DashboardShell>
  );
}
```

- `DashboardShell` provides layout, navigation, and user context.
- `AssessmentPageClient` provides the interactive assessment logic.
- They're composed together, keeping concerns separate.

---

## 14. State Management

MAGE uses React's built-in state management (no external library).

### Local state

**`useState`** — for component-level state:

```tsx
// app/page.tsx
const [activeModalities, setActiveModalities] = useState<ModalityId[]>(["face", "dorsal_hand", "blood"]);
```

**`useMemo`** — for derived state:

```tsx
// app/page.tsx
const panel = useMemo(() => buildPanelState(activeModalities), [activeModalities]);
```

### Refs

**`useRef`** — for mutable values that don't trigger re-renders:

```tsx
// app/page.tsx
const fieldRef = useRef<{ triggerExplosion: (x: number, y: number) => void } | null>(null);
const audioRef = useRef<{ playClick: () => void } | null>(null);
```

**Why refs?**
- Store references to DOM elements.
- Store mutable values (like canvas instances) without causing re-renders.
- Access imperative APIs (GSAP, Web Audio).

### Context API

**File:** `src/context/AppShellContext.tsx`

Used for sharing the user's role across the dashboard without prop drilling:

```tsx
<AppShellProvider role={role}>
  <DashboardShell>{children}</DashboardShell>
</AppShellProvider>
```

### When to add a state manager

If you find yourself:
- Passing state through 3+ component levels
- Synchronizing state between unrelated components
- Complex state logic (undo/redo, time travel)

Consider adding Zustand or Jotai. For now, React's built-in tools are sufficient.

---

## 15. Routing and Navigation

### File-based routing

Next.js App Router uses the file system to define routes:

```
app/
├── page.tsx              → /
├── about/
│   └── page.tsx         → /about
├── dashboard/
│   ├── page.tsx         → /dashboard
│   └── settings/
│       └── page.tsx     → /dashboard/settings
```

### Programmatic navigation

**`useRouter` hook** — for client-side navigation:

```tsx
"use client";

import { useRouter } from "next/navigation";

export default function AssessmentPage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/assessment/upload");
  };

  return <button onClick={handleContinue}>Continue</button>;
}
```

**`Link` component** — for declarative navigation:

```tsx
import Link from "next/link";

<Link href="/assessment" className="...">
  Start assessment
</Link>
```

### Anchor tags

For external links or hash links:

```tsx
<a href="#fusion">Explore the fusion layer</a>
<a href="https://example.com">External</a>
```

---

## 16. Performance Considerations

### Static generation

Most MAGE pages are statically generated at build time:

```
Route (app)
┌ ○ /
├ ○ /assessment
├ ○ /assessment/processing
├ ○ /assessment/result
└ ○ /assessment/upload

○  (Static)  prerendered as static content
```

This means:
- Pages are pre-rendered to HTML at build time.
- No server-side rendering on each request.
- Fast page loads and better SEO.

### Dynamic imports

For large components, use dynamic imports to code-split:

```tsx
import dynamic from "next/dynamic";

const GalleryHeading = dynamic(() => import("@/components/effects/GalleryHeading"), {
  ssr: false, // Disable SSR for this component
});
```

### Canvas optimization

**File:** `src/components/effects/ConstellationField.tsx`

The particle system uses:
- `requestAnimationFrame` for smooth 60fps animations.
- Device pixel ratio scaling for sharp rendering on Retina displays.
- Particle count limits to avoid performance issues.
- Cleanup in `useEffect` return to prevent memory leaks.

### Image optimization

Next.js automatically optimizes images with the `next/image` component:

```tsx
import Image from "next/image";

<Image
  src="/hero.png"
  alt="MAGE hero"
  width={1200}
  height={600}
  priority // Load immediately for above-the-fold images
/>
```

### Reducing JavaScript bundle size

- Use Server Components by default.
- Add `"use client"` only where needed.
- Avoid importing large libraries in Client Components.
- Use dynamic imports for non-critical components.

---

## 17. Security in the Frontend

### Authentication security

**`AUTH_SECRET`** — Used to sign JWT tokens:

```ts
// .env.local
AUTH_SECRET=your-secret-key-here
```

**Never commit this to version control.** Use environment variables.

**Secure cookies** — next-auth automatically sets:
- `httpOnly` cookies (inaccessible to JavaScript)
- `secure` cookies (HTTPS only in production)
- `sameSite` protection (CSRF prevention)

### Authorization

**Frontend RBAC** — hides UI elements:

```tsx
const role = useRole();
const navItems = navigation[role] || navigation.user;
```

**Backend RBAC** — enforces access control:

```ts
// API route
const session = await auth();
if (assessment.userId !== session.user.id) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### XSS prevention

React escapes all rendered values by default:

```tsx
// Safe - React escapes user input
<div>{userInput}</div>

// Dangerous - avoid unless absolutely necessary
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### CSRF protection

next-auth includes CSRF protection automatically. For custom forms:

```tsx
<form action={async (formData) => {
  "use server";
  // Server action - automatically includes CSRF token
}}>
```

### File upload security

**Validation happens on the backend:**

```ts
// Example backend validation
const file = formData.get("file");
const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
if (!allowedTypes.includes(file.type)) {
  return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
}
```

**Frontend provides UX feedback:**

```tsx
<input
  type="file"
  accept="image/*,application/pdf"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file && !allowedTypes.includes(file.type)) {
      setError("Invalid file type");
    }
  }}
/>
```

---

## 18. Browser Compatibility — Brave

### Known issues

**Brave Shields** can block localhost assets:
- CSS files
- JavaScript bundles
- Fonts

**Solution:** Disable Brave Shields for `localhost:3000`:
1. Click the Brave Shields icon in the address bar.
2. Toggle Shields to "Down" for localhost.

**Brave extensions** inject DOM attributes:
- MetaMask and other extensions add `bis_skin_checked="1"` attributes.
- This causes React hydration mismatches.

**Solution:** Use `suppressHydrationWarning` on affected containers.

### Testing in Brave

1. Disable Shields for localhost.
2. Open DevTools (F12).
3. Check Console for hydration warnings.
4. Check Network tab for blocked assets.

---

## 19. Code Pointers Index

### Landing Page

| Concept | File | Lines |
|---------|------|-------|
| Hero section | `app/page.tsx` | 127-343 |
| Modality toggles | `app/page.tsx` | 284-307 |
| ConstellationField background | `app/page.tsx` | 130-132 |
| GalleryHeading section | `app/page.tsx` | 437-442 |
| HowItWorks section | `app/page.tsx` | 444-445 |
| FusionLayer section | `app/page.tsx` | 447-448 |
| Security/Privacy section | `app/page.tsx` | 450-660 |
| Assessment Builder section | `app/page.tsx` | 662-860 |
| GSAP animations | `app/page.tsx` | 93-108 |
| Click interaction | `app/page.tsx` | 66-69, 134-136 |

### Authentication

| Concept | File | Lines |
|---------|------|-------|
| Auth config | `src/lib/auth.ts` | 1-24 |
| API route | `app/api/auth/[...nextauth]/route.ts` | 1-3 |
| Sign-in page | `app/auth/signin/page.tsx` | 1-50 |
| Dashboard layout (protected) | `app/dashboard/layout.tsx` | 1-20 |

### RBAC

| Concept | File | Lines |
|---------|------|-------|
| Role types | `src/types/index.ts` | 1-20 |
| AppShellContext | `src/context/AppShellContext.tsx` | 1-40 |
| DashboardShell | `src/components/layout/DashboardShell.tsx` | 1-100 |
| Role-aware navigation | `src/components/layout/DashboardShell.tsx` | 30-80 |

### Assessment Flow

| Concept | File | Lines |
|---------|------|-------|
| Step 1: Modality selection | `app/assessment/page.tsx` | 1-100 |
| Step 2: Upload inputs | `app/assessment/upload/page.tsx` | 1-120 |
| Step 3: Processing | `app/assessment/processing/page.tsx` | 1-150 |
| Result page | `app/assessment/result/page.tsx` | 1-200 |

### Visual Effects

| Concept | File | Lines |
|---------|------|-------|
| ConstellationField (particles) | `src/components/effects/ConstellationField.tsx` | 1-200 |
| GalleryHeading (ring) | `src/components/effects/GalleryHeading.tsx` | 1-765 |

### Design System

| Concept | File | Lines |
|---------|------|-------|
| Design tokens | `src/lib/design-tokens.ts` | 1-100 |
| Global CSS | `app/globals.css` | 1-50 |
| Tailwind config | `tailwind.config.ts` | 1-50 |
| Root layout | `app/layout.tsx` | 1-30 |

---

## Learning Path

### Beginner

1. Read `app/page.tsx` — understand the landing page structure.
2. Read `src/lib/design-tokens.ts` — understand the design system.
3. Read `app/layout.tsx` — understand the root layout.
4. Run `npm run dev` and open `localhost:3000` in Brave.

### Intermediate

1. Read `src/components/effects/ConstellationField.tsx` — understand Canvas 2D.
2. Read `src/lib/auth.ts` — understand authentication setup.
3. Read `src/context/AppShellContext.tsx` — understand RBAC.
4. Build the assessment flow: `/assessment` → `/assessment/upload` → `/assessment/processing` → `/assessment/result`.

### Advanced

1. Read `src/components/effects/GalleryHeading.tsx` — understand complex Canvas rendering.
2. Implement the backend API routes for assessment creation and results.
3. Add database integration for user sessions and assessment history.
4. Implement actual modality models (Face, Hand, Blood) with real file uploads.
5. Add the fusion layer visualization with WebGL/Three.js.
6. Implement audit logging and security hardening.
7. Add tests (unit, integration, security).

---

## Questions to Answer

After studying this guide, you should be able to answer:

1. **What is the difference between a Server Component and a Client Component?**
   - Server Components run on the server, can't use hooks or browser APIs.
   - Client Components run in the browser, marked with `"use client"`.
   - See [Section 3](#3-server-components-vs-client-components).

2. **How does authentication work in MAGE?**
   - next-auth v5 handles authentication.
   - Session is stored in JWT cookies.
   - See [Section 11](#11-authentication-with-next-auth-v5).

3. **How is RBAC implemented?**
   - Role is stored in the session.
   - `AppShellProvider` provides role context.
   - `DashboardShell` renders role-aware navigation.
   - Backend enforces resource-level authorization.
   - See [Section 12](#12-rbac--role-based-access-control).

4. **What is hydration and why does it matter?**
   - Hydration is React attaching event listeners to server-rendered HTML.
   - Mismatches cause errors.
   - Brave extensions cause mismatches.
   - `suppressHydrationWarning` mitigates this.
   - See [Section 7](#7-hydration-in-react) and [Section 8](#8-hydration-issues-in-mage).

5. **How does the particle background work?**
   - Canvas 2D API renders particles.
   - `requestAnimationFrame` drives the animation loop.
   - Mouse interaction triggers explosions.
   - See `src/components/effects/ConstellationField.tsx`.

6. **How does the assessment flow work?**
   - Step 1: Select modalities (`/assessment`)
   - Step 2: Upload inputs (`/assessment/upload`)
   - Step 3: Processing status (`/assessment/processing`)
   - Step 4: Result display (`/assessment/result`)
   - See [Section 15](#15-routing-and-navigation).

---

## Next Steps

1. Implement the backend API for assessments.
2. Add database models for users, assessments, and results.
3. Implement actual modality upload components (Camera + File upload).
4. Add real authentication with a database.
5. Implement the fusion layer visualization.
6. Add tests for all components and API routes.
7. Add audit logging for sensitive actions.
8. Implement privacy center features (data export, deletion).
9. Add admin/clinician dashboards.
10. Production hardening (CSP headers, rate limiting, etc.).

---

## Glossary

- **Server Component**: A React component that runs only on the server.
- **Client Component**: A React component that runs in the browser.
- **Hydration**: The process of making server-rendered HTML interactive.
- **RBAC**: Role-Based Access Control — restricting access based on user roles.
- **JWT**: JSON Web Token — a compact, URL-safe token for securely transmitting claims.
- **SSR**: Server-Side Rendering — rendering HTML on the server for each request.
- **SSG**: Static Site Generation — rendering HTML at build time.
- **CSRF**: Cross-Site Request Forgery — an attack that forces users to execute unwanted actions.
- **XSS**: Cross-Site Scripting — injecting malicious scripts into web pages.
- **CSP**: Content Security Policy — a security layer that detects and mitigates XSS attacks.

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [GSAP Documentation](https://gsap.com/docs/)
- [next-auth Documentation](https://authjs.dev)
- [MAGE Master Prompt](../MAGE_MASTER_PROMPT.md)
- [Design Spec](../DESIGN-superhuman.md)
