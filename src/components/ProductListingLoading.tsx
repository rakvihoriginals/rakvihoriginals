import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";

export default function ProductListingLoading() {
  return (
    <main className="subpage-wrapper">
      <section className="subpage-grid-section">
        <div className="subpage-container">
          <div className="luxury-product-grid-v2">
            <ProductGridSkeleton count={8} />
          </div>
        </div>
      </section>
    </main>
  );
}
