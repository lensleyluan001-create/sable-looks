import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DeskGate, GatePending } from "@/components/desk-gate";
import { atLeast } from "@/lib/access";
import { useSable } from "@/lib/store";

export function StaffGate() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <p className="text-xs tracking-[0.22em] uppercase text-muted">Staff</p>
      <h1 className="font-display mt-3 text-4xl">House desk</h1>
      <p className="mt-4 text-sm text-muted">
        App opens in customer mode. Customers order a pair. Staff open Desk with
        a code. Sales is 0001.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link to="/desk">Open desk</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/collection">Back to the book</Link>
        </Button>
      </div>
    </main>
  );
}

export function StaffOnly({
  children,
  need,
}: {
  children: ReactNode;
  need?: "manager" | "admin";
}) {
  const hydrated = useSable((s) => s.hydrated);
  const token = useSable((s) => s.deskToken);
  const role = useSable((s) => s.deskRole);
  if (!hydrated) return <GatePending />;
  if (!token || role === "customer") return <StaffGate />;
  if (need && !atLeast(role, need)) return <DeskGate need={need} />;
  return children;
}
