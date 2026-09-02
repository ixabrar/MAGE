import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Account already exists. Please sign in." }, { status: 409 });
    }
    const user = createUser(name || email, email, password);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
