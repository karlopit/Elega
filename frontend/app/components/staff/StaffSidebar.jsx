"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Shirt } from "lucide-react";
import { useStore } from "@/context/StoreContext";

const SECTIONS = [
  { href: "/staff/men", label: "MEN" },
  { href: "/staff/women", label: "WOMEN" },
  { href: "/staff/kids", label: "KIDS" }
];

export function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useStore();

  function handleLogout() {
    signOut();
    router.push("/account");
  }

  return (
    <aside className="sticky top-0 flex min-h-screen w-full flex-col border-r border-line bg-ivory p-5 md:w-72">
      <Link className="font-display text-4xl font-semibold text-ink" href="/staff/men">
        Elega
      </Link>
      <nav className="mt-12 space-y-2">
        {SECTIONS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              className={`focus-ring flex items-center gap-3 border px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                active
                  ? "border-gold bg-paper text-ink"
                  : "border-transparent text-muted hover:border-line hover:text-gold"
              }`}
              href={item.href}
              key={item.href}
            >
              <Shirt size={17} />
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
