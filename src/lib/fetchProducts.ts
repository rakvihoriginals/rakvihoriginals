import { supabase } from "./supabase";

export interface ProductVariant {
  id: number;
  sizeId?: number | null;
  sizeName: string;
  colorId?: number | null;
  price: number;
  salePrice?: number | null;
  stock: number;
  displayPrice: string;
  originalPrice?: string;
  discountPercent?: number;
  isSale: boolean;
}

export interface StoreProduct {
  id: number | string;
  name: string;
  sku?: string;
  brandId?: number | null;
  brandName: string;
  gender: string;
  subcategoryId?: number | null;
  subcategoryName?: string;
  categoryId?: number | null;
  categoryName?: string;
  images: string[];
  img: string;
  secondaryImg?: string;
  priceValue: number;
  originalPriceValue?: number;
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  isSale: boolean;
  tag: string;
  material: string;
  description?: string;
  active: boolean;
  videoUrl?: string;
  variants: ProductVariant[];
  selectedVariant?: ProductVariant;
}

export interface BrandItem {
  id: number;
  name: string;
  altText?: string;
  imageUrl?: string;
}

// Fallback comprehensive Brand Map covering all active brands in database
export const ALL_BRANDS_MAP: Record<number, string> = {
  1: "L.V",
  2: "Goy@rd",
  3: "Co@ch",
  4: "Gucc!",
  6: "B@rberry",
  7: "Ch@nel",
  8: "Hublot",
  10: "Boss",
  12: "christian louboutin",
  16: "Tom ford",
  17: "Philipp Plein",
  18: "M.K",
  19: "Tory burch",
  20: "Herme$",
  21: "Mont blanc",
  22: "Y$L",
  23: "Ch!oe",
  24: "Pr@da",
  25: "D!or",
  26: "Vers@ce",
  28: "D$G",
  29: "Fend!",
  30: "Bally",
  32: "Cel!ne",
  33: "Vanelt!no",
  34: "L()ewe",
  35: "C@rtier",
  36: "SALVATORE FERR@GAMO",
  37: "MIU.MIU",
  38: "BOTTEGA.VENETA",
  39: "B@LMAIN PARIS",
};

export const SUBCATEGORY_NAMES: Record<number, string> = {
  1: "Footwear - Homme",
  3: "Cards & Passport Holders",
  4: "Wallets - Femme",
  5: "Wallets - Homme",
  6: "Backpacks & Duffle Bags",
  7: "Haute Handbags",
  8: "Haute Sunglasses",
  9: "Luxury Stoles",
  10: "Slings & Messenger Bags",
  12: "Signature Belts",
  13: "Footwear - Femme",
  43: "Charms & Keychains",
  55: "Belts - Femme",
  66: "Caps & Headwear",
  68: "Handbags & Slings",
  69: "Trolleys & Travel Bags",
  70: "Unisex Slings & Laptop Bags",
  71: "Maison Backpacks",
  73: "Footwear - Luxury Runner",
  74: "Belts - The Hub",
  75: "Stoles & Scarves",
};

export const ATTRIBUTE_SIZE_FALLBACKS: Record<number, string> = {
  50: "100 CMS",
  51: "115 CMS",
  52: "105 CMS",
  53: "120 CMS",
  54: "125 CMS",
  55: "95 CMS",
  56: "110 CMS",
  57: "UK 7 / EU 41",
  58: "UK 8 / EU 42",
  59: "UK 9 / EU 43",
  60: "UK 10 / EU 44",
  61: "UK 11 / EU 45",
  63: "46",
  64: "85 CMS",
  65: "90 CMS",
  66: "95 CM",
  67: "36",
  68: "37",
  69: "38",
  70: "39",
  71: "40",
  73: "110 CMS",
  74: "115 CMS",
  75: "41",
  76: "25 CMS",
  77: "20 CMS",
  78: "19 CMS",
};

let cachedBrandMap: Record<number, string> | null = null;
let cachedAttrMap: Record<number, string> | null = null;
const subcatProductsCache = new Map<string, { data: StoreProduct[]; timestamp: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Fetch all brands dynamically from Supabase (Cached in memory for instant speed)
 */
async function loadBrands(): Promise<Record<number, string>> {
  if (cachedBrandMap) return cachedBrandMap;
  try {
    const { data, error } = await supabase
      .from("brands")
      .select("id, name_en, alt_text");

    if (error || !data || data.length === 0) {
      cachedBrandMap = ALL_BRANDS_MAP;
      return ALL_BRANDS_MAP;
    }

    const brandMap: Record<number, string> = { ...ALL_BRANDS_MAP };
    data.forEach((b: { id: number; name_en?: string; alt_text?: string }) => {
      if (b.name_en) {
        brandMap[b.id] = b.name_en;
      } else if (b.alt_text) {
        brandMap[b.id] = b.alt_text;
      }
    });

    cachedBrandMap = brandMap;
    return brandMap;
  } catch {
    cachedBrandMap = ALL_BRANDS_MAP;
    return ALL_BRANDS_MAP;
  }
}

/**
 * Fetch all size & color attributes dynamically from Supabase (Cached in memory for instant speed)
 */
async function loadAttributesMap(): Promise<Record<number, string>> {
  if (cachedAttrMap) return cachedAttrMap;
  try {
    const { data, error } = await supabase
      .from("attributes")
      .select("id, name");

    if (error || !data || data.length === 0) {
      cachedAttrMap = ATTRIBUTE_SIZE_FALLBACKS;
      return ATTRIBUTE_SIZE_FALLBACKS;
    }

    const attrMap: Record<number, string> = { ...ATTRIBUTE_SIZE_FALLBACKS };
    data.forEach((a: { id: number; name?: string }) => {
      if (a.name) {
        attrMap[a.id] = a.name;
      }
    });
    cachedAttrMap = attrMap;
    return attrMap;
  } catch {
    cachedAttrMap = ATTRIBUTE_SIZE_FALLBACKS;
    return ATTRIBUTE_SIZE_FALLBACKS;
  }
}

// Share pending lookups across simultaneous category requests (including Strict Mode).
let brandsRequest: Promise<Record<number, string>> | undefined;
let attributesRequest: Promise<Record<number, string>> | undefined;
export function fetchBrands(): Promise<Record<number, string>> {
  return brandsRequest ??= loadBrands().finally(() => { brandsRequest = undefined; });
}
export function fetchAttributesMap(): Promise<Record<number, string>> {
  return attributesRequest ??= loadAttributesMap().finally(() => { attributesRequest = undefined; });
}

/**
 * Formats a raw number to INR currency string (e.g. ₹14,999)
 */
export function formatINR(val: number): string {
  return `₹${val.toLocaleString("en-IN")}`;
}

/**
 * Store-wide discount applied to every product (0.15 = 15% OFF).
 * Set to 0 to disable the offer.
 */
export const STORE_WIDE_DISCOUNT = 0.15;

/**
 * The price the store-wide discount is taken from: the DB sale price when it is set
 * and below the regular price, otherwise the regular price.
 */
export function storeBasePrice(price: number, salePrice: number | null): number {
  if (!price || price <= 0) return 0;
  if (salePrice !== null && salePrice > 0 && salePrice < price) return salePrice;
  return price;
}

/**
 * Returns the selling price: the store-wide discount applied on top of the sale price
 * (or the regular price when there is no sale price).
 */
export function applyStoreDiscount(price: number, salePrice: number | null): number {
  const base = storeBasePrice(price, salePrice);
  return base > 0 ? Math.round(base * (1 - STORE_WIDE_DISCOUNT)) : 0;
}

/**
 * Helper to map a raw DB product row into a StoreProduct
 */
/**
 * Accurately determines product gender based on category/subcategory ground truth and DB attributes
 */
export function determineProductGender(item: any): string {
  const subId = item.subcategory_id;
  const dbGender = item.gender && typeof item.gender === "string" && item.gender.trim() ? item.gender.trim() : null;

  // 1. MEN Subcategories:
  // Sub 1 = Footwear (Men)
  // Sub 12 = Belts (Men)
  // Sub 5 = Wallets (Men)
  // Sub 73 = Footwear Hub (Men)
  // Sub 74 = Belts Hub (Men)
  if ([1, 12, 5, 73, 74].includes(subId)) {
    return "Men";
  }

  // 2. WOMEN Subcategories:
  // Sub 7 = Hand Bags (Women)
  // Sub 13 = Footwear (Women)
  // Sub 55 = Belts (Women)
  // Sub 4 = Wallets (Women)
  // Sub 68 = Handbags and Slings (Women)
  if ([7, 13, 55, 4, 68].includes(subId)) {
    return "Women";
  }

  // 3. UNISEX Subcategories:
  // Sub 9 = Stoles, Sub 66 = Caps, Sub 43 = Charms, Sub 6 = Backpacks, Sub 8 = Sunglasses,
  // Sub 10 = Slings & Laptop Bags, Sub 3 = Card/Passport, Sub 69 = Trolleys, Sub 70 = Unisex Slings, Sub 71 = Backpacks, Sub 75 = Stoles & Scarves
  if ([3, 6, 8, 9, 10, 43, 66, 69, 70, 71, 75].includes(subId)) {
    if (dbGender === "Men" || dbGender === "Women") return dbGender;
    return "Unisex";
  }

  // 4. By category_id fallback
  if (item.category_id === 1) return "Men";
  if (item.category_id === 2) return "Women";
  if (item.category_id === 3) return "Unisex";

  if (dbGender) return dbGender;
  return "Unisex";
}

export function mapRawProduct(
  item: any,
  brandMap: Record<number, string>,
  attrMap: Record<number, string>
): StoreProduct {
  // Extract images (filtering out .mp4 / video files so only authentic photos are in images array)
  const images: string[] = [];
  const videos: string[] = [];

  if (item.product_images && Array.isArray(item.product_images)) {
    // Sort by ascending id for stable, consistent image order
    const sortedMedia = item.product_images.slice().sort((a: any, b: any) => (a.id || 0) - (b.id || 0));

    sortedMedia.forEach((imgObj: { id?: number; image_url?: string }) => {
      if (imgObj?.image_url && imgObj.image_url.trim()) {
        const url = imgObj.image_url.trim();
        const lower = url.toLowerCase();
        const isVideo = lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm") || lower.includes(".mp4?") || lower.endsWith(".m4v");
        if (isVideo) {
          videos.push(url);
        } else {
          images.push(url);
        }
      }
    });
  }

  const primaryImg = images.length > 0 ? images[0] : "/handbag.webp";
  const secondaryImg = images.length > 1 ? images[1] : undefined;
  const videoUrl = videos.length > 0 ? videos[0] : undefined;

  // Extract all variants
  const variants: ProductVariant[] = [];
  let lowestPrice = 0;
  let lowestSalePrice: number | null = null;

  if (item.product_variations && Array.isArray(item.product_variations)) {
    item.product_variations.forEach((v: any, vIdx: number) => {
      const regularPrice = Number(v.price) || 0;
      const dbSalePrice = v.sale_price ? Number(v.sale_price) : null;
      // Strike-through price is the DB sale price (or regular price); store-wide 15% comes off that
      const p = storeBasePrice(regularPrice, dbSalePrice);
      const discountedPrice = applyStoreDiscount(regularPrice, dbSalePrice);
      const sp = discountedPrice > 0 ? discountedPrice : null;
      const isVarSale = sp !== null && sp > 0 && sp < p;
      const effPrice = isVarSale ? sp! : p;

      let varDiscount: number | undefined;
      if (isVarSale && p > 0) {
        varDiscount = Math.round(((p - sp!) / p) * 100);
      }

      let sizeLabel = "Standard";
      if (v.size_id && attrMap[v.size_id]) {
        sizeLabel = attrMap[v.size_id];
      } else if (v.size_id) {
        sizeLabel = `Size ${v.size_id}`;
      } else if (item.product_variations.length > 1) {
        sizeLabel = `Option ${vIdx + 1}`;
      }

      variants.push({
        id: v.id || vIdx,
        sizeId: v.size_id,
        sizeName: sizeLabel,
        colorId: v.color_id,
        price: p,
        salePrice: sp,
        stock: typeof v.stock === "number" ? v.stock : 1,
        displayPrice: effPrice > 0 ? formatINR(effPrice) : "Price on Request",
        originalPrice: isVarSale && p > 0 ? formatINR(p) : undefined,
        discountPercent: varDiscount,
        isSale: isVarSale,
      });

      if (vIdx === 0 || (effPrice > 0 && (lowestPrice === 0 || effPrice < (lowestSalePrice || lowestPrice)))) {
        lowestPrice = p;
        lowestSalePrice = isVarSale ? sp : null;
      }
    });
  }

  const effectivePrice = lowestSalePrice !== null ? lowestSalePrice : lowestPrice;
  const isSale = lowestSalePrice !== null && lowestSalePrice < lowestPrice;

  let discountPercent: number | undefined;
  if (isSale && lowestPrice > 0) {
    discountPercent = Math.round(((lowestPrice - lowestSalePrice!) / lowestPrice) * 100);
  }

  const displayPrice = effectivePrice > 0 ? formatINR(effectivePrice) : "Price on Request";
  const originalPriceStr = isSale && lowestPrice > 0 ? formatINR(lowestPrice) : undefined;

  const itemGender = determineProductGender(item);

  const brandName = item.brand_id && brandMap[item.brand_id]
    ? brandMap[item.brand_id]
    : "Luxury Atelier";

  const subcategoryName = item.subcategory_id && SUBCATEGORY_NAMES[item.subcategory_id]
    ? SUBCATEGORY_NAMES[item.subcategory_id]
    : "Haute Edition";

  return {
    id: item.id,
    name: item.name || "Haute Creation",
    sku: item.sku || undefined,
    description: item.description || undefined,
    brandId: item.brand_id || null,
    brandName,
    gender: itemGender,
    subcategoryId: item.subcategory_id || null,
    subcategoryName,
    categoryId: item.category_id || null,
    images: images.length > 0 ? images : [primaryImg],
    img: primaryImg,
    secondaryImg,
    videoUrl,
    priceValue: effectivePrice,
    originalPriceValue: lowestPrice,
    price: displayPrice,
    originalPrice: originalPriceStr,
    discountPercent,
    isSale,
    tag: itemGender,
    material: subcategoryName,
    active: Boolean(item.active),
    variants,
    selectedVariant: variants.length > 0 ? variants[0] : undefined,
  };
}

/**
 * Fetch real products by subcategory IDs from Supabase (Cached in memory for instant speed)
 */
async function loadProductsBySubcategoryIds(
  subcategoryIds: number[],
  limit?: number
): Promise<StoreProduct[]> {
  const cacheKey = `${subcategoryIds.slice().sort().join(",")}:${limit ?? "all"}`;
  const cached = subcatProductsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const productsQuery = supabase
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
        product_images (
          id,
          image_url
        ),
        product_variations (
          id,
          price,
          sale_price,
          size_id,
          color_id,
          stock
        )
      `)
      .in("subcategory_id", subcategoryIds)
      .eq("active", true)
      .order("id", { ascending: false })
      // Cards need one photo; full galleries are fetched on the detail page.
      .not("product_images.image_url", "imatch", "[.](mp4|mov|webm|m4v)($|[?])")
      .order("id", { referencedTable: "product_images", ascending: true })
      .limit(1, { referencedTable: "product_images" });

    if (limit !== undefined) productsQuery.limit(limit);

    const [{ data: dbProducts, error }, brandMap, attrMap] = await Promise.all([
      productsQuery,
      fetchBrands(),
      fetchAttributesMap(),
    ]);

    if (error || !dbProducts) {
      if (error) {
        console.error("Error fetching homepage/category products:", error.message);
      }
      return [];
    }

    const results = dbProducts.map((item: any) => mapRawProduct(item, brandMap, attrMap));
    subcatProductsCache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
  } catch (err) {
    console.error("fetchProductsBySubcategoryIds exception:", err);
    return [];
  }
}

const categoryRequests = new Map<string, Promise<StoreProduct[]>>();
export function fetchProductsBySubcategoryIds(subcategoryIds: number[], limit?: number): Promise<StoreProduct[]> {
  const key = `${subcategoryIds.slice().sort().join(",")}:${limit ?? "all"}`;
  const pending = categoryRequests.get(key);
  if (pending) return pending;
  const request = loadProductsBySubcategoryIds(subcategoryIds, limit)
    .finally(() => categoryRequests.delete(key));
  categoryRequests.set(key, request);
  return request;
}

/**
 * Fetch single product by ID with full variations and images
 */
export async function fetchProductById(id: string | number, onProduct?: (product: StoreProduct) => void): Promise<{
  product: StoreProduct | null;
  relatedProducts: StoreProduct[];
}> {
  try {
    const numId = Number(id);
    if (!numId || isNaN(numId)) {
      return { product: null, relatedProducts: [] };
    }

    const lookups = Promise.all([fetchBrands(), fetchAttributesMap()]);
    const { data: item, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        sku,
        description,
        brand_id,
        gender,
        subcategory_id,
        category_id,
        active,
        product_images (
          id,
          image_url
        ),
        product_variations (
          id,
          price,
          sale_price,
          size_id,
          color_id,
          stock
        )
      `)
      .eq("id", numId)
      .single();

    if (error || !item) {
      console.error("Error fetching product by id:", error?.message);
      return { product: null, relatedProducts: [] };
    }

    const [brandMap, attrMap] = await lookups;
    const product = mapRawProduct(item, brandMap, attrMap);
    onProduct?.(product);

    // Fetch up to 4 related products from the same subcategory
    let relatedProducts: StoreProduct[] = [];
    if (product.subcategoryId) {
      const { data: relatedData } = await supabase
        .from("products")
        .select(`
          id,
          name,
          sku,
          description,
          brand_id,
          gender,
          subcategory_id,
          category_id,
          active,
          product_images (
            id,
            image_url
          ),
          product_variations (
            id,
            price,
            sale_price,
            size_id,
            color_id,
            stock
          )
        `)
        .eq("subcategory_id", product.subcategoryId)
        .eq("active", true)
        .neq("id", numId)
        .limit(4);

      if (relatedData && relatedData.length > 0) {
        relatedProducts = relatedData.map((r: any) => mapRawProduct(r, brandMap, attrMap));
      }
    }

    return { product, relatedProducts };
  } catch (err) {
    console.error("fetchProductById exception:", err);
    return { product: null, relatedProducts: [] };
  }
}

/**
 * Fetch latest active products across all collections for homepage
 */
export async function fetchLatestProducts(limit: number = 8): Promise<StoreProduct[]> {
  try {
    const { data: dbProducts, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        sku,
        description,
        brand_id,
        gender,
        subcategory_id,
        category_id,
        active,
        product_images (
          id,
          image_url
        ),
        product_variations (
          id,
          price,
          sale_price,
          size_id,
          color_id,
          stock
        )
      `)
      .eq("active", true)
      .in("subcategory_id", ALL_COLLECTION_SUBCATEGORY_IDS)
      .order("id", { ascending: false })
      .limit(limit);

    if (error || !dbProducts) {
      return [];
    }

    const [brandMap, attrMap] = await Promise.all([
      fetchBrands(),
      fetchAttributesMap(),
    ]);

    return dbProducts.map((item: any) => mapRawProduct(item, brandMap, attrMap));
  } catch (err) {
    console.error("fetchLatestProducts exception:", err);
    return [];
  }
}

export const ALL_COLLECTION_SUBCATEGORY_IDS = [
  // Women's Handbags
  7,
  // Footwear (Men's & Women's)
  1, 13,
  // Belts (Men's & Women's)
  12, 55,
  // Stoles
  9,
  // The Original Hub (Handbags & Slings, Trolleys & Duffles, Slings & Laptop Bags, Backpacks, Footwear, Belts, Stoles & Scarves)
  68, 69, 70, 71, 73, 74, 75,
];

/**
 * Fetch all products across Handbags, Footwear, Belts, Stoles, and The Original Hub for Collection Hub
 */
export async function fetchAllCollectionProducts(): Promise<StoreProduct[]> {
  return fetchProductsBySubcategoryIds(ALL_COLLECTION_SUBCATEGORY_IDS);
}

export interface Homepage4Categories {
  handbags: StoreProduct[];
  footwear: StoreProduct[];
  belts: StoreProduct[];
  stoles: StoreProduct[];
}

/**
 * High-performance simultaneous fetch of the top latest products for all 4 categories
 */
export async function fetchHomepage4CategoriesLatest(limitPerCategory: number = 6): Promise<Homepage4Categories> {
  const [handbags, footwear, belts, stoles] = await Promise.all([
    fetchProductsBySubcategoryIds([7], limitPerCategory),
    fetchProductsBySubcategoryIds([1, 13], limitPerCategory),
    fetchProductsBySubcategoryIds([12, 55], limitPerCategory),
    fetchProductsBySubcategoryIds([9], limitPerCategory),
  ]);

  return {
    handbags: handbags.slice(0, limitPerCategory),
    footwear: footwear.slice(0, limitPerCategory),
    belts: belts.slice(0, limitPerCategory),
    stoles: stoles.slice(0, limitPerCategory),
  };
}


