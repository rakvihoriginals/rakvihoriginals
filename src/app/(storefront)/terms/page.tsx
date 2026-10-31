import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | RAKVIH Originals",
  description: "Terms of service, bespoke commissions, authenticity guarantees, and international delivery policies of RAKVIH Originals.",
};

export default function TermsPage() {
  return (
    <main className="subpage-wrapper">
      {/* Hero Header */}
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/">Home</Link> <span>/</span> <span className="active">Terms & Conditions</span>
          </div>
          <div className="hero-accent-line">
            <div className="accent-bar"></div>
            <span className="accent-label">Terms of Exclusivity</span>
          </div>
          <h1 className="subpage-title">
            TERMS & <span className="hero-title-stroke">CONDITIONS</span>
          </h1>
          <p className="subpage-subtitle">
            Please review the contractual terms governing acquisitions, bespoke atelier commissions, and private salon appointments at RAKVIH Originals.
          </p>
        </div>
      </section>

      {/* Terms Body */}
      <section className="subpage-content-section legal-content-section">
        <div className="subpage-container legal-container">
          <div className="legal-meta-card">
            <div className="legal-meta-item">
              <span className="legal-meta-label">LAST REVISED</span>
              <span className="legal-meta-val">September 2026</span>
            </div>
            <div className="legal-meta-item">
              <span className="legal-meta-label">GOVERNING JURISDICTION</span>
              <span className="legal-meta-val">French Commercial Law & International Trade</span>
            </div>
            <div className="legal-meta-item">
              <span className="legal-meta-label">LEGAL INQUIRIES</span>
              <span className="legal-meta-val">legal@rakvihoriginals.com</span>
            </div>
          </div>

          <div className="legal-body-content">
            <div className="legal-section">
              <span className="legal-sec-num">01</span>
              <h2>Authenticity & Serialized Provenance</h2>
              <p>
                Every RAKVIH Originals creation is accompanied by an individually numbered, tamper-evident physical Certificate of Authenticity. Each piece is logged in our central heritage archives in Florence to guarantee provenance and protect collectors against counterfeits.
              </p>
            </div>

            <div className="legal-section">
              <span className="legal-sec-num">02</span>
              <h2>Bespoke Commissions & Sizing Orders</h2>
              <p>
                Custom monogramming, personalized hardware engraving, and bespoke sizing configurations commence only upon receipt of written client confirmation and deposit. Due to their unique individualized character, bespoke creations cannot be canceled or returned once atelier cutting has begun.
              </p>
            </div>

            <div className="legal-section">
              <span className="legal-sec-num">03</span>
              <h2>Private Salon Appointments & Protocol</h2>
              <p>
                Private salon viewings in Paris, Milan, New York, and Dubai are reserved on an exclusive basis. We request at least 24 hours advance notice for cancellations or rescheduling to preserve private salon availability for other collectors.
              </p>
            </div>

            <div className="legal-section">
              <span className="legal-sec-num">04</span>
              <h2>Armored Dispatch & Insurance</h2>
              <p>
                All shipments are dispatched via certified armored couriers with full transit insurance coverage until signature upon receipt. Risk of loss passes to the client only after physical handover and verified signature.
              </p>
            </div>

            <div className="legal-section">
              <span className="legal-sec-num">05</span>
              <h2>Returns & Exchanges Policy</h2>
              <p>
                Non-customized catalogue creations in pristine, unworn condition with all original archival packaging, seals, and certificates may be exchanged or returned within 14 calendar days of delivery.
              </p>
            </div>

            <div className="legal-section">
              <span className="legal-sec-num">06</span>
              <h2>Intellectual Property & Trademarks</h2>
              <p>
                All designs, sculptural silhouettes, hardware patterns, photography, and brand marks associated with RAKVIH ORIGINALS are the exclusive proprietary property of the Maison and protected under international copyright conventions.
              </p>
            </div>

            <div className="legal-section">
              <span className="legal-sec-num">07</span>
              <h2>Client Concierge Contact</h2>
              <p>
                For questions regarding terms, orders, or legal matters, please connect with our client care team:
              </p>
              <div className="legal-contact-callout">
                <p><strong>RAKVIH Legal & Client Governance</strong></p>
                <p>Email: <a href="mailto:legal@rakvihoriginals.com">legal@rakvihoriginals.com</a></p>
                <p>Telephone: +1 (212) 888-0018</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
