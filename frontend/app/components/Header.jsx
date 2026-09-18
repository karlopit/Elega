"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingBag, UserRound } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, cartItems, signOut } = useStore();
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/staff")) {
    return null;
  }

  function handleSearch(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get("search")?.toString().trim();
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-4 lg:flex-nowrap lg:px-10">
        <Link href="/" className="font-display text-3xl font-semibold tracking-wide text-ink">
          Elega
        </Link>

        <form className="order-3 flex w-full items-center border border-line bg-ivory px-4 py-2 lg:order-none lg:ml-4 lg:max-w-sm" onSubmit={handleSearch}>
          <Search className="text-muted" size={16} />
          <input
            className="focus-ring ml-3 w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            name="search"
            placeholder="Search products"
            type="search"
          />
        </form>

        <nav className="ml-auto flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted sm:gap-6">
          <Link className="transition hover:text-gold" href="/men">
            Men
          </Link>
          <Link className="transition hover:text-gold" href="/women">
            Women
          </Link>
          <Link className="transition hover:text-gold" href="/kids">
            Kids
          </Link>
          <Link className="hidden transition hover:text-gold sm:inline" href="/orders">
            Orders
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {auth ? (
            <button
              className="focus-ring hidden text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:text-gold md:inline"
              onClick={signOut}
              type="button"
            >
              Sign out
            </button>
          ) : (
            <Link
              aria-label="Sign in"
              className="focus-ring rounded-full border border-line p-2 text-ink transition hover:border-gold hover:text-gold"
              href="/account"
            >
              <UserRound size={18} />
            </Link>
          )}
          <Link
            aria-label="Open cart"
            className="focus-ring relative rounded-full border border-line p-2 text-ink transition hover:border-gold hover:text-gold"
            href="/cart"
          >
            <ShoppingBag size={18} />
            <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full border border-paper bg-ink px-1 text-[10px] font-semibold text-paper">
              {itemCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
