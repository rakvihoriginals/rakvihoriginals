import { fetchProductsBySubcategoryIds, type StoreProduct } from "@/lib/fetchProducts";
import HandbagsPage from "./ProductListingClient";

export default async function Page() {
  const initialProducts: StoreProduct[] = await fetchProductsBySubcategoryIds([7]);
  return <HandbagsPage initialProducts={initialProducts} />;
}
