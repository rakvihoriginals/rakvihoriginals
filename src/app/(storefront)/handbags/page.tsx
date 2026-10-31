"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { fetchProductsBySubcategoryIds, StoreProduct } from "@/lib/fetchProducts";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";

// Subcategory 7 is Women's Haute Handbags (356 Masterpieces)
const HANDBAG_SUBCATEGORY_IDS = [7];

export default function HandbagsPage() {
  const [allHandbags, setAllHandbags] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [visibleCount, setVisibleCount] = useState(40);

  useEffect(() => {
    async function loadHandbags() {
      setIsLoading(true);
      const products = await fetchProductsBySubcategoryIds(HANDBAG_SUBCATEGORY_IDS);
      setAllHandbags(products);
      setIsLoading(false);
    }
    loadHandbags();
  }, []);

  // Compute available brands
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    allHandbags.forEach((item) => {
      if (item.brandName) brandsSet.add(item.brandName);
    });
    return Array.from(brandsSet).sort();
  }, [allHandbags]);

  // Multi-Filter and Sorting
  const filteredHandbags = useMemo(() => {
    let result = [...allHandbags];

    // Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.brandName.toLowerCase().includes(q) ||
          (item.sku && item.sku.toLowerCase().includes(q))
      );
    }

    // Brand Filter
    if (selectedBrand !== "All") {
      result = result.filter((item) => item.brandName === selectedBrand);
    }

    // Price Filter
    if (selectedPrice === "Under 15000") {
      result = result.filter((item) => item.priceValue > 0 && item.priceValue < 15000);
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
  }, [allHandbags, searchQuery, selectedBrand, selectedPrice, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedBrand !== "All" ||
    selectedPrice !== "All" ||
    sortBy !== "featured";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedBrand("All");
    setSelectedPrice("All");
    setSortBy("featured");
  };

  return (
    <main className="subpage-wrapper">
      {/* Hero Section */}
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs" style={{ marginBottom: "0.75rem" }}>
            <Link href="/">Home</Link> <span>/</span> <Link href="/collection-hub">Collections</Link> <span>/</span>{" "}
            <span className="active">Women&apos;s Handbags</span>
          </div>
          <div className="hero-accent-line">
            <div className="accent-bar"></div>
            <span className="accent-label">Haute Maroquinerie • Women</span>
          </div>
          <h1 className="subpage-title">
            WOMEN&apos;S <span className="hero-title-stroke">HANDBAGS</span>
          </h1>
          <p className="subpage-subtitle">
            Sculptural architecture, Italian cannage quilting, and full-grain calfskins crafted exclusively for women&apos;s luxury styling.
          </p>
        </div>
      </section>

      {/* Grid & Filter Section */}
      <section className="subpage-grid-section">
        <div className="subpage-container">
          {/* Controls Bar */}
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
                Showing {filteredHandbags.length} Women&apos;s Handbags
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
              {/* Search */}
              <input
                type="text"
                placeholder="Search handbags..."
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

              {/* Price Filter */}
              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="filter-select-glass"
              >
                <option value="All">All Prices</option>
                <option value="Under 15000">Under ₹15,000</option>
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
              <ProductGridSkeleton count={8} />
            ) : filteredHandbags.length === 0 ? (
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
                  No Handbags Match Your Selection
                </h3>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "1.5rem" }}>
                  Try resetting your active search or brand filter.
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
              filteredHandbags.slice(0, visibleCount).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>

          {filteredHandbags.length > visibleCount && (
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
              <h2>Bespoke Leather Monogramming & Appointments</h2>
              <p>
                Experience private viewing of rare limited editions, custom monogramming, and bespoke leather orders at our private salons.
              </p>
              <Link href="/contact" className="hero-cta-pill">
                Request VIP Viewing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}