import { ProductGrid } from "@/components/ProductGrid";
import { listProducts } from "@/lib/api";

async function getProducts(searchTerm) {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    return [];
  }

  try {
    const products = await listProducts();
    const query = searchTerm?.toLowerCase().trim();

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.description, product.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
    return [];
  }
}

export default async function ShopPage({ searchParams }) {
  const products = await getProducts(searchParams?.q);

  return (
    <ProductGrid
      emptyText="No products match this view yet."
      eyebrow="Shop"
      products={products}
      title={searchParams?.q ? `Search: ${searchParams.q}` : "All available pieces"}
    />
  );
}
