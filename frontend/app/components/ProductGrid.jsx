"use client";

import { ProductCard } from "@/components/ProductCard";

export function ProductGrid({ products, eyebrow, title, emptyText }) {
  return (
    <main className="bg-paper px-5 py-14 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 border-b border-line pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">{eyebrow}</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-ink">{title}</h1>
          </div>
          <p className="max-w-md text-sm leading-7 text-muted">
            Choose a piece, buy directly, or place it in your cart while you continue browsing.
          </p>
        </div>

        {products.length > 0 ? (
          <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-10 border border-line bg-ivory px-6 py-12 text-center">
            <p className="font-display text-3xl font-semibold text-ink">{emptyText}</p>
            <p className="mt-3 text-sm text-muted">Products added by staff will appear here automatically.</p>
          </div>
        )}
      </section>
    </main>
  );
}
