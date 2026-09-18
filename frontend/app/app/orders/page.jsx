"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { formatMoney } from "@/lib/format";
import { listOrders } from "@/lib/api";

export default function OrdersPage() {
  const { auth } = useStore();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!auth) {
      return;
    }

    listOrders(auth.user_id, auth.access_token)
      .then(setOrders)
      .catch((error) => {
        console.error(error);
        setMessage("We could not load your orders right now.");
      });
  }, [auth]);

  if (!auth) {
    return (
      <main className="bg-paper px-5 py-16 lg:px-10">
        <section className="mx-auto max-w-4xl border border-line bg-ivory px-6 py-12">
          <p className="font-display text-4xl font-semibold text-ink">Sign in to view orders.</p>
          <Link className="mt-6 inline-flex border-b border-gold pb-2 text-sm font-semibold uppercase tracking-[0.22em]" href="/account">
            Go to account
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-paper px-5 py-16 lg:px-10">
      <section className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">Orders</p>
        <h1 className="mt-4 font-display text-5xl font-semibold text-ink">Purchase history</h1>
        {message ? <p className="mt-6 text-sm text-muted">{message}</p> : null}
        <div className="mt-10 divide-y divide-line border-y border-line">
          {orders.length > 0 ? (
            orders.map((order) => (
              <article className="grid gap-4 py-6 md:grid-cols-[1fr_auto]" key={order.id}>
                <div>
                  <p className="font-display text-2xl font-semibold text-ink">Order {order.id}</p>
                  <p className="mt-2 text-sm text-muted">{order.shipping_address}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold">{order.status}</p>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {formatMoney(order.total_amount, order.currency)}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <p className="py-10 text-sm text-muted">No orders yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
