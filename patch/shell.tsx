import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Columns3,
  Factory,
  Home,
  KeyRound,
  LayoutGrid,
  Menu,
  MessageCircle,
  Ruler,
  Send,
  SlidersHorizontal,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ADMIN_NAV,
  DESKS,
  FLOOR_NAV,
  PUBLIC_NAV,
  ROLE_LABEL,
  SALES_NAV,
  atLeast,
  drawerItems,
  phoneTabs,
  type Role,
} from "@/lib/access";
import { openDesk } from "@/lib/desk";
import { useSable } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const ICONS: Record<string, LucideIcon> = {
  "/": Home,
  "/collection": LayoutGrid,
  "/sizes": Ruler,
  "/order": Send,
  "/enquire": MessageCircle,
  "/floor": Columns3,
  "/capture": UserPlus,
  "/build": SlidersHorizontal,
  "/desk": KeyRound,
  "/factory": Factory,
  "/memory": BookOpen,
};

function isActivePath(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hydrated = useSable((s) => s.hydrated);
  const deskRole = useSable((s) => s.deskRole);
  const deskToken = useSable((s) => s.deskToken);
  const setDesk = useSable((s) => s.setDesk);
  const clearDesk = useSable((s) => s.clearDesk);
  const copy = useSable((s) => s.copy);
  const role = hydrated ? deskRole : "customer";
  const hasDesk = hydrated && Boolean(deskToken) && role !== "customer";
  const nav = !hasDesk
    ? PUBLIC_NAV
    : atLeast(role, "admin")
      ? ADMIN_NAV
      : atLeast(role, "manager")
        ? FLOOR_NAV
        : SALES_NAV;
  const tabs = phoneTabs(role, hasDesk);
  const menu = drawerItems(nav, hasDesk);
  const [open, setOpen] = useState(false);
  const [deskOpen, setDeskOpen] = useState(false);
  const [code, setCode] = useState("");
  const [gateError, setGateError] = useState("");

  useEffect(() => {
    setOpen(false);
    setDeskOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open && !deskOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setDeskOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, deskOpen]);

  async function elevate(e: FormEvent) {
    e.preventDefault();
    setGateError("");
    const res = await openDesk({ data: { code } });
    if (!res.ok) {
      setGateError(res.error);
      return;
    }
    setDesk(res.role, res.token);
    setCode("");
    setDeskOpen(false);
  }

  function pickCustomer() {
    clearDesk();
    setCode("");
    setGateError("");
    setDeskOpen(false);
  }

  return (
    <div className="min-h-dvh max-w-[100vw] overflow-x-hidden bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="font-display shrink-0 text-lg tracking-[0.18em] text-fg sm:text-xl">
            SABLE.CO
          </Link>
          <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden">
            {nav.map((item) => {
              const active = isActivePath(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-xs tracking-[0.14em] uppercase transition-colors duration-[var(--motion-quick)]",
                    active ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="grid size-11 place-items-center text-fg"
              aria-label="Desk control"
              aria-expanded={deskOpen}
              onClick={() => {
                setDeskOpen(true);
                setOpen(false);
              }}
            >
              <span className="flex flex-col gap-[5px]" aria-hidden>
                <span className="block h-[1.5px] w-[18px] bg-current" />
                <span className="block h-[1.5px] w-[18px] bg-current" />
                <span className="block h-[1.5px] w-[18px] bg-current" />
              </span>
            </button>
            <button
              type="button"
              className="grid size-11 place-items-center text-fg md:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => {
                setOpen(true);
                setDeskOpen(false);
              }}
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      {deskOpen ? (
        <div className="fixed inset-0 z-50" data-desk-panel>
          <button
            type="button"
            className="absolute inset-0 bg-bg/70"
            aria-label="Dismiss desk"
            onClick={() => setDeskOpen(false)}
          />
          <div
            className="absolute right-0 top-0 z-10 flex w-[min(20rem,90vw)] flex-col border-l border-border bg-elevated pt-[env(safe-area-inset-top)] shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Desk control"
          >
            <div className="flex h-14 items-center justify-between px-4">
              <p className="text-xs tracking-[0.16em] uppercase text-muted">Desk</p>
              <button
                type="button"
                className="grid size-11 place-items-center"
                aria-label="Close desk"
                onClick={() => setDeskOpen(false)}
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <div className="space-y-1 px-3 pb-6">
              <p className="mb-2 px-1 text-sm">
                <span className="font-display text-lg tracking-[0.12em]">{ROLE_LABEL[role]}</span>
                <span className="ml-2 text-xs text-muted">open</span>
              </p>
              <ul className="space-y-0">
                {DESKS.map((desk) => (
                  <li key={desk.role} className="border-t border-border py-3">
                    <button
                      type="button"
                      className={cn(
                        "w-full text-left",
                        role === desk.role ? "text-fg" : "text-muted hover:text-fg",
                      )}
                      onClick={() => {
                        if (desk.role === "customer") pickCustomer();
                      }}
                    >
                      <p className="text-sm tracking-[0.06em]">
                        {ROLE_LABEL[desk.role]}
                        {role === desk.role ? " · open" : ""}
                      </p>
                      <p className="mt-1 text-xs text-subtle">{desk.does}</p>
                      {desk.code ? (
                        <p className="mt-1 text-xs tabular-nums text-muted">Code {desk.code}</p>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
              {atLeast(role, "sales") ? (
                <Button type="button" variant="outline" className="mt-3 w-full" onClick={pickCustomer}>
                  Back to customer
                </Button>
              ) : null}
              {!atLeast(role, "admin") ? (
                <form onSubmit={elevate} className="mt-4 space-y-3">
                  <Label htmlFor="shell-desk-code">Desk code</Label>
                  <Input
                    id="shell-desk-code"
                    type="password"
                    autoComplete="off"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={role === "customer" ? "0001" : "Manager / admin"}
                  />
                  {gateError ? <p className="text-sm text-leather">{gateError}</p> : null}
                  <Button type="submit" variant="outline" className="w-full">
                    Open desk
                  </Button>
                </form>
              ) : null}
              {atLeast(role, "manager") ? (
                <Button asChild variant="outline" className="mt-3 w-full">
                  <Link to="/build" onClick={() => setDeskOpen(false)}>
                    Open Build
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden" data-mobile-drawer>
          <button
            type="button"
            className="absolute inset-0 bg-bg/70"
            aria-label="Dismiss menu"
            onClick={() => setOpen(false)}
          />
          <nav
            className="absolute inset-y-0 right-0 z-10 flex w-[min(20rem,86vw)] flex-col border-l border-border bg-elevated pt-[env(safe-area-inset-top)]"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex h-14 items-center justify-between px-4">
              <p className="font-display text-lg tracking-[0.18em]">SABLE.CO</p>
              <button
                type="button"
                className="grid size-11 place-items-center"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <ul className="flex-1 space-y-1 overflow-y-auto px-3 pb-[calc(5rem+env(safe-area-inset-bottom))]">
              {menu.map((item) => {
                const Icon = ICONS[item.to] ?? LayoutGrid;
                const active = isActivePath(pathname, item.to);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm tracking-[0.12em] uppercase",
                        active ? "bg-bg text-fg" : "text-muted hover:text-fg",
                      )}
                    >
                      <Icon size={18} strokeWidth={1.6} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}

      {children}

      <footer className="border-t border-border pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-muted sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="font-display text-lg tracking-[0.18em] text-fg">SABLE.CO</p>
            <p className="mt-1">Our shoes · 2026</p>
          </div>
          <div className="max-w-sm sm:text-right">
            <p>{copy.deliveryNote}</p>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2 sm:justify-end">
              <Link to="/collection" className="hover:text-fg">
                Collection
              </Link>
              <Link to="/sizes" className="hover:text-fg">
                Size guide
              </Link>
              <Link to="/order" className="hover:text-fg">
                Order
              </Link>
              <Link to="/desk" className="hover:text-fg">
                Staff
              </Link>
            </p>
            <p className="mt-2">Prices as listed · Subject to availability</p>
          </div>
        </div>
      </footer>

      <nav
        data-mobile-nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
        aria-label="Primary"
      >
        <ul className={cn("mx-auto grid h-14 max-w-lg", tabs.length === 4 ? "grid-cols-4" : "grid-cols-3")}>
          {tabs.map((item) => {
            const Icon = ICONS[item.to] ?? LayoutGrid;
            const active = isActivePath(pathname, item.to);
            return (
              <li key={item.to} className="min-w-0">
                <Link
                  to={item.to}
                  className={cn(
                    "flex h-14 min-h-11 flex-col items-center justify-center gap-1 px-1 text-[10px] tracking-[0.1em] uppercase",
                    active ? "text-fg" : "text-muted",
                  )}
                >
                  <Icon size={18} strokeWidth={active ? 2 : 1.6} />
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
