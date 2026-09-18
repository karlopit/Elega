import { ProductGrid } from "@/components/ProductGrid";
import { listProducts } from "@/lib/api";

async function getMenProducts() {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    return [];
  }

  try {
    const products = await listProducts();
    return products.filter((product) => product.category?.toUpperCase() === "MEN");
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
    return [];
  }
}

export default async function MenPage() {
  const products = await getMenProducts();

  return (
    <ProductGrid
      emptyText="No men products are available yet."
      eyebrow="Men"
      products={products}
      title="Men's collection"
    />
  );
}
