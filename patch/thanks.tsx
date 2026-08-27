import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { liveBySku, useLiveProducts } from "@/lib/live";

type Search = { sku?: string; name?: string };

export const Route = createFileRoute("/thanks")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    sku: typeof s.sku === "string" ? s.sku : undefined,
    name: typeof s.name === "string" ? s.name : undefined,
  }),
  component: ThanksPage,
});

function ThanksPage() {
  const { sku, name } = Route.useSearch();
  const products = useLiveProducts();
  const product = sku ? liveBySku(products, sku) : null;
  const who = name?.trim() ? name.trim().split(/\s+/)[0] : "there";

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-xs tracking-[0.24em] uppercase text-muted">SABLE.CO</p>
      <h1 className="font-display mt-3 text-4xl sm:text-6xl">We have it, {who}.</h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
        The request is on the floor. A salesperson will confirm the pair is on the
        bench, then WhatsApp EFT. The order is confirmed when you pay. Listed price.
        Subject to availability.
      </p>
      {product ? (
        <div className="mt-10 overflow-hidden rounded-[var(--radius-xl)] bg-elevated">
          <img
            src={product.image}
            alt={`${product.sku} ${product.look}`}
            className="aspect-[16/9] w-full object-cover"
          />
          <div className="px-5 py-4">
            <p className="font-display text-2xl tabular-nums">{product.sku}</p>
            <p className="text-xs tracking-[0.12em] uppercase text-muted">{product.look}</p>
          </div>
        </div>
      ) : null}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link to="/collection">Back to the book</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
          <Link to="/">House</Link>
        </Button>
      </div>
    </main>
  );
}
