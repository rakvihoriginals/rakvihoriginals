import { fetchProductsBySubcategoryIds, type StoreProduct } from "@/lib/fetchProducts";
import EyewearPage from "./ProductListingClient";

export default async function Page() {
  const initialProducts: StoreProduct[] = await fetchProductsBySubcategoryIds([8]);
  return <EyewearPage initialProducts={initialProducts} />;
}
