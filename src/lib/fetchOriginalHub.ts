import { supabase } from "@/lib/supabase";
import {
  fetchBrands,
  fetchAttributesMap,
  mapRawProduct,
  SUBCATEGORY_NAMES,
  type StoreProduct,
} from "@/lib/fetchProducts";

export type HubSubcategory = { id: number; name: string };
export type HubData = { products: StoreProduct[]; subcategories: HubSubcategory[] };

const HUB_CATEGORY_NAME = "the original hub";
const CACHE_TTL_MS = 3 * 60 * 1000;
const HUB_TAB_LABELS: Record<number, string> = {
  68: "Handbags & Slings",
  69: "Trolleys & Duffles",
  70: "Slings & Laptop Bags",
  71: "Backpacks",
  73: "Footwear",
  74: "Belts",
  75: "Stoles & Scarves",
};

let hubCache: { data: HubData; timestamp: number } | null = null;

export async function fetchOriginalHub(): Promise<HubData> {
  if (hubCache && Date.now() - hubCache.timestamp < CACHE_TTL_MS) return hubCache.data;

  const { data: categories, error: categoryError } = await supabase.from("categories").select("id, name");
  if (categoryError || !categories) {
    console.error("Error fetching categories for Original Hub:", categoryError?.message);
    return { products: [], subcategories: [] };
  }

  const hubCategory = categories.find(
    (category: { id: number; name: string }) => category.name?.trim().toLowerCase() === HUB_CATEGORY_NAME
  );
  if (!hubCategory) return { products: [], subcategories: [] };

  const [{ data: subcats }, { data: dbProducts, error }, brandMap, attrMap] = await Promise.all([
    supabase.from("subcategories").select("id, name").eq("category_id", hubCategory.id),
    supabase
      .from("products")
      .select(`
        id,
        name,
        sku,
        brand_id,
        gender,
        subcategory_id,
        category_id,
        active,
        product_images (id, image_url),
        product_variations (id, price, sale_price, size_id, color_id, stock)
      `)
      .eq("category_id", hubCategory.id)
      .eq("active", true)
      .order("id", { ascending: false })
      .not("product_images.image_url", "imatch", "[.](mp4|mov|webm|m4v)($|[?])")
      .order("id", { referencedTable: "product_images", ascending: true })
      .limit(1, { referencedTable: "product_images" }),
    fetchBrands(),
    fetchAttributesMap(),
  ]);

  if (error || !dbProducts) {
    console.error("Error fetching Original Hub products:", error?.message);
    return { products: [], subcategories: [] };
  }

  const subcategories: HubSubcategory[] = (subcats || []).map((subcategory: HubSubcategory) => ({
    id: subcategory.id,
    name: HUB_TAB_LABELS[subcategory.id] || subcategory.name.trim(),
  }));
  const subcategoryNames = new Map(subcategories.map((subcategory) => [subcategory.id, subcategory.name]));
  const products = dbProducts.map((item: Parameters<typeof mapRawProduct>[0]) => {
    const product = mapRawProduct(item, brandMap, attrMap);
    if (product.subcategoryId && !SUBCATEGORY_NAMES[product.subcategoryId] && subcategoryNames.has(product.subcategoryId)) {
      const name = subcategoryNames.get(product.subcategoryId)!;
      product.subcategoryName = name;
      product.material = name;
    }
    return product;
  });

  const data = { products, subcategories };
  hubCache = { data, timestamp: Date.now() };
  return data;
}
