import { fetchProductsBySubcategoryIds, type StoreProduct } from "@/lib/fetchProducts";
import BeltsPage from "./ProductListingClient";

export default async function Page() {
  const initialProducts: StoreProduct[] = await fetchProductsBySubcategoryIds([12, 55]);
  return <BeltsPage initialProducts={initialProducts} />;
}
