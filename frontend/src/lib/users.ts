import type { User } from "@/types/auth";

type InternalUser = User & { password: string };

export const users: InternalUser[] = [
  {
    id: "usr_001",
    email: "user@example.com",
    name: "Demo User",
    password: "password",
    role: "user",
  },
];

export async function findUserByEmail(email: string): Promise<InternalUser | null> {
  return users.find((item) => item.email === email) ?? null;
}

export async function verifyUserPassword(
  email: string,
  password: string
): Promise<User | null> {
  const user = await findUserByEmail(email);

  if (!user || user.password !== password) {
    return null;
  }

  const { password: _password, ...safeUser } = user;
  return safeUser;
}
