import React from "react";

interface SkeletonProps {
  count?: number;
}

export function ProductCardSkeleton() {
  return (
    <div className="luxury-product-card luxury-card-skeleton">
      <div className="product-image-box skeleton-shimmer">
        <div className="skeleton-badge-ph"></div>
      </div>
      <div className="product-info-box">
        <div className="skeleton-line skeleton-brand-ph"></div>
        <div className="skeleton-line skeleton-title-ph"></div>
        <div className="skeleton-line skeleton-title-ph-2"></div>
        <div className="skeleton-price-row">
          <div className="skeleton-line skeleton-price-ph"></div>
          <div className="skeleton-line skeleton-btn-ph"></div>
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={`skeleton-${idx}`} />
      ))}
    </>
  );
}
