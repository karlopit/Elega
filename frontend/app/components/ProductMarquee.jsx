"use client";

import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/format";

export function ProductMarquee({ products }) {
  if (!products || products.length === 0) {
    return null;
  }

  // Duplicate the list so the track can loop seamlessly from 0% to -50%.
  const track = [...products, ...products];

  return (
    <div className="marquee-wrap overflow-hidden">
      <div className="marquee-track flex w-max gap-6">
        {track.map((product, index) => (
          <Link
            className="focus-ring group block w-[220px] flex-shrink-0 sm:w-[260px]"
            href="#collection"
            key={`${product.id}-${index}`}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-ivory">
              <Image
                alt={product.name}
                className="object-cover transition duration-700 group-hover:scale-[1.035]"
                fill
                sizes="260px"
                src={product.image_url || "/product-placeholder.svg"}
              />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {product.category || "Atelier"}
            </p>
            <p className="mt-1 truncate font-display text-xl font-semibold text-ink">{product.name}</p>
            <p className="mt-1 text-sm text-muted">{formatMoney(product.price, product.currency)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}