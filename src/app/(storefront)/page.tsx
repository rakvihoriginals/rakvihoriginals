"use client";

import { useEffect, useState } from 'react';
import { FrameScrollControls } from '@/components/home/FrameScrollControls';
import Link from 'next/link';
import { initScrollSequence } from '@/hooks/useScrollSequence';
import { fetchProductsBySubcategoryIds, Homepage4Categories } from '@/lib/fetchProducts';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';

export default function Home() {
    const [categoriesData, setCategoriesData] = useState<Partial<Homepage4Categories>>({});

    useEffect(() => {
        let cancelled = false;
        // Start product requests before initializing the frame animation.
        const categories: [keyof Homepage4Categories, number[]][] = [
            ['handbags', [7]], ['footwear', [1, 13]], ['belts', [12, 55]], ['stoles', [9]],
        ];
        for (const [category, ids] of categories) {
            fetchProductsBySubcategoryIds(ids, 8).then((products) => {
                if (!cancelled) setCategoriesData((current) => ({ ...current, [category]: products }));
            });
        }
        const destroyScrollSequence = initScrollSequence();
        return () => { cancelled = true; destroyScrollSequence(); };
    }, []);

    return (
        <main>

            {/*  ============================================================  */}
            {/*  HERO SECTION — SCROLL-DRIVEN ANIMATION                        */}
            {/*  ============================================================  */}
            <section id="hero" className="hero-section">
                <div className="hero-scroll-container">
                    <div className="hero-sticky">
                        <canvas id="hero-canvas" className="hero-canvas"></canvas>
                        <FrameScrollControls />

                        {/*  Gradient overlay for text legibility  */}
                        <div className="hero-gradient-overlay"></div>

                        {/*  CINEMATIC TEXT OVERLAYS — Bold uppercase + stroke style  */}
                        <div className="hero-text-overlay text-first" id="hero-text-1" data-start="0.00" data-end="0.10">
                            <div className="hero-accent-line">
                                <div className="accent-bar"></div>
                                <span className="accent-label">New Season Arrival</span>
                            </div>
                            <h1 className="hero-title-bold">
                                THE ART <span className="hero-title-stroke">OF THE HANDBAG</span>
                            </h1>
                            <p className="hero-desc">Where timeless craftsmanship meets contemporary elegance. Curated luxury for
                                the modern woman.</p>
                            <Link href="/handbags" className="hero-cta-pill">Explore Handbags</Link>
                        </div>

                        <div className="hero-text-overlay pos-top-right" id="hero-text-new-1" data-start="0.12" data-end="0.22">
                            <div className="hero-accent-line">
                                <div className="accent-bar"></div>
                                <span className="accent-label">The Deconstruction</span>
                            </div>
                            <h2 className="hero-title-bold hero-title-md">
                                ANATOMY OF <span className="hero-title-stroke">LUXURY</span>
                            </h2>
                            <p className="hero-desc">Every piece meticulously patterned and cut from the finest full-grain Italian lambskin.</p>
                        </div>

                        <div className="hero-text-overlay pos-bottom-left" id="hero-text-new-2" data-start="0.24" data-end="0.34">
                            <div className="hero-accent-line">
                                <div className="accent-bar"></div>
                                <span className="accent-label">Craftsmanship</span>
                            </div>
                            <h2 className="hero-title-bold hero-title-md">
                                CRAFTED TO <span className="hero-title-stroke">PERFECTION</span>
                            </h2>
                            <p className="hero-desc">Over 40 individual components hand-assembled by master artisans with generational savoir-faire.</p>
                        </div>

                        <div className="hero-text-overlay pos-top-right" id="hero-text-2" data-start="0.36" data-end="0.46">
                            <div className="hero-accent-line">
                                <div className="accent-bar"></div>
                                <span className="accent-label">Precision Detail</span>
                            </div>
                            <h2 className="hero-title-bold hero-title-md">
                                EVERY DETAIL <span className="hero-title-stroke">MATTERS</span>
                            </h2>
                            <p className="hero-desc">Polished 24k gold-finish brass hardware, precision turn-lock clasp, and hand-stitched cannage quilting.</p>
                        </div>

                        <div className="hero-text-overlay pos-bottom-left" id="hero-text-3" data-start="0.48" data-end="0.58">
                            <div className="hero-accent-line">
                                <div className="accent-bar"></div>
                                <span className="accent-label">Engineering</span>
                            </div>
                            <h2 className="hero-title-bold hero-title-md">
                                ENGINEERED <span className="hero-title-stroke">BEAUTY</span>
                            </h2>
                            <p className="hero-desc">Sculptural silhouette seamlessly formed with reinforced structural architecture.</p>
                        </div>

                        <div className="hero-text-overlay pos-top-right" id="hero-text-4" data-start="0.60" data-end="0.70">
                            <div className="hero-accent-line">
                                <div className="accent-bar"></div>
                                <span className="accent-label">Center Stage</span>
                            </div>
                            <h2 className="hero-title-bold hero-title-md">
                                THE COMPLETE <span className="hero-title-stroke">FORM</span>
                            </h2>
                            <p className="hero-desc">Gracefully descending into view, embodying timeless allure, balance, and poise.</p>
                        </div>

                        <div className="hero-text-overlay pos-bottom-left" id="hero-text-5" data-start="0.72" data-end="0.84">
                            <div className="hero-accent-line">
                                <div className="accent-bar"></div>
                                <span className="accent-label">Expanding Silhouette</span>
                            </div>
                            <h2 className="hero-title-bold hero-title-md">
                                A TRIO OF <span className="hero-title-stroke">DISTINCTION</span>
                            </h2>
                            <p className="hero-desc">Flanked by the Bordeaux Calfskin Tote and Monogram Satchel in an exquisite symphony of colors.</p>
                        </div>

                        <div className="hero-text-overlay text-last" id="hero-text-6" data-start="0.86" data-end="0.998">
                            <div className="hero-accent-line">
                                <div className="accent-bar"></div>
                                <span className="accent-label">The Masterpiece Drop</span>
                            </div>
                            <h2 className="hero-luxury-title">
                                THE LUXURY
                                <span className="hero-luxury-title-accent">Collection</span>
                            </h2>
                            <p className="hero-desc">Three iconic silhouettes, one unmistakable standard of prestige and refinement.</p>
                            <Link href="/handbags" className="hero-cta-pill">Shop Handbags</Link>
                        </div>

                        {/*  SCROLL INDICATOR  */}
                        <div className="scroll-indicator" id="scroll-indicator">
                            <div className="scroll-line"></div>
                            <span className="scroll-text">Scroll to explore</span>
                        </div>

                        {/*  SLIDE COUNTER  */}
                        <div className="hero-counter" id="hero-counter">
                            <span className="counter-current">01</span>
                            <div className="counter-divider"></div>
                            <span className="counter-total">08</span>
                        </div>
                    </div>
                </div>
            </section>

        {/* ============================================================ */}
        {/*  1. HAUTE HANDBAGS — LATEST ARRIVALS UNDER HERO 1             */}
        {/* ============================================================ */}
        <section id="handbags-section" className="section" style={{ padding: "1.5rem 0 1rem 0", background: "linear-gradient(180deg, rgba(8,8,8,0) 0%, rgba(14,14,14,0.6) 50%, rgba(8,8,8,0) 100%)" }}>
            <div className="container">
                <div className="spotlight-header reveal-element" style={{ marginBottom: "1rem" }}>
                    <div className="spotlight-header-left">
                        <div className="accent-line-row" style={{ marginBottom: "0.25rem" }}>
                            <div className="accent-bar"></div>
                            <span className="accent-label">Maison Maroquinerie</span>
                        </div>
                        <h2 className="spotlight-title">
                            <span className="spotlight-title-main">Latest Handbags.</span>
                        </h2>
                        <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                            Discover curated women&apos;s luxury leather handbags crafted for timeless elegance.
                        </p>
                    </div>
                    <Link href="/handbags" className="shop-drop-link" id="handbags-explore-btn">
                        <span>Explore All Handbags</span>
                        <div className="shop-drop-arrow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </div>
                    </Link>
                </div>

                <div className="luxury-product-grid-v2" style={{ gap: "1rem" }}>
                    {!categoriesData.handbags ? (
                        <ProductGridSkeleton count={8} />
                    ) : Array.isArray(categoriesData?.handbags) && categoriesData.handbags.length > 0 ? (
                        categoriesData.handbags.slice(0, 8).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <div style={{ textAlign: "center", gridColumn: "1 / -1", padding: "2rem 0", color: "rgba(255,255,255,0.6)" }}>
                            Loading latest handbags...
                        </div>
                    )}
                </div>
            </div>
        </section>

{/* ============================================================ */}
        {/*  HERO 2 — L.V TRAINER SNEAKER SCROLL ANIMATION               */}
        {/* ============================================================ */}
        <section id="hero2" className="hero-section" style={{ paddingTop: "0", minHeight: "auto" }}>
            <div className="z-10 relative flex flex-col items-center text-center" style={{ marginTop: "0", paddingTop: "0.75rem", paddingBottom: "0.2rem" }}>
                <div className="hero-accent-line reveal-element justify-center mb-1">
                    <span className="accent-label">Explore Category</span>
                </div>
                <h2 className="hero-title-bold reveal-element delay-1" style={{ textAlign: 'center', marginTop: '0', marginBottom: '0.1rem' }}>
                    OUR FOOTWEAR<br />
                    <span className="relative inline-block pb-1 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-3/4 after:h-[2px] after:bg-gradient-to-r after:from-transparent after:via-[var(--color-gold)] after:to-transparent after:opacity-80" style={{ color: 'var(--color-gold)' }}>COLLECTION</span>
                </h2>
                <p className="reveal-element delay-2" style={{ maxWidth: '600px', margin: '0.1rem auto 0.4rem auto', fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontStyle: 'italic', letterSpacing: '0.03em', color: 'var(--color-gold)', lineHeight: '1.4', fontWeight: 300 }}>
                    Step into elegance with our expertly crafted footwear, designed to combine high-end luxury with modern streetwear.
                </p>
            </div>
            
            <div className="hero-scroll-container" style={{ marginTop: "0" }}>
                <div className="hero-sticky">
                    <canvas id="hero-canvas-2" className="hero-canvas"></canvas>
                    <FrameScrollControls />
                    <div className="hero-gradient-overlay"></div>

                    <div className="hero-text-overlay text-first" id="hero2-text-1">
                        <div className="hero-accent-line">
                            <div className="accent-bar"></div>
                            <span className="accent-label">New Drop 2026</span>
                        </div>
                        <h2 className="hero-title-bold">
                            THE ICONIC <span className="hero-title-stroke">TRAINER</span>
                        </h2>
                        <p className="hero-desc">Where streetwear meets haute couture. A sneaker born from artistic vision.</p>
                    </div>

                    <div className="hero-text-overlay pos-top-right" id="hero2-text-2" data-start="0.15" data-end="0.28">
                        <div className="hero-accent-line">
                            <div className="accent-bar"></div>
                            <span className="accent-label">Construction</span>
                        </div>
                        <h2 className="hero-title-bold hero-title-md">
                            HAND <span className="hero-title-stroke">STITCHED</span>
                        </h2>
                        <p className="hero-desc">Over 30 components assembled by master cobblers — Italian calfskin upper with reinforced rubber sole.</p>
                    </div>

                    <div className="hero-text-overlay pos-bottom-left" id="hero2-text-3" data-start="0.30" data-end="0.45">
                        <div className="hero-accent-line">
                            <div className="accent-bar"></div>
                            <span className="accent-label">Materials</span>
                        </div>
                        <h2 className="hero-title-bold hero-title-md">
                            GRAINED <span className="hero-title-stroke">LEATHER</span>
                        </h2>
                        <p className="hero-desc">Supple calf leather embossed with the classic monogram pattern. Built for all-day comfort.</p>
                    </div>

                    <div className="hero-text-overlay pos-top-right" id="hero2-text-4" data-start="0.47" data-end="0.58">
                        <div className="hero-accent-line">
                            <div className="accent-bar"></div>
                            <span className="accent-label">Sole</span>
                        </div>
                        <h2 className="hero-title-bold hero-title-md">
                            GEL-CUSHION <span className="hero-title-stroke">OUTSOLE</span>
                        </h2>
                        <p className="hero-desc">Technical rubber sole with monogram flowers insert. Unrivalled grip and impact absorption.</p>
                    </div>

                    <div className="hero-text-overlay pos-bottom-left" id="hero2-text-5" data-start="0.60" data-end="0.72">
                        <div className="hero-accent-line">
                            <div className="accent-bar"></div>
                            <span className="accent-label">Identity</span>
                        </div>
                        <h2 className="hero-title-bold hero-title-md">
                            VINTAGE <span className="hero-title-stroke">BASKETBALL</span>
                        </h2>
                        <p className="hero-desc">Inspired by vintage basketball sneakers. 7 hours of stitching per pair.</p>
                    </div>

                    <div className="hero-text-overlay text-last" id="hero2-text-6">
                        <div className="hero-accent-line">
                            <div className="accent-bar"></div>
                            <span className="accent-label">The Edit</span>
                        </div>
                        <h2 className="hero-title-bold hero-title-md">
                            STEP INTO <span className="hero-title-stroke">LUXURY</span>
                        </h2>
                        <p className="hero-desc">The sneaker of the season. Available in limited quantities.</p>
                        <Link href="/footwear" className="hero-cta-pill">Explore Footwear</Link>
                    </div>

                    {/*  SLIDE COUNTER  */}
                    <div className="hero-counter">
                        <span className="counter-current">01</span>
                        <div className="counter-divider"></div>
                        <span className="counter-total">06</span>
                    </div>
                </div>
            </div>
        </section>

{/* ============================================================ */}
        {/*  2. LUXURY FOOTWEAR — LATEST ARRIVALS UNDER HERO 2             */}
        {/* ============================================================ */}
        <section id="footwear-section" className="section" style={{ padding: "1.5rem 0 1rem 0", background: "linear-gradient(180deg, rgba(8,8,8,0) 0%, rgba(14,14,14,0.6) 50%, rgba(8,8,8,0) 100%)" }}>
            <div className="container">
                <div className="spotlight-header reveal-element" style={{ marginBottom: "1rem" }}>
                    <div className="spotlight-header-left">
                        <div className="accent-line-row" style={{ marginBottom: "0.25rem" }}>
                            <div className="accent-bar"></div>
                            <span className="accent-label">Maison Cobblery</span>
                        </div>
                        <h2 className="spotlight-title">
                            <span className="spotlight-title-main">Luxury Footwear.</span>
                        </h2>
                        <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                            Hand-assembled sneakers, slides, and runners fusing Italian craftsmanship with streetwear.
                        </p>
                    </div>
                    <Link href="/footwear" className="shop-drop-link" id="footwear-explore-btn">
                        <span>Explore All Footwear</span>
                        <div className="shop-drop-arrow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </div>
                    </Link>
                </div>

                <div className="luxury-product-grid-v2" style={{ gap: "1rem" }}>
                    {!categoriesData.footwear ? (
                        <ProductGridSkeleton count={8} />
                    ) : categoriesData?.footwear && categoriesData.footwear.length > 0 ? (
                        categoriesData.footwear.slice(0, 8).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <div style={{ textAlign: "center", gridColumn: "1 / -1", padding: "2rem 0", color: "rgba(255,255,255,0.6)" }}>
                            Loading latest footwear...
                        </div>
                    )}
                </div>
            </div>
        </section>

        {/* ============================================================ */}
        {/*  HERO 6 — BELTS SCROLL ANIMATION                             */}
        {/* ============================================================ */}
        <section id="hero6" className="hero-section" style={{ paddingTop: "0", minHeight: "auto" }}>
            <div className="z-10 relative flex flex-col items-center text-center" style={{ marginTop: "0", paddingTop: "0.75rem", paddingBottom: "0.2rem" }}>
                <div className="hero-accent-line reveal-element justify-center mb-1">
                    <span className="accent-label">Explore Category</span>
                </div>
                <h2 className="hero-title-bold reveal-element delay-1" style={{ textAlign: 'center', marginTop: '0', marginBottom: '0.1rem' }}>
                    BELT<br />
                    <span className="relative inline-block pb-1 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-3/4 after:h-[2px] after:bg-gradient-to-r after:from-transparent after:via-[var(--color-gold)] after:to-transparent after:opacity-80" style={{ color: 'var(--color-gold)' }}>COLLECTION</span>
                </h2>
                <p className="reveal-element delay-2" style={{ maxWidth: '600px', margin: '0.1rem auto 0.4rem auto', fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontStyle: 'italic', letterSpacing: '0.03em', color: 'var(--color-gold)', lineHeight: '1.4', fontWeight: 300 }}>
                    The perfect finishing touch. Discover our collection of signature belts crafted from premium materials.
                </p>
            </div>
            <div className="hero-scroll-container" style={{ marginTop: "0" }}>
                <div className="hero-sticky">
                    <canvas id="hero-canvas-6" className="hero-canvas"></canvas>
                    <FrameScrollControls />
                    <div className="hero-gradient-overlay"></div>

                    <div className="hero-text-overlay text-first" id="hero6-text-1">
                        <div className="hero-accent-line">
                            <div className="accent-bar"></div>
                            <span className="accent-label">L.V Belts</span>
                        </div>
                        <h2 className="hero-title-bold">
                            THE LUXURY <span className="hero-title-stroke">BELT</span>
                        </h2>
                        <p className="hero-desc">Elevate your silhouette. The signature L.V belt collection.</p>
                    </div>

                    <div className="hero-text-overlay pos-top-right" id="hero6-text-2" data-start="0.15" data-end="0.28">
                        <div className="hero-accent-line">
                            <div className="accent-bar"></div>
                            <span className="accent-label">Hardware</span>
                        </div>
                        <h2 className="hero-title-bold hero-title-md">
                            SIGNATURE <span className="hero-title-stroke">BUCKLE</span>
                        </h2>
                        <p className="hero-desc">Gleaming hardware crafted with precision, featuring the iconic L.V initials.</p>
                    </div>

                    <div className="hero-text-overlay pos-bottom-left" id="hero6-text-3" data-start="0.30" data-end="0.45">
                        <div className="hero-accent-line">
                            <div className="accent-bar"></div>
                            <span className="accent-label">Materials</span>
                        </div>
                        <h2 className="hero-title-bold hero-title-md">
                            TAURILLON <span className="hero-title-stroke">LEATHER</span>
                        </h2>
                        <p className="hero-desc">Sumptuous full-grain leather with a distinctive natural grain texture.</p>
                    </div>

                    <div className="hero-text-overlay pos-top-right" id="hero6-text-4" data-start="0.47" data-end="0.58">
                        <div className="hero-accent-line">
                            <div className="accent-bar"></div>
                            <span className="accent-label">Versatility</span>
                        </div>
                        <h2 className="hero-title-bold hero-title-md">
                            REVERSIBLE <span className="hero-title-stroke">DESIGN</span>
                        </h2>
                        <p className="hero-desc">Two styles in one. Monogram canvas on one side, smooth calf leather on the other.</p>
                    </div>

                    <div className="hero-text-overlay pos-bottom-left" id="hero6-text-5" data-start="0.60" data-end="0.72">
                        <div className="hero-accent-line">
                            <div className="accent-bar"></div>
                            <span className="accent-label">Width</span>
                        </div>
                        <h2 className="hero-title-bold hero-title-md">
                            40MM <span className="hero-title-stroke">PROFILE</span>
                        </h2>
                        <p className="hero-desc">The classic 40mm width — bold enough to make a statement, versatile enough for any loop.</p>
                    </div>

                    <div className="hero-text-overlay text-last" id="hero6-text-6">
                        <div className="hero-accent-line">
                            <div className="accent-bar"></div>
                            <span className="accent-label">The Edit</span>
                        </div>
                        <h2 className="hero-title-bold hero-title-md">
                            COMPLETE YOUR <span className="hero-title-stroke">LOOK</span>
                        </h2>
                        <p className="hero-desc">The definitive accessory for the modern wardrobe.</p>
                        <Link href="/belts" className="hero-cta-pill">Explore Belts</Link>
                    </div>

                    {/*  SLIDE COUNTER  */}
                    <div className="hero-counter">
                        <span className="counter-current">01</span>
                        <div className="counter-divider"></div>
                        <span className="counter-total">06</span>
                    </div>
                </div>
            </div>
        </section>

        {/* ============================================================ */}
        {/*  3. SIGNATURE BELTS — LATEST ARRIVALS UNDER HERO 6             */}
        {/* ============================================================ */}
        <section id="belts-section" className="section" style={{ padding: "1.5rem 0 1rem 0", background: "linear-gradient(180deg, rgba(8,8,8,0) 0%, rgba(14,14,14,0.6) 50%, rgba(8,8,8,0) 100%)" }}>
            <div className="container">
                <div className="spotlight-header reveal-element" style={{ marginBottom: "1rem" }}>
                    <div className="spotlight-header-left">
                        <div className="accent-line-row" style={{ marginBottom: "0.25rem" }}>
                            <div className="accent-bar"></div>
                            <span className="accent-label">Maison Ceinturerie</span>
                        </div>
                        <h2 className="spotlight-title">
                            <span className="spotlight-title-main">Signature Belts.</span>
                        </h2>
                        <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                            Reversible calfskin leather belts with polished gold and silver tone hardware.
                        </p>
                    </div>
                    <Link href="/belts" className="shop-drop-link" id="belts-explore-btn">
                        <span>Explore All Belts</span>
                        <div className="shop-drop-arrow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </div>
                    </Link>
                </div>

                <div className="luxury-product-grid-v2" style={{ gap: "1rem" }}>
                    {!categoriesData.belts ? (
                        <ProductGridSkeleton count={8} />
                    ) : categoriesData?.belts && categoriesData.belts.length > 0 ? (
                        categoriesData.belts.slice(0, 8).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <div style={{ textAlign: "center", gridColumn: "1 / -1", padding: "2rem 0", color: "rgba(255,255,255,0.6)" }}>
                            Loading latest belts...
                        </div>
                    )}
                </div>
            </div>
        </section>
            {/*  ============================================================  */}
            {/*  HERO 5 — LUXURY STOLES SCROLL ANIMATION                       */}
            {/*  ============================================================  */}
            <section id="hero5" className="hero-section">
                <div className="pt-3 pb-3 z-10 relative flex flex-col items-center text-center">
                    <div className="hero-accent-line reveal-element justify-center mb-4">
                        <span className="accent-label">Explore Category</span>
                    </div>
                    <h2 className="hero-title-bold reveal-element delay-1" style={{ textAlign: 'center' }}>
                        OUR STOLES<br />
                        <span className="relative inline-block pb-1 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-3/4 after:h-[2px] after:bg-gradient-to-r after:from-transparent after:via-[var(--color-gold)] after:to-transparent after:opacity-80" style={{ color: 'var(--color-gold)' }}>COLLECTION</span>
                    </h2>
                    <p className="reveal-element delay-2" style={{ maxWidth: '600px', margin: '0.5rem auto 1.5rem auto', fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontStyle: 'italic', letterSpacing: '0.03em', color: 'var(--color-gold)', lineHeight: '1.7', fontWeight: 300 }}>
                        A harmonious blend of cashmere and silk, delivering unparalleled warmth with effortless elegance.
                    </p>
                </div>
                <div className="hero-scroll-container">
                    <div className="hero-sticky">
                        <canvas id="hero-canvas-5" className="hero-canvas"></canvas>
                        <FrameScrollControls />
                        <div className="hero-gradient-overlay"></div>

                        <div className="hero-text-overlay text-first" id="hero5-text-1">
                            <div className="hero-accent-line">
                                <div className="accent-bar"></div>
                                <span className="accent-label">L.V Monogram</span>
                            </div>
                            <h2 className="hero-title-bold">
                                THE LUXURY <span className="hero-title-stroke">STOLE</span>
                            </h2>
                            <p className="hero-desc">An embrace of pure cashmere and silk. The essential L.V stole.</p>
                        </div>

                        <div className="hero-text-overlay pos-top-right" id="hero5-text-2" data-start="0.15" data-end="0.28">
                            <div className="hero-accent-line">
                                <div className="accent-bar"></div>
                                <span className="accent-label">Fabrication</span>
                            </div>
                            <h2 className="hero-title-bold hero-title-md">
                                CASHMERE <span className="hero-title-stroke">& SILK</span>
                            </h2>
                            <p className="hero-desc">A delicate blend of the world's finest fibers for unparalleled softness and
                                warmth.</p>
                        </div>

                        <div className="hero-text-overlay pos-bottom-left" id="hero5-text-3" data-start="0.30" data-end="0.45">
                            <div className="hero-accent-line">
                                <div className="accent-bar"></div>
                                <span className="accent-label">Pattern</span>
                            </div>
                            <h2 className="hero-title-bold hero-title-md">
                                SIGNATURE <span className="hero-title-stroke">JACQUARD</span>
                            </h2>
                            <p className="hero-desc">The iconic Monogram pattern woven seamlessly into the fabric.</p>
                        </div>

                        <div className="hero-text-overlay pos-top-right" id="hero5-text-4" data-start="0.47" data-end="0.58">
                            <div className="hero-accent-line">
                                <div className="accent-bar"></div>
                                <span className="accent-label">Finishing</span>
                            </div>
                            <h2 className="hero-title-bold hero-title-md">
                                HAND ROLLED <span className="hero-title-stroke">FRINGE</span>
                            </h2>
                            <p className="hero-desc">Meticulously finished by artisans for an elegant, fluid drape.</p>
                        </div>

                        <div className="hero-text-overlay pos-bottom-left" id="hero5-text-5" data-start="0.60" data-end="0.72">
                            <div className="hero-accent-line">
                                <div className="accent-bar"></div>
                                <span className="accent-label">Versatility</span>
                            </div>
                            <h2 className="hero-title-bold hero-title-md">
                                EFFORTLESS <span className="hero-title-stroke">DRAPE</span>
                            </h2>
                            <p className="hero-desc">Wrap it, knot it, or drape it — a timeless accessory for any season.</p>
                        </div>

                        <div className="hero-text-overlay text-last" id="hero5-text-6">
                            <div className="hero-accent-line">
                                <div className="accent-bar"></div>
                                <span className="accent-label">The Edit</span>
                            </div>
                            <h2 className="hero-title-bold hero-title-md">
                                WARMTH IN <span className="hero-title-stroke">STYLE</span>
                            </h2>
                            <p className="hero-desc">Elevate your wardrobe with the ultimate luxury layer.</p>
                            <Link href="/stoles" className="hero-cta-pill">Explore Stoles</Link>
                        </div>

                        {/*  SLIDE COUNTER  */}
                        <div className="hero-counter">
                            <span className="counter-current">01</span>
                            <div className="counter-divider"></div>
                            <span className="counter-total">06</span>
                        </div>
                    </div>
                </div>
            </section>

          {/* ============================================================ */}
        {/*  4. HAUTE STOLES — LATEST ARRIVALS UNDER HERO 5             */}
        {/* ============================================================ */}
        <section id="stoles-section" className="section" style={{ padding: "1.5rem 0 1rem 0", background: "linear-gradient(180deg, rgba(8,8,8,0) 0%, rgba(14,14,14,0.6) 50%, rgba(8,8,8,0) 100%)" }}>
            <div className="container">
                <div className="spotlight-header reveal-element" style={{ marginBottom: "1rem" }}>
                    <div className="spotlight-header-left">
                        <div className="accent-line-row" style={{ marginBottom: "0.25rem" }}>
                            <div className="accent-bar"></div>
                            <span className="accent-label">Maison Étole</span>
                        </div>
                        <h2 className="spotlight-title">
                            <span className="spotlight-title-main">Haute Stoles.</span>
                        </h2>
                        <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                            A delicate blend of pure cashmere and fine silk jacquards woven on artisanal looms.
                        </p>
                    </div>
                    <Link href="/stoles" className="shop-drop-link" id="stoles-explore-btn">
                        <span>Explore All Stoles</span>
                        <div className="shop-drop-arrow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </div>
                    </Link>
                </div>

                <div className="luxury-product-grid-v2" style={{ gap: "1rem" }}>
                    {!categoriesData.stoles ? (
                        <ProductGridSkeleton count={8} />
                    ) : categoriesData?.stoles && categoriesData.stoles.length > 0 ? (
                        categoriesData.stoles.slice(0, 8).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <div style={{ textAlign: "center", gridColumn: "1 / -1", padding: "2rem 0", color: "rgba(255,255,255,0.6)" }}>
                            Loading latest stoles...
                        </div>
                    )}
                </div>
            </div>
        </section>

        {/* ============================================================ */}
        {/*  4. QUALITY FIRST — Middle Section with 3 Category Cards      */}
        {/* ============================================================ */}
        <section id="craftsmanship" className="section section-quality" style={{ padding: "1.5rem 0 2rem 0" }}>
            <div className="container">
                <div className="section-header-center reveal-element" style={{ marginBottom: "1.5rem" }}>
                    <span className="section-eyebrow-gold">Quality First</span>
                    <h2 className="section-title-serif" style={{ marginBottom: "0.25rem" }}>Elevated Style, Made Effortless<br />& Affordable</h2>
                    <p className="section-subtitle">Carefully selected pieces made to fit seamlessly into modern life.</p>
                </div>

                <div className="quality-grid" id="quality-grid-container">
                    <div className="quality-card hover-float-parent quality-anim-card" id="quality-card-1">
                        <div className="quality-card-image">
                            <img src="handbag.webp" alt="Lady D!OR White Lace" loading="lazy"
                                className="floating-img float-v1 delay-2" />
                            <div className="quality-card-gradient"></div>
                            <div className="quality-card-label">
                                <h3>Apparel</h3>
                            </div>
                        </div>
                        <div className="quality-card-text">
                            <p>Timeless wardrobe staples crafted from the finest materials.</p>
                        </div>
                        <div className="impact-crack"></div>
                    </div>
                    <div className="quality-card hover-float-parent quality-anim-card" id="quality-card-2">
                        <div className="quality-card-image">
                            <img src="shoe 6.webp" alt="FERR@GAMO Leather Loafers" loading="lazy"
                                className="floating-img float-breathe delay-1" />
                            <div className="quality-card-gradient"></div>
                            <div className="quality-card-label">
                                <h3>Accessories</h3>
                            </div>
                        </div>
                        <div className="quality-card-text">
                            <p>Handcrafted leather accents with premium gold-tone hardware.</p>
                        </div>
                        <div className="impact-crack"></div>
                    </div>
                    <div className="quality-card hover-float-parent quality-anim-card" id="quality-card-3">
                        <div className="quality-card-image">
                            <img src="belt 6.jpg" alt="Vers@ce Medusa Belt" loading="lazy"
                                className="floating-img float-diag delay-4" />
                            <div className="quality-card-gradient"></div>
                            <div className="quality-card-label">
                                <h3>Signature Accents</h3>
                            </div>
                        </div>
                        <div className="quality-card-text">
                            <p>Handcrafted Italian leather accents with sculpted gold-tone hardware.</p>
                        </div>
                        <div className="impact-crack"></div>
                    </div>
                </div>
            </div>
        </section>

            {/*  ============================================================  */}
            {/*  5. WORLD'S MOST LOVED (ARC GALLERY)                           */}
            {/*  ============================================================  */}
            <section id="brands" className="section-arc-gallery">
                <div className="container">
                    <div className="brands-header reveal-element" style={{ "textAlign": "center", "marginBottom": "1rem" }}>
                        <h2 className="brands-title" style={{ "marginBottom": "0.5rem" }}>
                            <span className="brands-title-serif">World's Most </span>
                            <span className="brands-title-bold">Loved</span>
                        </h2>
                        <p className="brands-subtitle" style={{ "maxWidth": "600px", "margin": "0 auto" }}>Discover the iconic silhouettes
                            that have defined generations of style.</p>
                    </div>

                    <div className="arc-container" id="arc-wrapper">
                        {/*  Outer Left  */}
                        <div className="arc-item arc-outer-left">
                            <img src="ban.png" alt="Classic Tote" className="floating-img float-v2 delay-3" />
                            <div className="arc-item-title">Classic Tote</div>
                        </div>
                        {/*  Inner Left  */}
                        <div className="arc-item arc-inner-left">
                            <img src="banner.png" alt="Evening Clutch" className="floating-img float-diag delay-1" />
                            <div className="arc-item-title">Evening Clutch</div>
                        </div>
                        {/*  Center Focus  */}
                        <div className="arc-item arc-center hover-float-parent">
                            <img src="banner01.jpg" alt="Grand Heritage" className="floating-img float-breathe" />
                            <div className="arc-item-title">Grand Heritage</div>
                        </div>
                        {/*  Inner Right  */}
                        <div className="arc-item arc-inner-right">
                            <img src="phto.png" alt="Signature Satchel"
                                className="floating-img float-drift delay-2" />
                            <div className="arc-item-title">Signature Satchel</div>
                        </div>
                        {/*  Outer Right  */}
                        <div className="arc-item arc-outer-right">
                            <img src="coachbrand.jpg" alt="Minimalist Mini" className="floating-img float-v1 delay-4" />
                            <div className="arc-item-title">Minimalist Mini</div>
                        </div>
                    </div>
                </div>
            </section>

            {/*  ============================================================  */}
            {/*  6. SOCIAL MOMENTS — Trust Stats + Featured Image              */}
            {/*  ============================================================  */}
            <section id="about" className="section section-social">
                <div className="container">
                    <div className="social-grid reveal-element">
                        {/*  Left: Stats  */}
                        <div className="social-left">
                            <div className="social-badge">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    strokeWidth="2">
                                    <rect x="2" y="2" width="20" height="20" rx="5" />
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                </svg>
                                <span>Live Gallery</span>
                            </div>

                            <h2 className="social-title">BUILT AROUND<br />Trust, Style and Quality</h2>

                            <div className="stats-grid">
                                <div className="stat-item">
                                    <div className="stat-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                            strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4>10,000+</h4>
                                        <p>Trusted Customers</p>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                            strokeWidth="2">
                                            <path
                                                d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4>Premium</h4>
                                        <p>Quality Craftsmanship</p>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                            strokeWidth="2">
                                            <path d="M6 3h12l4 6-10 13L2 9z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4>Luxury</h4>
                                        <p>Made Affordable</p>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                            strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="2" y1="12" x2="22" y2="12" />
                                            <path
                                                d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4>Fast & Secure</h4>
                                        <p>Worldwide Shipping</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/*  Right: Featured Image  */}
                        <div className="social-right">
                            <div className="social-image-wrapper">
                                <div className="social-image-glow"></div>
                                <div className="social-image-frame hover-float-parent">
                                    <img src="phto.png" alt="Elegant Signature Satchel" loading="lazy"
                                        className="floating-img float-breathe delay-2" />

                                    {/*  Quote overlay  */}
                                    <div className="social-quote">
                                        <div className="social-quote-icon">"</div>
                                        <p>The minimalist aesthetic I've been searching for. A true sanctuary for modern living.
                                        </p>
                                    </div>

                                    {/*  Arrow button  */}
                                    <button className="social-arrow-btn" aria-label="View more">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                            strokeWidth="2">
                                            <line x1="7" y1="17" x2="17" y2="7" />
                                            <polyline points="7 7 17 7 17 17" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/*  ============================================================  */}


            {/*  ============================================================  */}
            {/*  FOOTER                                                        */}
            {/*  ============================================================  */}



        </main>
    );
}
