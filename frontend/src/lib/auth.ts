import NextAuth from "next-auth";
import Google from "@auth/core/providers/google";
import Credentials from "@auth/core/providers/credentials";

// DEVELOPMENT ONLY: in-memory user store.
// Replace with a real database before production.
type DevUser = { id: string; email: string; name?: string; passwordHash: string; role: string };
const users = new Map<string, DevUser>();

function hashPassword(password: string): string {
  // DEVELOPMENT ONLY: simple hash for demo purposes.
  // Use bcrypt/argon2 in production.
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `dev_${Math.abs(hash)}`;
}

function seedDevUsers() {
  const seeds: Array<[string, string, string, string]> = [
    ["doctor@mage.health", "Dr. Demo", "doctor123", "doctor"],
    ["doctor@example.com", "Dr. Demo", "doctor123", "doctor"],
    ["admin@mage.health", "Admin Demo", "admin123", "system_admin"],
    ["admin@example.com", "Admin Demo", "admin123", "system_admin"],
  ];
  for (const [email, name, pwd, role] of seeds) {
    const key = email.toLowerCase();
    if (!users.has(key)) {
      users.set(key, { id: `${role}_dev`, email: email.toLowerCase(), name, passwordHash: hashPassword(pwd), role });
    }
  }
}
seedDevUsers();

export function createUser(name: string, email: string, password: string, role: string = "user"): DevUser {
  const id = `user_${Date.now()}`;
  // infer role from email for demo
  let r = role;
  const lower = email.toLowerCase();
  if (lower.includes("doctor")) r = "doctor";
  else if (lower.includes("admin")) r = "system_admin";
  const user: DevUser = { id, email: email.toLowerCase(), name, passwordHash: hashPassword(password), role: r };
  users.set(email.toLowerCase(), user);
  return user;
}

export function findUserByEmail(email: string): DevUser | undefined {
  return users.get(email.toLowerCase());
}

export function verifyUserPassword(user: DevUser, password: string): boolean {
  return user.passwordHash === hashPassword(password);
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const { handlers, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString() ?? "";

        if (!email || !password) return null;

        // Try backend Supabase login first (if reachable)
        try {
          const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          if (res.ok) {
            const data = await res.json();
            const u = data?.user;
            if (u?.id && u?.email) {
              return {
                id: String(u.id),
                email: String(u.email),
                name: String(u.full_name || u.email),
                role: String(u.role || "user"),
              } as any;
            }
          }
        } catch {
          // fallback to local dev users
        }

        const user = findUserByEmail(email);
        if (!user) return null;

        if (!verifyUserPassword(user, password)) return null;

        return { id: user.id, email: user.email, name: user.name, role: (user as any).role || "user" } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = String((user as any).id || `${Date.now()}`);
        token.name = String((user as any).name || "");
        (token as any).role = (user as any).role || (token as any).role || "user";
        // persist backend tokens if provided via authorize return
        if ((user as any).access_token) (token as any).access_token = (user as any).access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string | undefined;
        (session.user as any).role = (token as any).role || "user";
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.AUTH_SECRET,
});
