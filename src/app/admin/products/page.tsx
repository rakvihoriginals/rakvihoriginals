"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import OptimizedImage from "@/components/OptimizedImage";
import { applyStoreDiscount, storeBasePrice, STORE_WIDE_DISCOUNT } from "@/lib/fetchProducts";

type Variation = {
  id: number;
  product_id: number | null;
  price: number;
  stock: number | null;
  color_id: number | null;
  size_id: number | null;
  sale_price: number | null;
};

type ProductImage = {
  id: number;
  product_id: number | null;
  image_url: string;
};

type Product = {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  category_id: number | null;
  subcategory_id: number | null;
  sub_subcategory_id: number | null;
  pack_of: string | null;
  has_variation: boolean | null;
  shipping_charge: number | null;
  youtube_url: string | null;
  active: boolean | null;
  brand_id: number | null;
  shipping_type: string | null;
  color_id: number | null;
  lifestyle_tag_id: number | null;
  gender: string | null;
  product_variations?: Variation[];
  // In the LIST query this only ever contains a single (thumbnail)
  // image — see PAGE_SIZE / query notes below. The full gallery is
  // fetched lazily, per product, only when its row is expanded.
  product_images?: ProductImage[];
};

type LookupRow = { id: number; name: string };
type SubcategoryRow = { id: number; name: string; category_id: number | null };

const CURATED_SUBCATS: Record<string, string[]> = {
  men: ["Belts", "Footwear"],
  women: ["Belts", "Footwear", "Hand Bags"],
  unisex: ["Stoles"],
};

const EXCLUDED_CATEGORIES = ["watches"];

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

function getCuratedList(categoryName: string): string[] | null {
  const key = categoryName.trim().toLowerCase();
  return CURATED_SUBCATS[key] ?? null;
}

function cleanImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let value: unknown = raw;

  try {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      value = Array.isArray(parsed) ? parsed[0] : parsed;
    }
  } catch {
    // not JSON — treat as plain string
  }

  let clean = String(value ?? "")
    .split(",")[0]
    .replace(/[\[\]"'\\]/g, "")
    .trim();

  if (!clean) return null;
  if (clean.startsWith("http:")) clean = clean.replace(/^http:/i, "https:");
  if (/\.(mp4|webm|ogg|mov)$/i.test(clean)) return null;

  return clean;
}

export default function ProductsAdminPage() {
  const supabase = createClient();

  // ── Lookups (small tables — loaded once, not paginated) ──────────────
  const [categories, setCategories] = useState<LookupRow[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryRow[]>([]);
  const [subSubcategories, setSubSubcategories] = useState<LookupRow[]>([]);
  const [brands, setBrands] = useState<LookupRow[]>([]);
  const [attributes, setAttributes] = useState<LookupRow[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(true);

  // ── Products (paginated, server-filtered) ─────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [page, setPage] = useState(1);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filters ────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // ── Row expansion + lazy full-gallery fetch ───────────────────────────
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const [galleryCache, setGalleryCache] = useState<
    Record<number, ProductImage[] | "loading" | "error">
  >({});

  // Debounce the search box so every keystroke doesn't fire a query.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, categoryFilter, subcategoryFilter, brandFilter, statusFilter]);

  // Category changes reset the (now possibly-invalid) subcategory filter.
  useEffect(() => {
    setSubcategoryFilter("all");
  }, [categoryFilter]);

  // ── Load lookups once ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      setLookupsLoading(true);
      const [categoriesRes, subcategoriesRes, subSubRes, brandsRes, attributesRes] =
        await Promise.all([
          supabase.from("categories").select("id, name"),
          supabase.from("subcategories").select("id, name, category_id"),
          supabase.from("sub_subcategories").select("id, name"),
          supabase.from("brands").select("id, name_en"),
          supabase.from("attributes").select("id, name"),
        ]);

      if (cancelled) return;

      const firstError =
        categoriesRes.error ||
        subcategoriesRes.error ||
        subSubRes.error ||
        brandsRes.error ||
        attributesRes.error;
      if (firstError) {
        setError(firstError.message);
        setLookupsLoading(false);
        return;
      }

      const allCategories = (categoriesRes.data ?? []) as LookupRow[];
      const loadedCategories = allCategories.filter(
        (c) => !EXCLUDED_CATEGORIES.includes(c.name.trim().toLowerCase()) && c.id !== 8
      );
      const excludedCatIds = new Set(
        allCategories
          .filter((c) => EXCLUDED_CATEGORIES.includes(c.name.trim().toLowerCase()) || c.id === 8)
          .map((c) => c.id)
      );

      setCategories(loadedCategories);
      setSubcategories(
        ((subcategoriesRes.data ?? []) as SubcategoryRow[]).filter(
          (s) => s.category_id == null || !excludedCatIds.has(s.category_id)
        )
      );
      setSubSubcategories((subSubRes.data ?? []) as LookupRow[]);
      setBrands(
        ((brandsRes.data ?? []) as { id: number; name_en: string }[]).map((b) => ({
          id: b.id,
          name: b.name_en,
        }))
      );
      setAttributes((attributesRes.data ?? []) as LookupRow[]);
      setLookupsLoading(false);
    }

    loadLookups();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );
  const subcategoryById = useMemo(
    () => new Map(subcategories.map((s) => [s.id, s.name])),
    [subcategories]
  );
  const subSubById = useMemo(
    () => new Map(subSubcategories.map((s) => [s.id, s.name])),
    [subSubcategories]
  );
  const brandById = useMemo(() => new Map(brands.map((b) => [b.id, b.name])), [brands]);
  const attrById = useMemo(
    () => new Map(attributes.map((a) => [a.id, a.name])),
    [attributes]
  );

  const visibleCategoryOptions = categories;

  // Subcategory filter options — scoped to the selected category and,
  // for curated categories, restricted to the curated allow-list only.
  const visibleSubcategoryOptions = useMemo(() => {
    if (categoryFilter === "all") return [];
    const catId = Number(categoryFilter);
    const all = subcategories.filter((s) => s.category_id === catId);

    const catName = categoryById.get(catId);
    const curated = catName ? getCuratedList(catName) : null;
    if (!curated) return all;

    const byName = new Map(all.map((s) => [s.name.trim().toLowerCase(), s]));
    return curated
      .map((name) => byName.get(name.toLowerCase()))
      .filter((s): s is SubcategoryRow => Boolean(s));
  }, [subcategories, categoryFilter, categoryById]);

  // ── Build the "which category/subcategory combos are allowed" filter ──
  // This encodes the same visibility rule as before (curated categories
  // only show their curated subcategories) but as a server-side .or()
  // filter, so pagination and counts are correct instead of being
  // computed after over-fetching.
  const visibilityOrFilter = useMemo(() => {
    if (lookupsLoading) return null;

    const nonCuratedVisibleIds: number[] = [];
    const curatedClauses: string[] = [];

    for (const cat of categories) {
      const curated = getCuratedList(cat.name);
      if (!curated) {
        nonCuratedVisibleIds.push(cat.id);
        continue;
      }
      const subIds = subcategories
        .filter(
          (s) =>
            s.category_id === cat.id &&
            curated.some((n) => n.toLowerCase() === s.name.trim().toLowerCase())
        )
        .map((s) => s.id);
      if (subIds.length > 0) {
        curatedClauses.push(`and(category_id.eq.${cat.id},subcategory_id.in.(${subIds.join(",")}))`);
      }
    }

    const clauses: string[] = [];
    if (nonCuratedVisibleIds.length > 0) {
      clauses.push(`category_id.in.(${nonCuratedVisibleIds.join(",")})`);
    }
    clauses.push(...curatedClauses);

    return clauses.length > 0 ? clauses.join(",") : null;
  }, [categories, subcategories, lookupsLoading]);

  // ── Fetch the current page of products ────────────────────────────────
  const fetchProducts = useCallback(async () => {
    if (lookupsLoading) return;

    setProductsLoading(true);
    setError(null);

    function applyFilters<T extends ReturnType<typeof supabase.from>>(q: any) {
      if (statusFilter === "active") q = q.eq("active", true);
      if (statusFilter === "inactive") q = q.eq("active", false);
      if (brandFilter !== "all") q = q.eq("brand_id", Number(brandFilter));

      if (categoryFilter !== "all") {
        q = q.eq("category_id", Number(categoryFilter));
        if (subcategoryFilter !== "all") {
          q = q.eq("subcategory_id", Number(subcategoryFilter));
        }
      } else if (visibilityOrFilter) {
        // No specific category picked — still restrict to the overall
        // curated/hidden visibility rule across every category.
        q = q.or(visibilityOrFilter);
      }

      if (debouncedQuery) {
        const term = debouncedQuery.replace(/[%,]/g, "");
        q = q.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
      }

      return q;
    }

    // Main page query — only ONE image per product (the thumbnail).
    // Full galleries are fetched lazily per-product on expand instead
    // of being embedded here, which is the main weight reduction versus
    // the previous version.
    let listQuery = supabase
      .from("products")
      .select(
        `id, name, sku, description, category_id, subcategory_id, sub_subcategory_id,
         pack_of, has_variation, shipping_charge, youtube_url, active, brand_id,
         shipping_type, color_id, lifestyle_tag_id, gender,
         product_variations ( id, product_id, price, stock, color_id, size_id, sale_price ),
         product_images ( id, product_id, image_url )`,
        { count: "exact" }
      )
      .order("id", { ascending: false })
      .order("id", { foreignTable: "product_images", ascending: true })
      .limit(1, { foreignTable: "product_images" })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    listQuery = applyFilters(listQuery);

    // Active/inactive counts for the summary cards — cheap head-only
    // count queries against the same filters (minus status itself).
    let activeCountQuery = supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("active", true);
    let inactiveCountQuery = supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("active", false);

    function applyNonStatusFilters(q: any) {
      if (brandFilter !== "all") q = q.eq("brand_id", Number(brandFilter));
      if (categoryFilter !== "all") {
        q = q.eq("category_id", Number(categoryFilter));
        if (subcategoryFilter !== "all") q = q.eq("subcategory_id", Number(subcategoryFilter));
      } else if (visibilityOrFilter) {
        q = q.or(visibilityOrFilter);
      }
      // Strictly exclude Watches from admin products
      q = q.neq("category_id", 8);
      if (debouncedQuery) {
        const term = debouncedQuery.replace(/[%,]/g, "");
        q = q.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
      }
      return q;
    }

    activeCountQuery = applyNonStatusFilters(activeCountQuery);
    inactiveCountQuery = applyNonStatusFilters(inactiveCountQuery);

    const [listRes, activeRes, inactiveRes] = await Promise.all([
      listQuery,
      activeCountQuery,
      inactiveCountQuery,
    ]);

    if (listRes.error) {
      console.error("[ProductsAdminPage] load error:", listRes.error);
      setError(listRes.error.message);
      setProductsLoading(false);
      return;
    }

    setProducts((listRes.data ?? []) as unknown as Product[]);
    setTotalCount(listRes.count ?? 0);
    setActiveCount(activeRes.count ?? 0);
    setInactiveCount(inactiveRes.count ?? 0);
    setProductsLoading(false);
  }, [
    supabase,
    lookupsLoading,
    page,
    debouncedQuery,
    categoryFilter,
    subcategoryFilter,
    brandFilter,
    statusFilter,
    visibilityOrFilter,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function categoryPath(p: Product): string {
    const parts = [
      p.category_id != null ? categoryById.get(p.category_id) : null,
      p.subcategory_id != null ? subcategoryById.get(p.subcategory_id) : null,
      p.sub_subcategory_id != null ? subSubById.get(p.sub_subcategory_id) : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" / ") : "Uncategorized";
  }

  function priceRange(p: Product): {
    finalLabel: string;
    origLabel: string | null;
    discountPercent: number | null;
    sub: string | null;
  } {
    const vars = p.product_variations ?? [];
    if (vars.length === 0) {
      return { finalLabel: "No variations", origLabel: null, discountPercent: null, sub: null };
    }

    // Strike-through shows the price the 15% is taken from (sale price, else regular price)
    const rawPrices = vars.map((v) =>
      storeBasePrice(Number(v.price) || 0, v.sale_price != null ? Number(v.sale_price) : null)
    );
    const finalPrices = vars.map((v) =>
      applyStoreDiscount(Number(v.price) || 0, v.sale_price != null ? Number(v.sale_price) : null)
    );

    const minFinal = Math.min(...finalPrices);
    const maxFinal = Math.max(...finalPrices);
    const minRaw = Math.min(...rawPrices);
    const maxRaw = Math.max(...rawPrices);

    const isDiscounted = minFinal < minRaw || maxFinal < maxRaw;
    const discountPercent = Math.round(STORE_WIDE_DISCOUNT * 100);

    const finalLabel =
      minFinal === maxFinal
        ? `₹${minFinal.toLocaleString()}`
        : `₹${minFinal.toLocaleString()} – ₹${maxFinal.toLocaleString()}`;

    const origLabel =
      isDiscounted
        ? minRaw === maxRaw
          ? `₹${minRaw.toLocaleString()}`
          : `₹${minRaw.toLocaleString()} – ₹${maxRaw.toLocaleString()}`
        : null;

    const totalStock = vars.reduce((sum, v) => sum + (v.stock ?? 0), 0);
    return {
      finalLabel,
      origLabel,
      discountPercent: isDiscounted ? discountPercent : null,
      sub: `${vars.length} variant${vars.length === 1 ? "" : "s"} · ${totalStock} in stock`,
    };
  }

  function stockBadge(p: Product): { text: string; cls: string } | null {
    const vars = p.product_variations ?? [];
    if (vars.length === 0) return null;
    const total = vars.reduce((sum, v) => sum + (v.stock ?? 0), 0);
    if (total <= 0) return { text: "Out of stock", cls: "stock-out" };
    if (total <= 5) return { text: `Low stock (${total})`, cls: "stock-low" };
    return null;
  }

  // Lazily fetch a product's full image gallery the first time its row
  // is expanded, and cache the result so re-collapsing/expanding doesn't
  // re-fetch. This keeps the initial page load down to one thumbnail per
  // product instead of every image for every product on the page.
  const fetchGallery = useCallback(
    async (productId: number) => {
      setGalleryCache((prev) => ({ ...prev, [productId]: "loading" }));
      const { data, error: galleryError } = await supabase
        .from("product_images")
        .select("id, product_id, image_url")
        .eq("product_id", productId);

      setGalleryCache((prev) => ({
        ...prev,
        [productId]: galleryError ? "error" : ((data ?? []) as ProductImage[]),
      }));
    },
    [supabase]
  );

  function toggleOpen(p: Product) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(p.id)) {
        next.delete(p.id);
      } else {
        next.add(p.id);
        if (!galleryCache[p.id]) fetchGallery(p.id);
      }
      return next;
    });
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const hasActiveFilters =
    !!debouncedQuery ||
    categoryFilter !== "all" ||
    subcategoryFilter !== "all" ||
    brandFilter !== "all" ||
    statusFilter !== "all";

  function clearFilters() {
    setQuery("");
    setCategoryFilter("all");
    setSubcategoryFilter("all");
    setBrandFilter("all");
    setStatusFilter("all");
  }

  const loading = lookupsLoading || productsLoading;

  return (
    <div className="subpage-wrapper brand-directory-admin">
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/admin">Dashboard</Link>
            <span>/</span>
            <span className="active">Products</span>
          </div>

          <h1 className="subpage-title">Products</h1>
          <p className="subpage-subtitle">
            Catalog view — only products under the categories and
            subcategories currently shown on the Category page appear here.
          </p>
        </div>
      </section>

      <section className="subpage-grid-section">
        <div className="subpage-container">
          {error && (
            <p style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: "1.5rem" }}>
              {error}
            </p>
          )}

          {!lookupsLoading && (
            <div className="prod-summary">
              <div className="prod-summary-item">
                <span className="prod-summary-num">{totalCount}</span>
                <span className="prod-summary-label">Products</span>
              </div>
              <div className="prod-summary-item">
                <span className="prod-summary-num">{activeCount}</span>
                <span className="prod-summary-label">Active</span>
              </div>
              <div className="prod-summary-item">
                <span className="prod-summary-num">{inactiveCount}</span>
                <span className="prod-summary-label">Inactive</span>
              </div>
              <div className="prod-summary-item">
                <span className="prod-summary-num">
                  {page} / {totalPages}
                </span>
                <span className="prod-summary-label">Page</span>
              </div>
            </div>
          )}

          <div className="prod-toolbar">
            <div className="prod-search">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or SKU"
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>

            <select
              className="prod-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {visibleCategoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="prod-select"
              value={subcategoryFilter}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
              disabled={categoryFilter === "all" || visibleSubcategoryOptions.length === 0}
            >
              <option value="all">All Subcategories</option>
              {visibleSubcategoryOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              className="prod-select"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="all">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <div className="prod-status-tabs">
              {(["all", "active", "inactive"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`prod-status-tab${statusFilter === tab ? " active" : ""}`}
                >
                  {tab === "all" ? "All" : tab === "active" ? "Active" : "Inactive"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="prod-list">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="prod-skeleton" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="prod-empty">
              <p>{hasActiveFilters ? "No products match your filters." : "No products yet."}</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="brand-directory-clear-btn">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="prod-list">
                {products.map((p) => {
                  const isOpen = openIds.has(p.id);
                  const price = priceRange(p);
                  const stockFlag = stockBadge(p);

                  const cached = galleryCache[p.id];
                  const galleryLoading = cached === "loading";
                  const galleryErrored = cached === "error";
                  const fullGallery = Array.isArray(cached) ? cached : null;

                  // Before expansion (or while loading), fall back to the
                  // single thumbnail image already in the list payload.
                  const productImages = fullGallery ?? p.product_images ?? [];
                  const productVariations = p.product_variations ?? [];

                  const rawThumb = (p.product_images ?? [])[0]?.image_url ?? null;
                  const thumb = cleanImageUrl(rawThumb);

                  return (
                    <div key={p.id} className="prod-card">
                      <div className="prod-card-row" onClick={() => toggleOpen(p)}>
                        <span className={`prod-card-chevron${isOpen ? " open" : ""}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                        </span>

                        <div className="prod-card-thumb">
                          <OptimizedImage src={thumb} alt={p.name} fill sizes="56px" />
                        </div>

                        <div className="prod-card-body">
                          <div className="prod-card-main">
                            <div className="prod-card-name">{p.name}</div>
                            <div className="prod-card-sku">{p.sku ? `SKU ${p.sku}` : "No SKU"}</div>
                          </div>

                          <div className="prod-card-path">{categoryPath(p)}</div>

                          <div className="prod-card-brand">
                            {p.brand_id != null ? brandById.get(p.brand_id) ?? "—" : "—"}
                          </div>

                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span className="prod-card-price">{price.finalLabel}</span>
                              {price.origLabel && (
                                <span className="prod-card-orig-price">{price.origLabel}</span>
                              )}
                              {price.discountPercent && (
                                <span className="prod-discount-pill">{price.discountPercent}% OFF</span>
                              )}
                            </div>
                            {price.sub && <span className="prod-card-price-sub">{price.sub}</span>}
                          </div>

                          <div className="prod-card-badges">
                            <span className={`prod-badge ${p.active ? "active" : "inactive"}`}>
                              {p.active ? "Active" : "Inactive"}
                            </span>
                            {p.gender && <span className="prod-badge gender">{p.gender}</span>}
                            {stockFlag && (
                              <span className={`prod-badge ${stockFlag.cls}`}>{stockFlag.text}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`prod-detail${isOpen ? " open" : ""}`}>
                        <div className="prod-detail-inner">
                          <div className="prod-detail-section">
                            <h4>Details</h4>
                            <div className="prod-detail-meta-grid">
                              <div className="prod-detail-meta-item">
                                <span className="prod-detail-meta-label">Pack Of</span>
                                <span className="prod-detail-meta-val">{p.pack_of ?? "—"}</span>
                              </div>
                              <div className="prod-detail-meta-item">
                                <span className="prod-detail-meta-label">Shipping</span>
                                <span className="prod-detail-meta-val">
                                  {p.shipping_type === "free"
                                    ? "Free"
                                    : `₹${(p.shipping_charge ?? 0).toLocaleString()}`}
                                </span>
                              </div>
                              <div className="prod-detail-meta-item">
                                <span className="prod-detail-meta-label">Color Tag</span>
                                <span className="prod-detail-meta-val">
                                  {p.color_id != null ? attrById.get(p.color_id) ?? "—" : "—"}
                                </span>
                              </div>
                              <div className="prod-detail-meta-item">
                                <span className="prod-detail-meta-label">Lifestyle Tag</span>
                                <span className="prod-detail-meta-val">
                                  {p.lifestyle_tag_id != null
                                    ? attrById.get(p.lifestyle_tag_id) ?? "—"
                                    : "—"}
                                </span>
                              </div>
                              <div className="prod-detail-meta-item">
                                <span className="prod-detail-meta-label">Has Variation</span>
                                <span className="prod-detail-meta-val">
                                  {p.has_variation ? "Yes" : "No"}
                                </span>
                              </div>
                              <div className="prod-detail-meta-item">
                                <span className="prod-detail-meta-label">Product ID</span>
                                <span className="prod-detail-meta-val">#{p.id}</span>
                              </div>
                            </div>

                            {p.description && <p className="prod-detail-desc">{p.description}</p>}

                            {p.youtube_url && (
                              <a
                                href={p.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="prod-youtube-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
                                </svg>
                                Watch video
                              </a>
                            )}
                          </div>

                          <div>
                            <div className="prod-detail-section" style={{ marginBottom: "1.5rem" }}>
                              <h4>Variations</h4>
                              {productVariations.length === 0 ? (
                                <p className="prod-empty-note">No variations added.</p>
                              ) : (
                                <table className="prod-var-table">
                                  <thead>
                                    <tr>
                                      <th>Color</th>
                                      <th>Size</th>
                                      <th>Regular Price</th>
                                      <th>Sale Price</th>
                                      <th>Final Price ({Math.round(STORE_WIDE_DISCOUNT * 100)}% OFF Sale Price)</th>
                                      <th>Stock</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {productVariations.map((v) => {
                                      const rawP = Number(v.price) || 0;
                                      const saleP = v.sale_price != null ? Number(v.sale_price) : null;
                                      const baseP = storeBasePrice(rawP, saleP);
                                      const hasSale = baseP > 0 && baseP < rawP;
                                      const finalP = applyStoreDiscount(rawP, saleP);
                                      const discPercent = baseP > 0 && finalP < baseP ? Math.round(STORE_WIDE_DISCOUNT * 100) : null;
                                      return (
                                        <tr key={v.id}>
                                          <td>{v.color_id != null ? attrById.get(v.color_id) ?? "—" : "—"}</td>
                                          <td>{v.size_id != null ? attrById.get(v.size_id) ?? "—" : "—"}</td>
                                          <td>
                                            <span className={finalP < rawP ? "prod-var-orig" : "prod-var-price"}>
                                              ₹{rawP.toLocaleString()}
                                            </span>
                                          </td>
                                          <td>
                                            {hasSale ? (
                                              <span className="prod-var-orig">₹{baseP.toLocaleString()}</span>
                                            ) : (
                                              <span className="prod-var-price">—</span>
                                            )}
                                          </td>
                                          <td>
                                            <span className="prod-var-final">
                                              ₹{finalP.toLocaleString()}
                                            </span>
                                            {discPercent != null && (
                                              <span className="prod-discount-pill">
                                                {discPercent}% OFF
                                              </span>
                                            )}
                                          </td>
                                          <td>{v.stock ?? 0}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>

                            <div className="prod-detail-section">
                              <h4>
                                Images
                                {fullGallery ? ` (${fullGallery.length})` : galleryLoading ? "" : ""}
                              </h4>
                              {galleryLoading ? (
                                <p className="prod-empty-note">Loading images…</p>
                              ) : galleryErrored ? (
                                <p className="prod-empty-note">Couldn&apos;t load images.</p>
                              ) : productImages.length === 0 ? (
                                <p className="prod-empty-note">No images uploaded.</p>
                              ) : (
                                <div className="prod-images-strip">
                                  {productImages.map((img) => {
                                    const cleanUrl = cleanImageUrl(img.image_url);
                                    return (
                                      <div key={img.id} className="prod-image-thumb">
                                        <OptimizedImage src={cleanUrl} alt={p.name} fill sizes="64px" />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="prod-pagination" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "2rem" }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="brand-directory-clear-btn"
                    style={{ opacity: page === 1 ? 0.4 : 1 }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="brand-directory-clear-btn"
                    style={{ opacity: page === totalPages ? 0.4 : 1 }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}