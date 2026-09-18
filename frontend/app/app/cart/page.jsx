"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatMoney } from "@/lib/format";
import { listProducts } from "@/lib/api";
import { CheckoutModal } from "@/components/CheckoutModal";

export default function CartPage() {
  const { auth, cartItems, removeFromCart } = useStore();
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [checkoutItems, setCheckoutItems] = useState([]);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((error) => {
        console.error(error);
        setMessage("We could not load product details right now.");
      });
  }, []);

  const cartRows = useMemo(
    () =>
      cartItems.map((item) => ({
        ...item,
        product: products.find((product) => product.id === item.product_id)
      })),
    [cartItems, products]
  );

  const currency = cartRows.find((row) => row.product)?.product.currency || "PHP";
  const subtotal = cartRows.reduce(
    (total, row) => total + Number(row.product?.price || 0) * row.quantity,
    0
  );

  return (
    <main className="bg-paper px-5 py-16 lg:px-10">
      <section className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">Fitting Room</p>
        <h1 className="mt-4 font-display text-5xl font-semibold text-ink">Your selections</h1>

        {cartRows.length === 0 ? (
          <div className="mt-10 border border-line bg-ivory px-6 py-12">
            <p className="font-display text-3xl font-semibold text-ink">Your fitting room is empty.</p>
            <Link className="mt-6 inline-flex border-b border-gold pb-2 text-sm font-semibold uppercase tracking-[0.22em]" href="/#collection">
              Return to collection
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="divide-y divide-line border-y border-line">
              {cartRows.map((row) => (
                <div className="grid grid-cols-[88px_1fr] gap-5 py-6 md:grid-cols-[88px_1fr_auto]" key={row.product_id}>
                  <div className="relative aspect-[4/5] bg-ivory">
                    {row.product?.image_url ? (
                      <Image
                        alt={row.product.name}
                        className="object-cover"
                        fill
                        sizes="88px"
                        src={row.product.image_url}
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-display text-2xl font-semibold text-ink">
                      {row.product?.name || "Catalog item"}
                    </p>
                    <p className="mt-2 text-sm text-muted">Quantity {row.quantity}</p>
                    <p className="mt-2 text-sm font-semibold text-gold">
                      {formatMoney(row.product?.price, row.product?.currency)}
                    </p>
                  </div>
                  <div className="col-span-2 flex gap-3 md:col-span-1 md:flex-col">
                    <button
                      className="focus-ring border border-gold bg-ink px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-paper transition hover:bg-paper hover:text-gold"
                      onClick={() => setCheckoutItems([row])}
                      type="button"
                    >
                      Buy
                    </button>
                    <button
                      className="focus-ring inline-flex items-center justify-center gap-2 border border-line px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:border-gold hover:text-gold"
                      onClick={() => removeFromCart(row.product_id)}
                      type="button"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <aside className="border border-line bg-ivory p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Cart Summary</p>
              <div className="mt-5 flex justify-between border-b border-line pb-5 text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold text-ink">{formatMoney(subtotal, currency)}</span>
              </div>
              {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
              {!auth ? (
                <Link className="focus-ring mt-6 flex justify-center border border-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em]" href="/account">
                  Sign in to checkout
                </Link>
              ) : (
                <button
                  className="focus-ring mt-6 w-full border border-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] transition hover:text-gold"
                  onClick={() => setCheckoutItems(cartRows)}
                  type="button"
                >
                  Buy all
                </button>
              )}
            </aside>
          </div>
        )}
      </section>
      <CheckoutModal
        items={checkoutItems}
        onClose={() => setCheckoutItems([])}
        open={checkoutItems.length > 0}
      />
    </main>
  );
}
