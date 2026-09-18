import { ProductGrid } from "@/components/ProductGrid";
import { listProducts } from "@/lib/api";

async function getKidsProducts() {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    return [];
  }

  try {
    const products = await listProducts();
    return products.filter((product) => product.category?.toUpperCase() === "KIDS");
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
    return [];
  }
}

export default async function KidsPage() {
  const products = await getKidsProducts();

  return (
    <ProductGrid
      emptyText="No kids products are available yet."
      eyebrow="Kids"
      products={products}
      title="Kids collection"
    />
  );
}
