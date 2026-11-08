import { fetchProductsBySubcategoryIds, type StoreProduct } from "@/lib/fetchProducts";
import StolesPage from "./ProductListingClient";

export default async function Page() {
  const initialProducts: StoreProduct[] = await fetchProductsBySubcategoryIds([9]);
  return <StolesPage initialProducts={initialProducts} />;
}
