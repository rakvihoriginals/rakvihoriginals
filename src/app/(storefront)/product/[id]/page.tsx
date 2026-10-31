"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { fetchProductById, StoreProduct, ProductVariant } from "@/lib/fetchProducts";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/context/AuthContext";
import OptimizedImage from "@/components/OptimizedImage";
import AuthModal from "@/components/AuthModal";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = use(params);
  const { isAuthenticated, addToCart, toggleWishlist, isInWishlist } = useAuth();

  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gallery state
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);

  // Variant & Quantity state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<string | null>("craftsmanship");

  // Notification state
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadProduct() {
      setIsLoading(true);
      setRelatedProducts([]);
      const showProduct = (prod: StoreProduct) => {
        if (cancelled) return;
        setProduct(prod);
        setSelectedVariant(prod.variants[0]);
        setSelectedImgIdx(0);
        setIsLoading(false);
      };
      const { product: prod, relatedProducts: related } = await fetchProductById(id, showProduct);
      if (cancelled) return;
      if (!prod) setProduct(null);
      setRelatedProducts(related);
      setIsLoading(false);
    }
    loadProduct();
    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) {
    return (
      <main className="subpage-wrapper">
        <div className="subpage-container" style={{ padding: "6rem 0", textAlign: "center" }}>
          <div className="skeleton-shimmer" style={{ width: "300px", height: "300px", margin: "0 auto 2rem", borderRadius: "1.5rem" }} />
          <h2 style={{ color: "var(--color-gold)", fontFamily: "var(--font-heading)", fontSize: "1.2rem" }}>
            Loading Masterpiece Details...
          </h2>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="subpage-wrapper">
        <div className="subpage-container" style={{ padding: "4rem 0", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", color: "#ffffff", marginBottom: "1rem" }}>
            Masterpiece Not Found
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "2rem" }}>
            The requested creation is either unavailable or has been archived from our salon.
          </p>
          <Link href="/collection-hub" className="hero-cta-pill">
            Explore All Collections
          </Link>
        </div>
      </main>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.img];
  const currentImg = images[selectedImgIdx] || product.img;

  const activePrice = selectedVariant ? selectedVariant.displayPrice : product.price;
  const activeOriginalPrice = selectedVariant ? selectedVariant.originalPrice : product.originalPrice;
  const isSale = selectedVariant ? selectedVariant.isSale : product.isSale;
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }

    addToCart(product, selectedVariant, quantity);
    setFeedbackMsg("Added to your shopping bag!");
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }

    toggleWishlist(product);
  };

  return (
    <main className="subpage-wrapper">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            background: "linear-gradient(135deg, rgba(20, 20, 24, 0.95) 0%, rgba(10, 10, 12, 0.98) 100%)",
            border: "1px solid var(--color-gold)",
            color: "#ffffff",
            padding: "1rem 1.75rem",
            borderRadius: "999px",
            boxShadow: "0 15px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(196, 161, 116, 0.3)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontFamily: "var(--font-heading)",
            fontSize: "0.85rem",
            fontWeight: 700,
            animation: "quickViewFadeIn 0.3s ease",
          }}
        >
          <span style={{ color: "var(--color-gold)", fontSize: "1.1rem" }}>✓</span>
          <span>{feedbackMsg}</span>
          <Link
            href="/cart"
            style={{
              marginLeft: "0.5rem",
              color: "var(--color-gold)",
              textDecoration: "underline",
              fontSize: "0.8rem",
            }}
          >
            View Bag →
          </Link>
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab="signin" />

      {/* Breadcrumb Header */}
      <section style={{ padding: "2rem 0 1rem 0", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
        <div className="subpage-container">
          <div className="subpage-breadcrumbs">
            <Link href="/">Home</Link> <span>/</span>{" "}
            <Link href="/collection-hub">Collections</Link> <span>/</span>{" "}
            <span>{product.material}</span> <span>/</span>{" "}
            <span className="active">{product.name}</span>
          </div>
        </div>
      </section>

      {/* Main PDP Grid */}
      <section className="product-page-section">
        <div className="subpage-container">
          <div className="product-detail-grid">
            {/* Left Column: Image Showcase */}
            <div className="pdp-gallery-container">
              <div className="pdp-main-image-wrap">
                <OptimizedImage
                  src={currentImg}
                  alt={product.name}
                  className="pdp-main-img"
                  priority
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {product.tag && (
                  <span className="quickview-gender-badge">{product.tag}</span>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="pdp-thumbnails-strip">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={`thumb-${idx}`}
                      type="button"
                      className={`pdp-thumb-card ${idx === selectedImgIdx ? "active" : ""}`}
                      onClick={() => setSelectedImgIdx(idx)}
                      style={{ position: "relative", overflow: "hidden" }}
                    >
                      <OptimizedImage
                        src={imgUrl}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        fill
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Information & Actions */}
            <div className="pdp-info-column">
              <div className="pdp-badges-row">
                <span className="pdp-brand-badge">{product.brandName}</span>
                <span className="pdp-category-pill">{product.material}</span>
                <span className="pdp-stock-badge">● In Stock & Ready to Dispatch</span>
              </div>

              <h1 className="pdp-title">{product.name}</h1>

              <div className="pdp-meta-row">
                {product.sku && (
                  <div>
                    <span>SKU: </span>
                    <code style={{ color: "var(--color-gold)", background: "rgba(255, 255, 255, 0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                      {product.sku}
                    </code>
                  </div>
                )}
                <div>
                  <span>Edition: </span>
                  <span style={{ color: "#ffffff" }}>Maison Privé Selection</span>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="pdp-price-card">
                <div className="pdp-price-main-row">
                  <span className="pdp-current-price">{activePrice}</span>
                  {isSale && activeOriginalPrice && (
                    <span className="pdp-original-price">{activeOriginalPrice}</span>
                  )}
                </div>
                <span style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.5)" }}>
                  Price inclusive of all luxury concierge import duties & insured transit.
                </span>
              </div>

              {/* Variants Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="pdp-variant-section">
                  <div className="pdp-variant-title-row">
                    <span className="pdp-variant-title">
                      Select Size / Variation: {selectedVariant ? <strong style={{ color: "var(--color-gold)" }}>{selectedVariant.sizeName}</strong> : null}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.5)" }}>
                      {product.variants.length} available
                    </span>
                  </div>
                  <div className="pdp-variant-grid">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`pdp-variant-btn ${selectedVariant?.id === v.id ? "active" : ""}`}
                      >
                        {v.sizeName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255, 255, 255, 0.6)" }}>
                  Quantity:
                </span>
                <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "999px", padding: "4px 12px", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={{ background: "none", border: "none", color: "#ffffff", fontSize: "1rem", cursor: "pointer" }}
                  >
                    -
                  </button>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.85rem", color: "#ffffff" }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    style={{ background: "none", border: "none", color: "#ffffff", fontSize: "1rem", cursor: "pointer" }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="pdp-action-buttons">
                <div className="pdp-secondary-actions-row">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="pdp-cart-btn"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    <span>{isAuthenticated ? "Add To Shopping Bag" : "Login To Add To Bag"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWishlist}
                    className={`pdp-wishlist-toggle-btn ${isWishlisted ? "active" : ""}`}
                    title={isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? "var(--color-gold)" : "none"} stroke={isWishlisted ? "var(--color-gold)" : "currentColor"} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Accordion Sections */}
              <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                {/* 1. Craftsmanship */}
                <div className="pdp-accordion-item">
                  <button
                    type="button"
                    className="pdp-accordion-header"
                    onClick={() => setOpenAccordion(openAccordion === "craftsmanship" ? null : "craftsmanship")}
                  >
                    <span>Atelier Craftsmanship & Materials</span>
                    <span>{openAccordion === "craftsmanship" ? "−" : "+"}</span>
                  </button>
                  {openAccordion === "craftsmanship" && (
                    <div className="pdp-accordion-content">
                      <p>
                        {product.description ||
                          "Every creation is meticulously inspected and verified by our master curators in Florence and Paris. Handcrafted using premium grade leathers, gold-toned or palladium-plated hardware, and artisanal edge-finishes."}
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Delivery & Returns */}
                <div className="pdp-accordion-item">
                  <button
                    type="button"
                    className="pdp-accordion-header"
                    onClick={() => setOpenAccordion(openAccordion === "shipping" ? null : "shipping")}
                  >
                    <span>Complimentary VIP Courier & Transit</span>
                    <span>{openAccordion === "shipping" ? "−" : "+"}</span>
                  </button>
                  {openAccordion === "shipping" && (
                    <div className="pdp-accordion-content">
                      <p>
                        All RAKVIH orders are packaged in signature presentation boxes with protective dust covers. Delivered via insured express courier with real-time tracking across India within 2–5 business days.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Authenticity Guarantee */}
                <div className="pdp-accordion-item">
                  <button
                    type="button"
                    className="pdp-accordion-header"
                    onClick={() => setOpenAccordion(openAccordion === "authenticity" ? null : "authenticity")}
                  >
                    <span>Maison Authenticity & Quality Assurance</span>
                    <span>{openAccordion === "authenticity" ? "−" : "+"}</span>
                  </button>
                  {openAccordion === "authenticity" && (
                    <div className="pdp-accordion-content">
                      <p>
                        Every piece arrives with an individual RAKVIH serial certificate and quality guarantee stamp. Our concierge is available 7 days a week for private video consultations and bespoke sizing appointments.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div style={{ marginTop: "6rem", paddingTop: "4rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div className="section-header-center" style={{ marginBottom: "3rem" }}>
                <span className="section-eyebrow-gold">Curated Recommendations</span>
                <h2 className="section-title-xl" style={{ fontSize: "2rem" }}>Similar Masterpieces</h2>
                <p className="section-subtitle">Complementary silhouettes from the same haute collection.</p>
              </div>

              <div className="luxury-product-grid-v2">
                {relatedProducts.map((relProduct) => (
                  <ProductCard key={relProduct.id} product={relProduct} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
