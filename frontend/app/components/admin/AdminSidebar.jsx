"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, History, LogOut, QrCode, Users } from "lucide-react";
import { useStore } from "@/context/StoreContext";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin#payment-qr", label: "Payment QR", icon: QrCode },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/history", label: "History", icon: History }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useStore();
  const [hash, setHash] = useState("");

  useEffect(() => {
    function updateHash() {
      setHash(window.location.hash);
    }

    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  function handleLogout() {
    signOut();
    router.push("/account");
  }

  return (
    <aside className="sticky top-0 flex min-h-screen w-full flex-col border-r border-line bg-ivory p-5 md:w-72">
      <Link className="font-display text-4xl font-semibold text-ink" href="/admin">
        Elega
      </Link>
      <nav className="mt-12 space-y-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const [itemPath, itemHash] = item.href.split("#");
          const active = itemHash ? pathname === itemPath && hash === `#${itemHash}` : pathname === itemPath && !hash;
          return (
            <Link
              className={`focus-ring flex items-center gap-3 border px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition ${
                active
                  ? "border-gold bg-paper text-ink"
                  : "border-transparent text-muted hover:border-line hover:text-gold"
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        className="focus-ring mt-auto flex items-center gap-3 border border-line px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-gold hover:text-gold"
        onClick={handleLogout}
        type="button"
      >
        <LogOut size={17} />
        Log out
      </button>
    </aside>
  );
}
