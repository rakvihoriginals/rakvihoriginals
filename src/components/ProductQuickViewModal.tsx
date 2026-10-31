"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StoreProduct } from "@/lib/fetchProducts";
import { supabaseImageUrl } from "@/lib/imageUrl";

interface QuickViewProps {
  product: StoreProduct | null;
  onClose: () => void;
}

export function ProductQuickViewModal({ product, onClose }: QuickViewProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  // Reset selected image when product changes
  useEffect(() => {
    setSelectedImageIdx(0);
  }, [product]);

  // Handle ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (product) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [product, onClose]);

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [product.img];
  const currentImage = images[selectedImageIdx] || product.img;

  return (
    <div className="quickview-overlay" onClick={onClose}>
      <div
        className="quickview-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quickview-title"
      >
        {/* Close Button */}
        <button
          className="quickview-close-btn"
          onClick={onClose}
          aria-label="Close Quick View"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="6" />
          </svg>
        </button>

        <div className="quickview-body">
          {/* Left Column: Image Gallery */}
          <div className="quickview-gallery">
            <div className="quickview-main-image-wrap">
              <img
                src={supabaseImageUrl(currentImage, 1000)}
                alt={product.name}
                className="quickview-main-img"
              />
              {product.tag && (
                <span className="quickview-gender-badge">{product.tag}</span>
              )}
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="quickview-thumbnails">
                {images.map((imgUrl, idx) => (
                  <button
                    key={`thumb-${idx}`}
                    type="button"
                    className={`quickview-thumb-btn ${idx === selectedImageIdx ? "active" : ""}`}
                    onClick={() => setSelectedImageIdx(idx)}
                  >
                    <img src={supabaseImageUrl(imgUrl, 160)} alt={`${product.name} view ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Actions */}
          <div className="quickview-details">
            <div className="quickview-header-row">
              <span className="quickview-brand-pill">{product.brandName}</span>
              <span className="quickview-category-label">{product.material}</span>
            </div>

            <h2 id="quickview-title" className="quickview-title">
              {product.name}
            </h2>

            {product.sku && (
              <div className="quickview-sku-badge">
                <span>SKU:</span> <code>{product.sku}</code>
              </div>
            )}

            {/* Price Box */}
            <div className="quickview-price-box">
              <div className="quickview-price-row">
                <span className="quickview-current-price">{product.price}</span>
                {product.isSale && product.originalPrice && (
                  <span className="quickview-original-price">
                    {product.originalPrice}
                  </span>
                )}
              </div>
              <span className="quickview-tax-note">Inclusive of all concierge taxes & insured transit</span>
            </div>

            {/* Description / Quality note */}
            <div className="quickview-desc">
              <p>
                {product.description ||
                  "Crafted with meticulous attention to detail, each curated piece embodies timeless silhouette architecture, artisanal finish, and impeccable savoir-faire."}
              </p>
            </div>

            {/* Features checklist */}
            <div className="quickview-features-list">
              <div className="quickview-feat-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>100% Curated Luxury Quality Standards</span>
              </div>
              <div className="quickview-feat-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span>Express Dispatched with Private VIP Tracking</span>
              </div>
              <div className="quickview-feat-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Dedicated VIP Styling Concierge</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="quickview-actions">
              <Link
                href="/contact"
                onClick={onClose}
                className="quickview-appointment-btn"
              >
                Book Private Salon Viewing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
