"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/staff")) {
    return null;
  }

  return (
    <footer className="border-t border-line bg-ivory">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm text-muted md:grid-cols-[1.4fr_1fr_1fr] lg:px-10">
        <div>
          <p className="font-display text-3xl font-semibold text-ink">Elega</p>
          <p className="mt-3 max-w-sm leading-7">
            Refined clothing selected for quiet confidence, clean lines, and an enduring wardrobe.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink">Client Care</p>
          <p className="mt-3 leading-7">Shipping, exchanges, and order support are handled through your account.</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink">Palette</p>
          <p className="mt-3 leading-7">White space, soft tailoring, and gold details kept deliberately restrained.</p>
        </div>
      </div>
    </footer>
  );
}
