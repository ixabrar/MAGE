import NextAuth from "next-auth";
import Google from "@auth/core/providers/google";
import Credentials from "@auth/core/providers/credentials";

// DEVELOPMENT ONLY: in-memory user store.
// Replace with a real database before production.
type DevUser = { id: string; email: string; name?: string; passwordHash: string };
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

export function createUser(name: string, email: string, password: string): DevUser {
  const id = `user_${Date.now()}`;
  const user: DevUser = { id, email, name, passwordHash: hashPassword(password) };
  users.set(email.toLowerCase(), user);
  return user;
}

export function findUserByEmail(email: string): DevUser | undefined {
  return users.get(email.toLowerCase());
}

export function verifyUserPassword(user: DevUser, password: string): boolean {
  return user.passwordHash === hashPassword(password);
}

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

        const user = findUserByEmail(email);
        if (!user) return null;

        if (!verifyUserPassword(user, password)) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = String((user as any).id || `${Date.now()}`);
        token.name = String((user as any).name || "");
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string | undefined;
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
