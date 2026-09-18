"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useStore } from "@/context/StoreContext";
import { listStaffHistory, listUserHistory } from "@/lib/api";

function formatDate(value) {
  return value ? new Date(value).toLocaleString("en-PH") : "";
}

export default function AdminHistoryPage() {
  const router = useRouter();
  const { auth, authReady } = useStore();
  const [activeTab, setActiveTab] = useState("staff");
  const [staffRows, setStaffRows] = useState([]);
  const [userRows, setUserRows] = useState([]);
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

    Promise.all([
      listStaffHistory(auth.access_token),
      listUserHistory(auth.access_token)
    ])
      .then(([staff, users]) => {
        setStaffRows(staff);
        setUserRows(users);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load history.");
      });
  }, [auth, authReady, router]);

  return (
    <main className="min-h-screen bg-paper md:flex">
      <AdminSidebar />
      <section className="flex-1 px-5 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">Admin</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-ink">History</h1>

          <div className="mt-8 inline-grid grid-cols-2 border border-line bg-ivory p-1">
            {["staff", "users"].map((tab) => (
              <button
                className={`focus-ring px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] ${
                  activeTab === tab ? "bg-ink text-paper" : "text-muted"
                }`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {tab === "staff" ? "Staff" : "User"}
              </button>
            ))}
          </div>

          {error ? <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <div className="mt-8 overflow-x-auto border border-line bg-ivory">
            {activeTab === "staff" ? (
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-[0.18em] text-muted">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Transaction</th>
                    <th className="px-4 py-3">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {staffRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-4 font-mono text-xs text-muted">{row.staff_id}</td>
                      <td className="px-4 py-4 font-semibold text-ink">{row.name || "Staff"}</td>
                      <td className="px-4 py-4 text-muted">{row.transaction}</td>
                      <td className="px-4 py-4 text-muted">{formatDate(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-[0.18em] text-muted">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {userRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-4 font-mono text-xs text-muted">{row.user_id}</td>
                      <td className="px-4 py-4 font-semibold text-ink">{row.name || "User"}</td>
                      <td className="px-4 py-4 text-muted">{row.product}</td>
                      <td className="px-4 py-4 text-muted">{row.quantity}</td>
                      <td className="px-4 py-4 text-muted">{formatDate(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
