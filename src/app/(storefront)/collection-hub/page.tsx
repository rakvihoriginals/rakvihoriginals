import { fetchProductsBySubcategoryIds, fetchAllCollectionProducts, type StoreProduct } from "@/lib/fetchProducts";
import CollectionHubPage from "./ProductListingClient";

export default async function Page() {
  const initialProducts: StoreProduct[] = await fetchAllCollectionProducts();
  return <CollectionHubPage initialProducts={initialProducts} />;
}
