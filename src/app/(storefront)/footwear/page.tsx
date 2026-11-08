import { fetchProductsBySubcategoryIds, type StoreProduct } from "@/lib/fetchProducts";
import FootwearPage from "./ProductListingClient";

export default async function Page() {
  const initialProducts: StoreProduct[] = await fetchProductsBySubcategoryIds([1, 13]);
  return <FootwearPage initialProducts={initialProducts} />;
}
