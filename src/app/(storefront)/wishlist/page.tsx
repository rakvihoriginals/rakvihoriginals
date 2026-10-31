"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ProductCard } from "@/components/ProductCard";

export default function WishlistPage() {
  const { wishlist, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="subpage-wrapper">
        <div className="subpage-container" style={{ padding: "6rem 0", textAlign: "center" }}>
          <h2 style={{ color: "var(--color-gold)", fontFamily: "var(--font-heading)" }}>
            Loading Saved Masterpieces...
          </h2>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="subpage-wrapper">
        <section className="subpage-hero">
          <div className="subpage-hero-inner">
            <div className="subpage-breadcrumbs">
              <Link href="/">Home</Link> <span>/</span> <span className="active">Wishlist</span>
            </div>
            <div className="hero-accent-line">
              <div className="accent-bar"></div>
              <span className="accent-label">VIP Private Vault</span>
            </div>
            <h1 className="subpage-title">
              SAVED <span className="hero-title-stroke">CREATIONS</span>
            </h1>
          </div>
        </section>

        <section style={{ padding: "3rem 0 4rem 0" }}>
          <div className="subpage-container" style={{ textAlign: "center", maxWidth: "550px", margin: "0 auto" }}>
            <div className="auth-card-wrap">
              <span className="brand-gold-badge" style={{ marginBottom: "1rem" }}>
                Authentication Required
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "#ffffff", marginBottom: "0.75rem" }}>
                Sign In To Access Your Wishlist
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.88rem", marginBottom: "2rem" }}>
                Your saved luxury pieces, bespoke sizes, and reserved silhouettes are stored securely in your VIP profile.
              </p>
              <Link href="/login?redirect=/wishlist" className="hero-cta-pill" style={{ width: "100%", display: "block" }}>
                Sign In / Register
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="subpage-wrapper">
      {/* Hero Section */}
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/">Home</Link> <span>/</span> <span className="active">Wishlist</span>
          </div>
          <div className="hero-accent-line">
            <div className="accent-bar"></div>
            <span className="accent-label">Private Collection</span>
          </div>
          <h1 className="subpage-title">
            YOUR SAVED <span className="hero-title-stroke">WISHLIST</span>
          </h1>
          <p className="subpage-subtitle">
            Curate your dream salon collection. Reserved silhouettes ready for bespoke inquiries and private viewing.
          </p>
        </div>
      </section>

      {/* Wishlist Grid */}
      <section style={{ padding: "3rem 0 6rem 0" }}>
        <div className="subpage-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "1rem" }}>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "14px", color: "#ffffff" }}>
              {wishlist.length} {wishlist.length === 1 ? "Masterpiece" : "Masterpieces"} in Your Vault
            </span>
            <Link
              href="/collection-hub"
              style={{
                color: "var(--color-gold)",
                fontFamily: "var(--font-heading)",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              + Add More Items
            </Link>
          </div>

          {wishlist.length === 0 ? (
            <div
              style={{
                padding: "6rem 2rem",
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "1.5rem",
                border: "1px dashed rgba(255, 255, 255, 0.1)",
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "#ffffff", marginBottom: "0.5rem" }}>
                Your Wishlist Is Currently Empty
              </h3>
              <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "2rem", fontSize: "0.9rem" }}>
                Explore our curated handbag, footwear, and accessory collections to bookmark your favorite luxury silhouettes.
              </p>
              <Link href="/collection-hub" className="hero-cta-pill">
                Explore All Collections
              </Link>
            </div>
          ) : (
            <div className="luxury-product-grid-v2">
              {wishlist.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
