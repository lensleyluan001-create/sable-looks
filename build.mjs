#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const run = (cmd) =>
  execSync(cmd, { stdio: "inherit", cwd: root, env: process.env, shell: true });

const BASE =
  "https://raw.githubusercontent.com/lensleyluan001-create/sable-looks/main";

console.log("[sable] fetch house.tgz");
run(`curl -fsSL "${BASE}/house.tgz" -o house.tgz`);
run("tar xzf house.tgz");

const map = [
  ["src/lib/access.ts", "patch/access.ts"],
  ["src/lib/desk.server.ts", "patch/desk.server.ts"],
  ["src/lib/house-orders.ts", "patch/house-orders.ts"],
  ["src/lib/orders.ts", "patch/orders.ts"],
  ["src/lib/store.ts", "patch/store.ts"],
  ["src/lib/copy.ts", "patch/copy.ts"],
  ["src/lib/memory.ts", "patch/memory.ts"],
  ["src/lib/orders.server.ts", "patch/orders.server.ts"],
  ["src/lib/bots.ts", "patch/bots.ts"],
  ["src/lib/bot-roster.ts", "patch/bot-roster.ts"],
  ["src/routes/desk.tsx", "patch/desk.tsx"],
  ["src/routes/floor.tsx", "patch/floor.tsx"],
  ["src/routes/index.tsx", "patch/index.tsx"],
  ["src/routes/order.tsx", "patch/order.tsx"],
  ["src/routes/thanks.tsx", "patch/thanks.tsx"],
  ["src/routes/leads.$id.tsx", "patch/leads.$id.tsx"],
  ["src/routes/invoices.$id.tsx", "patch/invoices.$id.tsx"],
  ["src/components/shell.tsx", "patch/shell.tsx"],
  ["src/components/staff-gate.tsx", "patch/staff-gate.tsx"],
  ["migrations/0003_order_paid.sql", "patch/0003_order_paid.sql"],
];

for (const [dest, src] of map) {
  const local = join(root, src);
  if (existsSync(local)) {
    mkdirSync(dirname(join(root, dest)), { recursive: true });
    writeFileSync(join(root, dest), readFileSync(local));
    console.log("[sable] overlay local", dest);
    continue;
  }
  try {
    execSync(`curl -fsSL "${BASE}/${src}" -o "${dest}"`, {
      cwd: root,
      stdio: "inherit",
    });
    console.log("[sable] overlay remote", dest);
  } catch {
    console.log("[sable] skip", src);
  }
}

console.log("[sable] npm install");
run("npm install --omit=dev=false");
console.log("[sable] vite build + migrate");
run("node scripts/with-app-env.mjs vite build");
run("node scripts/migrate.mjs");
console.log("[sable] build done");
