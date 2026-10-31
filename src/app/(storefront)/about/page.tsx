import React from "react";
import Link from "next/link";

export const metadata = {
  title: "About Us & Our Heritage | RAKVIH Originals",
  description: "Discover the heritage, craftsmanship philosophy, and architectural vision behind RAKVIH Originals.",
};

export default function AboutPage() {
  const stats = [
    { number: "100%", label: "Italian Full-Grain Leather" },
    { number: "40+", label: "Artisanal Assembly Steps" },
    { number: "24K", label: "Gold-Finish Solid Brass Clasps" },
    { number: "3", label: "Global Private Salons" },
  ];

  const pillars = [
    {
      num: "01",
      title: "Generational Provenance",
      desc: "We partner exclusively with multi-generational family tanneries across Tuscany and Veneto, preserving centuries of vegetable-tanning wisdom and certified ecological standards.",
    },
    {
      num: "02",
      title: "Sculptural Architecture",
      desc: "Every creation is engineered with balanced load distribution and architectural geometry, ensuring silhouettes maintain their crisp, iconic structure over decades of wear.",
    },
    {
      num: "03",
      title: "Double-Needle Saddle Stitch",
      desc: "Our leather masters stitch by hand using double-needle beeswax linen threads, producing seam durability and character that industrial machinery simply cannot achieve.",
    },
    {
      num: "04",
      title: "The Privé Standard",
      desc: "Strict limited production caps ensure that every RAKVIH original remains a rare, collectible masterpiece rigorously inspected down to the sub-millimeter.",
    },
  ];

  return (
    <main className="subpage-wrapper">
      {/* Hero Section */}
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/">Home</Link> <span>/</span> <span className="active">About Us</span>
          </div>
          <div className="hero-accent-line">
            <div className="accent-bar"></div>
            <span className="accent-label">About Us</span>
          </div>
          <h1 className="subpage-title">
            OUR STORY & <span className="hero-title-stroke">HERITAGE</span>
          </h1>
          <p className="subpage-subtitle">
            Founded on the relentless pursuit of permanence, architectural form, and uncompromising European luxury craftsmanship.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="subpage-content-section">
        <div className="subpage-container">
          {/* Key Metrics Strip */}
          <div className="about-stats-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="about-stat-card">
                <span className="stat-number">{stat.number}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Story & Vision Split */}
          <div className="story-split-grid" style={{ marginTop: "3rem" }}>
            <div className="story-text-card">
              <span className="accent-label">Vision & Philosophy</span>
              <h2>A Sanctuary of Permanent Design</h2>
              <p>
                RAKVIH ORIGINALS was founded to establish a new paradigm in luxury: creating objects that transcend seasonal cycles to become enduring family heirlooms.
              </p>
              <p>
                From sculptural leather handbags and precision-machined eyewear to pure cashmere jacquard stoles, every item reflects hundreds of hours of design refinement and artisanal mastery.
              </p>
              <p>
                We do not manufacture for volume; we craft for connoisseurs who demand sublime textures, flawless balance, and distinct identity.
              </p>
            </div>
            <div className="story-media-card">
              <img src="/banner01.jpg" alt="RAKVIH Atelier Craftsmanship" className="story-img" />
            </div>
          </div>

          {/* Core Pillars Grid */}
          <div className="about-pillars-header">
            <span className="accent-label">Our Pillars</span>
            <h2>The Four Pillars of Excellence</h2>
          </div>
          <div className="pillars-grid four-col">
            {pillars.map((pillar) => (
              <div key={pillar.num} className="pillar-card">
                <span className="pillar-num">{pillar.num}</span>
                <h3>{pillar.title}</h3>
                <p>{pillar.desc}</p>
              </div>
            ))}
          </div>

          {/* Global Presence Banner */}
          <div className="subpage-ateliers-banner">
            <div className="ateliers-content">
              <span className="accent-label">Private Salons</span>
              <h2>Experience Our Private Viewings</h2>
              <p>
                Connect with our concierge team to schedule a private styling appointment at our private salons in Paris, Milan, or New York.
              </p>
              <Link href="/contact" className="hero-cta-pill">
                Contact Our Team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
