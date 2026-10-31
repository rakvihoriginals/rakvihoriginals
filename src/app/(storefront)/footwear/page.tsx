"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { fetchProductsBySubcategoryIds, StoreProduct } from "@/lib/fetchProducts";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";

// Subcategories 1 (Men - 102) & 13 (Women - 9) = 111 Footwear Masterpieces
const FOOTWEAR_SUBCATEGORY_IDS = [1, 13];

export default function FootwearPage() {
  const [allFootwear, setAllFootwear] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedGender, setSelectedGender] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [visibleCount, setVisibleCount] = useState(40);

  useEffect(() => {
    async function loadFootwear() {
      setIsLoading(true);
      const products = await fetchProductsBySubcategoryIds(FOOTWEAR_SUBCATEGORY_IDS);
      setAllFootwear(products);
      setIsLoading(false);
    }
    loadFootwear();
  }, []);

  // Compute available brands from fetched data
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    allFootwear.forEach((item) => {
      if (item.brandName) brandsSet.add(item.brandName);
    });
    return Array.from(brandsSet).sort();
  }, [allFootwear]);

  // Multi-Filter and Sorting
  const filteredFootwear = useMemo(() => {
    let result = [...allFootwear];

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

    // Gender Filter
    if (selectedGender !== "All") {
      result = result.filter((item) => item.gender === selectedGender);
    }

    // Price Filter
    if (selectedPrice === "Under 10000") {
      result = result.filter((item) => item.priceValue > 0 && item.priceValue < 10000);
    } else if (selectedPrice === "10000 - 20000") {
      result = result.filter((item) => item.priceValue >= 10000 && item.priceValue <= 20000);
    } else if (selectedPrice === "Over 20000") {
      result = result.filter((item) => item.priceValue > 20000);
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
  }, [allFootwear, searchQuery, selectedBrand, selectedGender, selectedPrice, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedBrand !== "All" ||
    selectedGender !== "All" ||
    selectedPrice !== "All" ||
    sortBy !== "featured";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedBrand("All");
    setSelectedGender("All");
    setSelectedPrice("All");
    setSortBy("featured");
  };

  return (
    <main className="subpage-wrapper">
      {/* Hero Section */}
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/">Home</Link> <span>/</span> <Link href="/collection-hub">Collections</Link> <span>/</span>{" "}
            <span className="active">Footwear</span>
          </div>
          <div className="hero-accent-line">
            <div className="accent-bar"></div>
            <span className="accent-label">Haute Cobblery</span>
          </div>
          <h1 className="subpage-title">
            LUXURY <span className="hero-title-stroke">FOOTWEAR</span>
          </h1>
          <p className="subpage-subtitle">
            Crafted with over 30 precision components per pair, combining architectural sole engineering with hand-buffed calfskin leathers.
          </p>
        </div>
      </section>

      {/* Grid & Filter Section */}
      <section className="subpage-grid-section">
        <div className="subpage-container">
          {/* FUNCTIONAL FILTERS BAR */}
          <div
            className="grid-meta-bar"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "15px",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 0",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: "30px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span className="result-count" style={{ fontWeight: 700, fontSize: "14px", color: "#ffffff" }}>
                Showing {filteredFootwear.length} Exclusive Silhouettes
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
                placeholder="Search sneakers, slides..."
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
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="filter-select-glass"
              >
                <option value="All">All Genders</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
              </select>

              {/* Price Dropdown */}
              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="filter-select-glass"
              >
                <option value="All">All Prices</option>
                <option value="Under 10000">Under ₹10,000</option>
                <option value="10000 - 20000">₹10,000 - ₹20,000</option>
                <option value="Over 20000">Over ₹20,000</option>
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
              <ProductGridSkeleton count={6} />
            ) : filteredFootwear.length === 0 ? (
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
                  No Footwear Matches Your Filter
                </h3>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "1.5rem" }}>
                  Try adjusting your search criteria or resetting filters.
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
              filteredFootwear.slice(0, visibleCount).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>

          {filteredFootwear.length > visibleCount && (
            <div className="product-list-more">
              <button type="button" className="hero-cta-pill" onClick={() => setVisibleCount((count) => count + 40)}>
                View More Products
              </button>
            </div>
          )}

          {/* Custom Fit Service Banner */}
          <div className="subpage-ateliers-banner">
            <div className="ateliers-content">
              <span className="accent-label">Custom Fit Service</span>
              <h2>Bespoke Sizing & Last Creation</h2>
              <p>
                Our master cobblers provide bespoke measuring appointments for custom arch and width configurations.
              </p>
              <Link href="/contact" className="hero-cta-pill">
                Consult With A Footwear Specialist
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}