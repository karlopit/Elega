import { ProductGrid } from "@/components/ProductGrid";
import { listProducts } from "@/lib/api";

async function getWomenProducts() {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    return [];
  }

  try {
    const products = await listProducts();
    return products.filter((product) => product.category?.toUpperCase() === "WOMEN");
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
    return [];
  }
}

export default async function WomenPage() {
  const products = await getWomenProducts();

  return (
    <ProductGrid
      emptyText="No women products are available yet."
      eyebrow="Women"
      products={products}
      title="Women's collection"
    />
  );
}
