import { ProductMarquee } from "@/components/ProductMarquee";
import { listProducts } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

async function getProductsSafely() {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    return [];
  }

  try {
    return await listProducts();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
    return [];
  }
}

export default async function HomePage() {
  const products = await getProductsSafely();
  const featured = products[Math.floor(Math.random() * products.length)];
  const marqueeProducts = [...products]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(products.length, 8));

  return (
    <main>
      <section className="bg-paper">
        <div className="mx-auto grid min-h-[82vh] max-w-7xl items-center gap-12 px-5 py-16 md:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">New Season</p>
            <h1 className="mt-5 max-w-xl font-display text-6xl font-semibold leading-[0.92] text-ink md:text-7xl">
              Elega
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-muted">
              A quieter kind of luxury: tailored essentials, soft statement pieces, and wardrobe details that hold attention without asking for it.
            </p>
            <Link
              className="focus-ring mt-9 inline-flex border-b border-gold pb-2 text-sm font-semibold uppercase tracking-[0.24em] text-ink transition hover:text-gold"
              href="#collection"
            >
              View collection
            </Link>
          </div>
          <div className="relative min-h-[560px] bg-ivory">
            {featured?.image_url ? (
              <Image
                alt={featured.name}
                className="absolute inset-0 h-full w-full object-cover"
                fill
                priority
                sizes="(min-width: 768px) 55vw, 100vw"
                src={featured.image_url}
              />
            ) : (
            <div className="absolute inset-8 grid place-items-center border border-line bg-paper">
              <Image
                alt="Dress placeholder"
                height={180}
                priority
                src="/product-placeholder.svg"
                width={180}
              />
            </div>
            )}
            <div className="absolute bottom-0 left-0 max-w-sm bg-paper px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                {featured?.category || "Editorial Selection"}
              </p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">
                {featured?.name || "Built for the first collection"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="collection" className="bg-paper py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">The Collection</p>
              <h2 className="mt-3 font-display text-5xl font-semibold text-ink">Current pieces</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-muted">
              Each item is loaded from the FastAPI catalog. When the backend wakes slowly, this space stays composed.
            </p>
          </div>
        </div>

        {marqueeProducts.length > 0 ? (
          <div className="mt-12">
            <ProductMarquee products={marqueeProducts} />
          </div>
        ) : (
          <div className="mx-auto mt-12 max-w-7xl border border-line bg-ivory px-6 py-12 text-center">
            <Image
              alt="Dress placeholder"
              className="mx-auto"
              height={128}
              src="/product-placeholder.svg"
              width={128}
            />
            <p className="mt-6 font-display text-3xl font-semibold text-ink">No pieces are available yet.</p>
            <p className="mt-3 text-sm text-muted">
              Add active products in the backend and they will appear here automatically.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
