"use client";

import Image from "next/image";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useStore } from "@/context/StoreContext";
import { formatMoney } from "@/lib/format";

export function ProductCard({ product }) {
  const { addToCart } = useStore();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const image = product.image_url || "/product-placeholder.svg";

  return (
    <>
      <article className="group">
        <div className="relative aspect-[4/5] overflow-hidden bg-ivory">
          <Image
            alt={product.name}
            className="object-cover transition duration-700 group-hover:scale-[1.035]"
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            src={image}
          />
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
              {product.category || "Atelier"}
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-ink">{product.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{product.description}</p>
          </div>
          <p className="whitespace-nowrap pt-8 text-sm font-semibold text-ink">
            {formatMoney(product.price, product.currency)}
          </p>
        </div>
        <div className="mt-5 grid grid-cols-[0.8fr_1.2fr] gap-3">
          <button
            className="focus-ring border border-gold bg-ink px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-paper transition hover:bg-paper hover:text-gold"
            onClick={() => setCheckoutOpen(true)}
            type="button"
          >
            Buy
          </button>
          <button
            className="focus-ring inline-flex items-center justify-center gap-2 border border-line px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition hover:border-gold hover:text-gold"
            onClick={() => addToCart(product)}
            type="button"
          >
            <ShoppingBag size={15} />
            Add to cart
          </button>
        </div>
      </article>
      <CheckoutModal
        items={[{ product_id: product.id, quantity: 1 }]}
        onClose={() => setCheckoutOpen(false)}
        open={checkoutOpen}
      />
    </>
  );
}
