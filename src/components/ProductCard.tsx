"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StoreProduct, ProductVariant } from "@/lib/fetchProducts";
import { useAuth } from "@/context/AuthContext";
import OptimizedImage from "@/components/OptimizedImage";
import AuthModal from "@/components/AuthModal";

interface ProductCardProps {
  product: StoreProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated, toggleWishlist, isInWishlist, addToCart } = useAuth();
  const [cartAdded, setCartAdded] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const rawVariants = product.variants || [];
  const variants: ProductVariant[] = rawVariants.length > 0
    ? rawVariants
    : [{
        id: typeof product.id === "number" ? product.id : 0,
        sizeName: "Standard",
        displayPrice: product.price,
        price: product.priceValue || 0,
        stock: 1,
        isSale: product.isSale,
      }];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(variants[0]);
  const isWishlisted = isInWishlist(product.id);
  const activePrice = selectedVariant.displayPrice;
  const activeOriginalPrice = selectedVariant.originalPrice ?? product.originalPrice;
  const isSale = selectedVariant.isSale ?? product.isSale;

  if (product.active === false) return null;

  const handleWishlistClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    toggleWishlist(product);
  };

  const handleCartClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    if (addToCart(product, selectedVariant, 1)) {
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 1500);
    }
  };

  const handleVariantClick = (event: React.MouseEvent, variant: ProductVariant) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedVariant(variant);
  };

  return (
    <article className="luxury-product-card-v2 group">
      <div className="product-showcase-box">
        <div className="showcase-badges-top-left">
          <span className="brand-gold-badge">{product.brandName}</span>
        </div>
        <div className="showcase-badges-top-right">
          {product.tag && <span className="gender-tag-badge">{product.tag}</span>}
        </div>
        <Link href={`/product/${product.id}`} className="product-image-pedestal">
          <OptimizedImage src={product.img} alt={product.name} className="product-main-img" fill sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" />
        </Link>
      </div>
      <div className="product-meta-details">
        <div className="product-category-row"><span className="product-meta-category">{product.material}</span></div>
        <Link href={`/product/${product.id}`} className="no-underline"><h3 className="product-card-heading" title={product.name}>{product.name}</h3></Link>
        <div className="product-card-variants-row">
          <span className="variant-label-tiny">Size:</span>
          <div className="variant-chips-wrap">
            {variants.slice(0, 2).map((variant) => (
              <button key={variant.id} type="button" onClick={(event) => handleVariantClick(event, variant)} className={`variant-chip-btn ${selectedVariant.id === variant.id ? "active" : ""}`}>{variant.sizeName}</button>
            ))}
            {variants.length > 2 && <Link href={`/product/${product.id}`} className="variant-more-chip">+{variants.length - 2}</Link>}
          </div>
        </div>
        <div className="product-pricing-strip">
          <div className="price-display-group"><span className="current-price-tag">{activePrice}</span>{isSale && activeOriginalPrice && <span className="original-strikethrough-tag">{activeOriginalPrice}</span>}</div>
          <div className="card-action-btns">
            <button type="button" className={`wishlist-icon-btn ${isWishlisted ? "active" : ""}`} onClick={handleWishlistClick} aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"} title={isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill={isWishlisted ? "var(--color-gold)" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78a5.5 5.5 0 0 0 1.06-8.84z" />
              </svg>
            </button>
            <button type="button" className={`wishlist-icon-btn${cartAdded ? " active" : ""}`} onClick={handleCartClick} aria-label="Add to cart" title="Add to Bag">
              {cartAdded ? "✓" : "＋"}
            </button>
          </div>
        </div>
      </div>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab="signin" />
    </article>
  );
}
