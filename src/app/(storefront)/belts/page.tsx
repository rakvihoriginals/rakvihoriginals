"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { fetchProductsBySubcategoryIds, StoreProduct } from "@/lib/fetchProducts";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";

// Subcategories 12 (Men - 52) & 55 (Women - 22) = 74 Signature Belts
const BELT_SUBCATEGORY_IDS = [12, 55];

export default function BeltsPage() {
  const [allBelts, setAllBelts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedGender, setSelectedGender] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [visibleCount, setVisibleCount] = useState(40);

  useEffect(() => {
    async function loadBelts() {
      setIsLoading(true);
      const products = await fetchProductsBySubcategoryIds(BELT_SUBCATEGORY_IDS);
      setAllBelts(products);
      setIsLoading(false);
    }
    loadBelts();
  }, []);

  // Compute available brands from fetched data
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    allBelts.forEach((item) => {
      if (item.brandName) brandsSet.add(item.brandName);
    });
    return Array.from(brandsSet).sort();
  }, [allBelts]);

  // Multi-Filter and Sorting
  const filteredBelts = useMemo(() => {
    let result = [...allBelts];

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
    if (selectedPrice === "Under 5000") {
      result = result.filter((item) => item.priceValue > 0 && item.priceValue < 5000);
    } else if (selectedPrice === "5000 - 10000") {
      result = result.filter((item) => item.priceValue >= 5000 && item.priceValue <= 10000);
    } else if (selectedPrice === "Over 10000") {
      result = result.filter((item) => item.priceValue > 10000);
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
  }, [allBelts, searchQuery, selectedBrand, selectedGender, selectedPrice, sortBy]);

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
            <span className="active">Belts</span>
          </div>
          <div className="hero-accent-line">
            <div className="accent-bar"></div>
            <span className="accent-label">Haute Ceinturerie</span>
          </div>
          <h1 className="subpage-title">
            SIGNATURE <span className="hero-title-stroke">BELTS</span>
          </h1>
          <p className="subpage-subtitle">
            Engineered with hand-stitched saddle leather and reversible multi-tone finishes, defining the waist with sculpted distinction.
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
                Showing {filteredBelts.length} Signature Belts
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
                placeholder="Search belts by name or SKU..."
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
                <option value="Under 5000">Under ₹5,000</option>
                <option value="5000 - 10000">₹5,000 - ₹10,000</option>
                <option value="Over 10000">Over ₹10,000</option>
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
            ) : filteredBelts.length === 0 ? (
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
                  No Belts Match Your Filter
                </h3>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "1.5rem" }}>
                  Try relaxing your search terms or resetting the selected filters.
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
              filteredBelts.slice(0, visibleCount).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>

          {filteredBelts.length > visibleCount && (
            <div className="product-list-more">
              <button type="button" className="hero-cta-pill" onClick={() => setVisibleCount((count) => count + 40)}>
                View More Products
              </button>
            </div>
          )}

          {/* Bespoke Atelier Banner */}
          <div className="subpage-ateliers-banner">
            <div className="ateliers-content">
              <span className="accent-label">Custom Sizing & Punching</span>
              <h2>Bespoke Strap Customization</h2>
              <p>
                Receive precision hole punching and custom strap trimming tailored to your exact waist and hip measurements.
              </p>
              <Link href="/contact" className="hero-cta-pill">
                Book A Fitting Appointment
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}