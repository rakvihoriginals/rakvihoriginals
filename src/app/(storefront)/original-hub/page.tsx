"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  fetchBrands,
  fetchAttributesMap,
  mapRawProduct,
  SUBCATEGORY_NAMES,
  StoreProduct,
} from "@/lib/fetchProducts";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";

// "The Original Hub" category (id 5) is resolved by name so new hub subcategories show up automatically
const HUB_CATEGORY_NAME = "the original hub";
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

// Friendly storefront labels for the hub subcategories (falls back to the DB name)
const HUB_TAB_LABELS: Record<number, string> = {
  68: "Handbags & Slings",
  69: "Trolleys & Duffles",
  70: "Slings & Laptop Bags",
  71: "Backpacks",
  73: "Footwear",
  74: "Belts",
  75: "Stoles & Scarves",
};

type HubSubcategory = { id: number; name: string };
type HubData = { products: StoreProduct[]; subcategories: HubSubcategory[] };

let hubCache: { data: HubData; timestamp: number } | null = null;

async function fetchOriginalHub(): Promise<HubData> {
  if (hubCache && Date.now() - hubCache.timestamp < CACHE_TTL_MS) {
    return hubCache.data;
  }

  const { data: categories, error: catError } = await supabase.from("categories").select("id, name");
  if (catError || !categories) {
    console.error("Error fetching categories for Original Hub:", catError?.message);
    return { products: [], subcategories: [] };
  }

  const hubCategory = categories.find(
    (c: { id: number; name: string }) => c.name?.trim().toLowerCase() === HUB_CATEGORY_NAME
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

  const subcategories: HubSubcategory[] = (subcats || []).map((s: { id: number; name: string }) => ({
    id: s.id,
    name: HUB_TAB_LABELS[s.id] || s.name.trim(),
  }));
  const subNameById = new Map(subcategories.map((s) => [s.id, s.name]));

  const products = dbProducts.map((item: Parameters<typeof mapRawProduct>[0]) => {
    const product = mapRawProduct(item, brandMap, attrMap);
    // Subcategories missing from the shared name map would otherwise show a generic label
    if (product.subcategoryId && !SUBCATEGORY_NAMES[product.subcategoryId] && subNameById.has(product.subcategoryId)) {
      const label = subNameById.get(product.subcategoryId)!;
      product.subcategoryName = label;
      product.material = label;
    }
    return product;
  });

  const data = { products, subcategories };
  hubCache = { data, timestamp: Date.now() };
  return data;
}

export default function OriginalHubPage() {
  const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);
  const [subcategories, setSubcategories] = useState<HubSubcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [activeTab, setActiveTab] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedGender, setSelectedGender] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [visibleCount, setVisibleCount] = useState(40);

  useEffect(() => {
    async function loadHub() {
      setIsLoading(true);
      try {
        const data = await fetchOriginalHub();
        setAllProducts(data.products);
        setSubcategories(data.subcategories);
      } catch (err) {
        console.error("Failed to load Original Hub:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHub();
  }, []);

  // Only show tabs that actually have products, largest first
  const categoryTabs = useMemo(() => {
    const counts = new Map<number, number>();
    allProducts.forEach((item) => {
      if (item.subcategoryId) counts.set(item.subcategoryId, (counts.get(item.subcategoryId) || 0) + 1);
    });
    return subcategories
      .filter((s) => counts.has(s.id))
      .map((s) => ({ ...s, count: counts.get(s.id)! }))
      .sort((a, b) => b.count - a.count);
  }, [allProducts, subcategories]);

  // Products in the active tab (brand & gender options follow the tab)
  const tabProducts = useMemo(() => {
    if (activeTab === "all") return allProducts;
    return allProducts.filter((item) => item.subcategoryId === activeTab);
  }, [allProducts, activeTab]);

  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    tabProducts.forEach((item) => {
      if (item.brandName) brandsSet.add(item.brandName);
    });
    return Array.from(brandsSet).sort();
  }, [tabProducts]);

  const availableGenders = useMemo(() => {
    const order = ["Men", "Women", "Unisex"];
    const present = new Set(tabProducts.map((item) => item.gender));
    return order.filter((g) => present.has(g));
  }, [tabProducts]);

  // Multi-Filter and Sorting
  const filteredProducts = useMemo(() => {
    let result = [...tabProducts];

    // Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.brandName.toLowerCase().includes(q) ||
          (item.sku && item.sku.toLowerCase().includes(q)) ||
          (item.subcategoryName && item.subcategoryName.toLowerCase().includes(q))
      );
    }

    // Brand Filter
    if (selectedBrand !== "All") {
      result = result.filter((item) => item.brandName === selectedBrand);
    }

    // Gender Filter
    if (selectedGender !== "All") {
      result = result.filter((item) => item.gender === selectedGender);
    }

    // Price Filter
    if (selectedPrice === "Under 5000") {
      result = result.filter((item) => item.priceValue > 0 && item.priceValue < 5000);
    } else if (selectedPrice === "5000 - 15000") {
      result = result.filter((item) => item.priceValue >= 5000 && item.priceValue <= 15000);
    } else if (selectedPrice === "15000 - 30000") {
      result = result.filter((item) => item.priceValue >= 15000 && item.priceValue <= 30000);
    } else if (selectedPrice === "Over 30000") {
      result = result.filter((item) => item.priceValue > 30000);
    }

    // Sort
    if (sortBy === "price-low-high") {
      result.sort((a, b) => a.priceValue - b.priceValue);
    } else if (sortBy === "price-high-low") {
      result.sort((a, b) => b.priceValue - a.priceValue);
    } else if (sortBy === "name-az") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [tabProducts, searchQuery, selectedBrand, selectedGender, selectedPrice, sortBy]);

  const hasActiveFilters =
    activeTab !== "all" ||
    searchQuery.trim() !== "" ||
    selectedBrand !== "All" ||
    selectedGender !== "All" ||
    selectedPrice !== "All" ||
    sortBy !== "featured";

  const clearAllFilters = () => {
    setActiveTab("all");
    setSearchQuery("");
    setSelectedBrand("All");
    setSelectedGender("All");
    setSelectedPrice("All");
    setSortBy("featured");
    setVisibleCount(40);
  };

  // Switching tabs resets filters that may not exist in the new tab
  const selectTab = (tab: number | "all") => {
    setActiveTab(tab);
    setSelectedBrand("All");
    setSelectedGender("All");
    setVisibleCount(40);
  };

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? "var(--color-gold)" : "rgba(255, 255, 255, 0.05)",
    color: isActive ? "#000000" : "#ffffff",
    border: isActive ? "1px solid var(--color-gold)" : "1px solid rgba(255, 255, 255, 0.1)",
    padding: "8px 22px",
    borderRadius: "999px",
    fontSize: "13px",
    fontFamily: "var(--font-heading)",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.3s ease",
    letterSpacing: "0.05em",
  });

  return (
    <main className="subpage-wrapper">
      {/* Hero Section */}
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/">Home</Link> <span>/</span> <Link href="/collection-hub">Collections</Link> <span>/</span>{" "}
            <span className="active">The Original Hub</span>
          </div>
          <div className="hero-accent-line">
            <div className="accent-bar"></div>
            <span className="accent-label">Everyday Luxury Essentials</span>
          </div>
          <h1 className="subpage-title">
            THE ORIGINAL <span className="hero-title-stroke">HUB</span>
          </h1>
          <p className="subpage-subtitle">
            Handbags, slings, travel trolleys, backpacks, belts, footwear and scarves — every Hub essential, curated in one place.
          </p>
        </div>
      </section>

      {/* Grid & Filter Section */}
      <section className="subpage-grid-section">
        <div className="subpage-container">
          {/* Subcategory Tabs Strip */}
          {categoryTabs.length > 1 && (
            <div className="hub-tab-strip">
              <button onClick={() => selectTab("all")} style={tabButtonStyle(activeTab === "all")}>
                All Hub Pieces ({allProducts.length})
              </button>
              {categoryTabs.map((tab) => (
                <button key={tab.id} onClick={() => selectTab(tab.id)} style={tabButtonStyle(activeTab === tab.id)}>
                  {tab.name} ({tab.count})
                </button>
              ))}
            </div>
          )}

          {/* FUNCTIONAL FILTERS BAR */}
          <div
            className="grid-meta-bar"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "15px",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "15px 0 25px 0",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: "30px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span className="result-count" style={{ fontWeight: 700, fontSize: "14px", color: "#ffffff" }}>
                Showing {filteredProducts.length} Hub Originals
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    background: "rgba(196, 161, 116, 0.15)",
                    border: "1px solid rgba(196, 161, 116, 0.35)",
                    color: "var(--color-gold)",
                    padding: "4px 12px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Reset Filters ✕
                </button>
              )}
            </div>

            <div className="storefront-filter-row" style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              {/* Search Input */}
              <input
                type="text"
                placeholder="Search bags, belts, trolleys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input-glass"
                style={{ minWidth: "190px" }}
              />

              {/* Brand Dropdown */}
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="filter-select-glass"
              >
                <option value="All">All Brands ({availableBrands.length})</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Gender Dropdown */}
              {availableGenders.length > 1 && (
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="filter-select-glass"
                >
                  <option value="All">All Genders</option>
                  {availableGenders.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              )}

              {/* Price Dropdown */}
              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="filter-select-glass"
              >
                <option value="All">All Prices</option>
                <option value="Under 5000">Under ₹5,000</option>
                <option value="5000 - 15000">₹5,000 - ₹15,000</option>
                <option value="15000 - 30000">₹15,000 - ₹30,000</option>
                <option value="Over 30000">Over ₹30,000</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select-glass"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="name-az">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* PRODUCT GRID */}
          <div className="luxury-product-grid-v2">
            {isLoading ? (
              <ProductGridSkeleton count={12} />
            ) : filteredProducts.length === 0 ? (
              <div
                style={{
                  padding: "5rem 2rem",
                  textAlign: "center",
                  width: "100%",
                  gridColumn: "1 / -1",
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "1.5rem",
                  border: "1px dashed rgba(255, 255, 255, 0.1)",
                }}
              >
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: "0.5rem", color: "#ffffff" }}>
                  No Hub Pieces Match Your Filter
                </h3>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "1.5rem" }}>
                  Try switching categories or resetting your search filters.
                </p>
                <button
                  onClick={clearAllFilters}
                  style={{
                    background: "var(--color-gold)",
                    color: "#000000",
                    border: "none",
                    padding: "0.6rem 1.4rem",
                    borderRadius: "999px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--font-heading)",
                    fontSize: "0.75rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              filteredProducts.slice(0, visibleCount).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>

          {filteredProducts.length > visibleCount && (
            <div className="product-list-more">
              <button type="button" className="hero-cta-pill" onClick={() => setVisibleCount((count) => count + 40)}>
                View More Products
              </button>
            </div>
          )}

          {/* Personal Shopping Banner */}
          <div className="subpage-ateliers-banner">
            <div className="ateliers-content">
              <span className="accent-label">Personal Shopping</span>
              <h2>Can&apos;t Find The Piece You Want?</h2>
              <p>
                Tell us the style, colour or size you are looking for and our team will help you find it in the Hub.
              </p>
              <Link href="/contact" className="hero-cta-pill">
                Request A Piece
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
