"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { fetchProductsBySubcategoryIds, StoreProduct } from "@/lib/fetchProducts";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";

const STOLES_SUBCATEGORY_IDS = [9];

export default function StolesPage() {
  const [allStoles, setAllStoles] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedGender, setSelectedGender] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [visibleCount, setVisibleCount] = useState(40);

  useEffect(() => {
    async function loadStoles() {
      setIsLoading(true);
      const products = await fetchProductsBySubcategoryIds(STOLES_SUBCATEGORY_IDS);
      setAllStoles(products);
      setIsLoading(false);
    }
    loadStoles();
  }, []);

  // Compute available brands
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    allStoles.forEach((item) => {
      if (item.brandName) brandsSet.add(item.brandName);
    });
    return Array.from(brandsSet).sort();
  }, [allStoles]);

  // Multi-Filter and Sorting
  const filteredStoles = useMemo(() => {
    let result = [...allStoles];

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
    } else if (selectedPrice === "5000 - 15000") {
      result = result.filter((item) => item.priceValue >= 5000 && item.priceValue <= 15000);
    } else if (selectedPrice === "Over 15000") {
      result = result.filter((item) => item.priceValue > 15000);
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
  }, [allStoles, searchQuery, selectedBrand, selectedGender, selectedPrice, sortBy]);

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
            <span className="active">Stoles</span>
          </div>
          <div className="hero-accent-line">
            <div className="accent-bar"></div>
            <span className="accent-label">Haute Étole & Cashmere</span>
          </div>
          <h1 className="subpage-title">
            LUXURY <span className="hero-title-stroke">STOLES</span>
          </h1>
          <p className="subpage-subtitle">
            Woven from pure Mulberry silk and lightweight cashmere jacquards for timeless elegance.
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
              padding: "15px 0 25px 0",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: "30px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span className="result-count" style={{ fontWeight: 700, fontSize: "14px", color: "#ffffff" }}>
                Showing {filteredStoles.length} Luxury Stoles
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
                placeholder="Search stoles, cards..."
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
                <option value="Unisex">Unisex</option>
              </select>

              {/* Price Dropdown */}
              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="filter-select-glass"
              >
                <option value="All">All Prices</option>
                <option value="Under 5000">Under ₹5,000</option>
                <option value="5000 - 15000">₹5,000 - ₹15,000</option>
                <option value="Over 15000">Over ₹15,000</option>
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
              <ProductGridSkeleton count={8} />
            ) : filteredStoles.length === 0 ? (
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
                  No Items Match Your Selection
                </h3>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "1.5rem" }}>
                  Try switching sub-categories or resetting filters.
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
              filteredStoles.slice(0, visibleCount).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>

          {filteredStoles.length > visibleCount && (
            <div className="product-list-more">
              <button type="button" className="hero-cta-pill" onClick={() => setVisibleCount((count) => count + 40)}>
                View More Products
              </button>
            </div>
          )}

          {/* Silk Preservation Banner */}
          <div className="subpage-ateliers-banner">
            <div className="ateliers-content">
              <span className="accent-label">Silk & Jacquard Care</span>
              <h2>Preserving Ethereal Textures</h2>
              <p>
                All RAKVIH silk and cashmere editions are delivered in acid-free archival tissue wraps to prevent friction and maintain fiber integrity.
              </p>
              <Link href="/contact" className="hero-cta-pill">
                Request Archival Storage Kit
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}