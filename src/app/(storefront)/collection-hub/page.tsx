"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { fetchAllCollectionProducts, StoreProduct } from "@/lib/fetchProducts";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";

// Subcategory IDs matching store pages and The Original Hub
const CATEGORY_TABS = [
  { id: "all", name: "All Collections", subIds: null },
  { id: "original-hub", name: "The Original Hub", subIds: [68, 69, 70, 71, 73, 74, 75] },
  { id: "handbags", name: "Women's Handbags", subIds: [7, 68] },
  { id: "footwear", name: "Footwear", subIds: [1, 13, 73] },
  { id: "belts", name: "Signature Belts", subIds: [12, 55, 74] },
  { id: "stoles", name: "Luxury Stoles", subIds: [9, 75] },
];

export default function CollectionHubPage() {
  const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedGender, setSelectedGender] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [visibleCount, setVisibleCount] = useState(40);

  useEffect(() => {
    async function loadAllProducts() {
      setIsLoading(true);
      try {
        const prods = await fetchAllCollectionProducts();
        setAllProducts(prods || []);
      } catch (err) {
        console.error("Failed to load collection products:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAllProducts();
  }, []);

  // Extract all unique brands dynamically
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    allProducts.forEach((item) => {
      const brand = (item as any).brandName || (item as any).brand;
      if (brand) brandsSet.add(brand);
    });
    return Array.from(brandsSet).sort();
  }, [allProducts]);

  // Multi-Filter and Sorting Engine
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // 1. Tab Filter (Supports both camelCase and snake_case keys)
    if (activeTab !== "all") {
      const activeTabObj = CATEGORY_TABS.find((t) => t.id === activeTab);
      if (activeTabObj?.subIds) {
        result = result.filter((item) => {
          const subId = (item as any).subcategoryId ?? (item as any).subcategory_id;
          const catId = (item as any).categoryId ?? (item as any).category_id;
          if (activeTab === "original-hub" && catId === 5) return true;
          return subId && activeTabObj.subIds!.includes(Number(subId));
        });
      }
    }

    // 2. Search Query (Protected against null/undefined values)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const nameMatch = item.name?.toLowerCase().includes(q) ?? false;
        const brandMatch = ((item as any).brandName || (item as any).brand)?.toLowerCase().includes(q) ?? false;
        const skuMatch = (item as any).sku?.toLowerCase().includes(q) ?? false;
        const materialMatch = item.material?.toLowerCase().includes(q) ?? false;

        return nameMatch || brandMatch || skuMatch || materialMatch;
      });
    }

    // 3. Brand Filter
    if (selectedBrand !== "All") {
      result = result.filter((item) => {
        const brand = (item as any).brandName || (item as any).brand;
        return brand === selectedBrand;
      });
    }

    // 4. Gender Filter
    if (selectedGender !== "All") {
      result = result.filter((item) => {
        const g = (item as any).gender ? (item as any).gender.trim() : "Unisex";
        return g.toLowerCase() === selectedGender.toLowerCase();
      });
    }

    // 5. Price Filter
    if (selectedPrice === "Under 5000") {
      result = result.filter((item) => (item as any).priceValue > 0 && (item as any).priceValue < 5000);
    } else if (selectedPrice === "5000 - 15000") {
      result = result.filter((item) => (item as any).priceValue >= 5000 && (item as any).priceValue <= 15000);
    } else if (selectedPrice === "15000 - 30000") {
      result = result.filter((item) => (item as any).priceValue >= 15000 && (item as any).priceValue <= 30000);
    } else if (selectedPrice === "Over 30000") {
      result = result.filter((item) => (item as any).priceValue > 30000);
    }

    // 6. Sorting
    if (sortBy === "price-low-high") {
      result.sort((a, b) => ((a as any).priceValue || 0) - ((b as any).priceValue || 0));
    } else if (sortBy === "price-high-low") {
      result.sort((a, b) => ((b as any).priceValue || 0) - ((a as any).priceValue || 0));
    } else if (sortBy === "name-az") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    return result;
  }, [allProducts, activeTab, searchQuery, selectedBrand, selectedGender, selectedPrice, sortBy]);

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
  };

  return (
    <main className="subpage-wrapper">
      {/* Hero Header */}
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/">Home</Link> <span>/</span> <span className="active">All Collections</span>
          </div>
          <div className="hero-accent-line">
            <div className="accent-bar"></div>
            <span className="accent-label">The Complete Maison Universe</span>
          </div>
          <h1 className="subpage-title">
            ALL <span className="hero-title-stroke">COLLECTIONS</span>
          </h1>
          <p className="subpage-subtitle">
            Explore all luxury creations across Handbags, Footwear, Signature Belts, Haute Stoles, and The Original Hub with real-time atelier filters.
          </p>
        </div>
      </section>

      {/* Main Grid & Filter Section */}
      <section className="subpage-grid-section">
        <div className="subpage-container">
          {/* Category Tabs Strip */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              paddingBottom: "15px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: "20px",
            }}
          >
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? "var(--color-gold)" : "rgba(255, 255, 255, 0.05)",
                  color: activeTab === tab.id ? "#000000" : "#ffffff",
                  border: activeTab === tab.id ? "1px solid var(--color-gold)" : "1px solid rgba(255, 255, 255, 0.1)",
                  padding: "8px 22px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.3s ease",
                  letterSpacing: "0.05em",
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Functional Filters Toolbar */}
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
                Showing {filteredProducts.length} Luxury Masterpieces
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
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search by name, brand, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input-glass"
                style={{ minWidth: "210px" }}
              />

              {/* Brand Filter */}
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

              {/* Gender Filter */}
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="filter-select-glass"
              >
                <option value="All">All Genders</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
              </select>

              {/* Price Filter */}
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

              {/* Sort Dropdown */}
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

          {/* Product Grid */}
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
                  No Products Match Your Selection
                </h3>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "1.5rem" }}>
                  Try switching categories or resetting active search filters.
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

          {/* Bottom Salon Banner */}
          <div className="subpage-ateliers-banner">
            <div className="ateliers-content">
              <span className="accent-label">Private Salon Experience</span>
              <h2>Bespoke Personal Styling & VIP Viewing</h2>
              <p>
                Our master curators in Bangalore, Paris, and Milan provide private video consultations, sizing advice, and custom gift presentation.
              </p>
              <Link href="/contact" className="hero-cta-pill">
                Request VIP Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}