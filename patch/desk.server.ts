import { notesFor, type MemoryNote } from "@/lib/memory";
import { PRODUCTS } from "@/lib/catalogue";
import type { Role } from "@/lib/access";

export type ChatTurn = { role: "user" | "assistant"; content: string };

function deskSecret() {
  const raw = process.env.XAI_API_KEY || "sable-desk-preview-key";
  return new TextEncoder().encode(raw.slice(0, 48).padEnd(32, "x"));
}

const CODES: Record<string, Role> = {
  "0001": "sales",
  veld: "sales",
  last: "manager",
  "4181": "admin",
};

export function roleFromCode(code: string): Role | null {
  return CODES[code.trim().toLowerCase()] ?? null;
}

export async function signRole(role: Role) {
  const { SignJWT } = await import("jose");
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(deskSecret());
}

export async function verifyDesk(token: string | undefined): Promise<Role | null> {
  if (!token) return null;
  try {
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(token, deskSecret());
    const role = payload.role;
    if (role === "sales" || role === "manager" || role === "admin") return role;
    return null;
  } catch {
    return null;
  }
}

export async function readRole(token: string | undefined): Promise<Role> {
  return (await verifyDesk(token)) ?? "customer";
}

function catalogueBlock() {
  return PRODUCTS.map((p) => {
    const price = p.price == null ? "POA" : `R${p.price}`;
    return `${p.sku} | Item ${String(p.n).padStart(2, "0")} | ${p.look} | ${p.category} | ${price}`;
  }).join("\n");
}

export function pack(role: Role) {
  const notes = notesFor(role);
  const noteText = notes.map((n: MemoryNote) => `## ${n.title}\n${n.body}`).join("\n\n");
  const salesRules = `You are the SABLE.CO house assistant for the SALES desk.
Only use the house files below. Never invent stock, cost, factory capacity, or a discount.
Never discuss other businesses, margins, or internal roadmap.
If asked for a discount, cost, or unlisted price: say a manager must confirm.
If asked whether a pair is in stock: say subject to availability — confirm with the factory.
Quote listed ZAR only. Track shoes as 45001–45092.
Keep answers short. WhatsApp-ready when they ask for a message.`;

  const floorRules = `You are the SABLE.CO house assistant for ${role.toUpperCase()}.
You have the house memory allowed for this desk. Use only the files below.
Never invent stock counts, costs, or discounts. Say you will confirm with Luan rather than inventing his answer.
This is an internal tool. Keep answers direct and operational.`;

  return `${role === "sales" ? salesRules : floorRules}

# House files
${noteText}

# 2026 catalogue (SKU | Item | look | category | listed)
${catalogueBlock()}`;
}
