"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useStore } from "@/context/StoreContext";
import { getAdminDashboard } from "@/lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const { auth, authReady } = useStore();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authReady) {
      return;
    }
    if (!auth) {
      router.push("/account");
      return;
    }
    if (auth.role !== "admin") {
      router.push("/shop");
      return;
    }

    getAdminDashboard(auth.access_token)
      .then(setStats)
      .catch((err) => {
        console.error(err);
        setError("Unable to load dashboard.");
      });
  }, [auth, authReady, router]);

  const maxQuantity = Math.max(...(stats?.top_sold_products || []).map((item) => item.quantity), 1);

  return (
    <main className="min-h-screen bg-paper md:flex">
      <AdminSidebar />
      <section className="flex-1 px-5 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">Admin</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-ink">Dashboard</h1>

          {error ? <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="border border-line bg-ivory p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Sold quantity</p>
              <p className="mt-4 font-display text-5xl font-semibold text-ink">{stats?.sold_quantity ?? 0}</p>
            </div>
            <div className="border border-line bg-ivory p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Available products</p>
              <p className="mt-4 font-display text-5xl font-semibold text-ink">{stats?.available_products ?? 0}</p>
            </div>
            <div className="border border-line bg-ivory p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Top products tracked</p>
              <p className="mt-4 font-display text-5xl font-semibold text-ink">{stats?.top_sold_products?.length ?? 0}</p>
            </div>
          </div>

          <section className="mt-10 border border-line bg-ivory p-6">
            <div className="flex items-end justify-between gap-4 border-b border-line pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Graph</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Top 10 sold products</h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {(stats?.top_sold_products || []).length > 0 ? (
                stats.top_sold_products.map((product) => (
                  <div className="grid gap-2 md:grid-cols-[220px_1fr_64px] md:items-center" key={product.product_id}>
                    <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
                    <div className="h-3 bg-paper">
                      <div
                        className="h-full bg-gold"
                        style={{ width: `${Math.max(8, (product.quantity / maxQuantity) * 100)}%` }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-muted md:text-right">{product.quantity}</p>
                  </div>
                ))
              ) : (
                <p className="py-8 text-sm text-muted">No sold products yet.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
