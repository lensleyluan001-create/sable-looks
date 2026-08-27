export type Role = "customer" | "sales" | "manager" | "admin";

export type AppPath =
  | "/"
  | "/collection"
  | "/sizes"
  | "/order"
  | "/enquire"
  | "/floor"
  | "/capture"
  | "/desk"
  | "/factory"
  | "/memory"
  | "/build";

export type NavLink = { to: AppPath; label: string };

const RANK: Record<Role, number> = {
  customer: 0,
  sales: 1,
  manager: 2,
  admin: 3,
};

export function atLeast(role: Role, need: Role) {
  return RANK[role] >= RANK[need];
}

export const ROLE_LABEL: Record<Role, string> = {
  customer: "Customer",
  sales: "Sales",
  manager: "Manager",
  admin: "Admin",
};

export const DESKS: {
  role: Role;
  code: string | null;
  does: string;
}[] = [
  { role: "customer", code: null, does: "Lookbook and order. No capture. Default on open." },
  { role: "sales", code: "0001", does: "Floor, capture, invoices. Cannot assign deals." },
  { role: "manager", code: "last", does: "Assign deals. Commission. Memory. No catalogue edits." },
  { role: "admin", code: "4181", does: "Full house. Build, prices, names, page copy." },
];

export const PUBLIC_NAV: NavLink[] = [
  { to: "/", label: "House" },
  { to: "/collection", label: "Collection" },
  { to: "/sizes", label: "Sizes" },
  { to: "/order", label: "Order" },
];

export const SALES_NAV: NavLink[] = [
  { to: "/", label: "House" },
  { to: "/collection", label: "Collection" },
  { to: "/floor", label: "Floor" },
  { to: "/sizes", label: "Sizes" },
  { to: "/order", label: "Order" },
  { to: "/enquire", label: "Enquire" },
  { to: "/desk", label: "Desk" },
];

export const FLOOR_NAV: NavLink[] = [
  { to: "/", label: "House" },
  { to: "/collection", label: "Collection" },
  { to: "/floor", label: "Floor" },
  { to: "/factory", label: "Factory" },
  { to: "/memory", label: "Memory" },
  { to: "/sizes", label: "Sizes" },
  { to: "/order", label: "Order" },
  { to: "/enquire", label: "Enquire" },
  { to: "/desk", label: "Desk" },
  { to: "/build", label: "Build" },
];

export const ADMIN_NAV = FLOOR_NAV;

export const PUBLIC_TABS: NavLink[] = [
  { to: "/", label: "House" },
  { to: "/collection", label: "Book" },
  { to: "/order", label: "Order" },
];

export const SALES_TABS: NavLink[] = [
  { to: "/floor", label: "Floor" },
  { to: "/capture", label: "Capture" },
  { to: "/order", label: "Order" },
];

export const FLOOR_TABS: NavLink[] = [
  { to: "/floor", label: "Floor" },
  { to: "/capture", label: "Capture" },
  { to: "/build", label: "Build" },
];

export function phoneTabs(role: Role, hasDesk: boolean): NavLink[] {
  if (!hasDesk || role === "customer") return PUBLIC_TABS;
  if (atLeast(role, "manager")) return FLOOR_TABS;
  return SALES_TABS;
}

export function drawerItems(nav: NavLink[], hasDesk: boolean): NavLink[] {
  const items = nav.map((n) => ({ ...n }));
  if (hasDesk && !items.some((i) => i.to === "/capture")) {
    const i = items.findIndex((x) => x.to === "/floor");
    items.splice(i >= 0 ? i + 1 : items.length, 0, { to: "/capture", label: "Capture" });
  }
  if (hasDesk && !items.some((i) => i.to === "/desk")) {
    items.push({ to: "/desk", label: "Desk" });
  }
  return items;
}
