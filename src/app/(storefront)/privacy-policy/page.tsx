import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | RAKVIH Originals",
  description: "Learn how RAKVIH Originals protects client confidentiality, data security, and private consultation records.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="subpage-wrapper">
      {/* Hero Header */}
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/">Home</Link> <span>/</span> <span className="active">Privacy Policy</span>
          </div>
          <div className="hero-accent-line">
            <div className="accent-bar"></div>
            <span className="accent-label">Legal & Confidentiality</span>
          </div>
          <h1 className="subpage-title">
            PRIVACY <span className="hero-title-stroke">POLICY</span>
          </h1>
          <p className="subpage-subtitle">
            RAKVIH Originals is committed to the strictest standards of discretion, data sovereignty, and private client confidentiality worldwide.
          </p>
        </div>
      </section>

      {/* Policy Content */}
      <section className="subpage-content-section legal-content-section">
        <div className="subpage-container legal-container">
          <div className="legal-meta-card">
            <div className="legal-meta-item">
              <span className="legal-meta-label">LAST UPDATED</span>
              <span className="legal-meta-val">September 2026</span>
            </div>
            <div className="legal-meta-item">
              <span className="legal-meta-label">APPLICABILITY</span>
              <span className="legal-meta-val">Global (GDPR, CCPA & APPI Compliant)</span>
            </div>
            <div className="legal-meta-item">
              <span className="legal-meta-label">DATA PROTECTION OFFICER</span>
              <span className="legal-meta-val">privacy@rakvihoriginals.com</span>
            </div>
          </div>

          <div className="legal-body-content">
            <div className="legal-section">
              <span className="legal-sec-num">01</span>
              <h2>Our Commitment to Discretion</h2>
              <p>
                At RAKVIH Originals, we recognize that our clientele values absolute discretion. We collect, store, and process personal data exclusively to provide bespoke luxury experiences, personalized fittings, and secure international dispatch.
              </p>
              <p>
                We will never sell, lease, or monetize your personal data to any third parties under any circumstances.
              </p>
            </div>

            <div className="legal-section">
              <span className="legal-sec-num">02</span>
              <h2>Information We Collect</h2>
              <p>We may collect information when you visit our private salons, submit an inquiry, or subscribe to our newsletter:</p>
              <ul className="legal-bullet-list">
                <li><strong>Identity Data:</strong> Full name, title, preferred salutation, and VIP salon member credentials.</li>
                <li><strong>Contact Data:</strong> Verified email address, telephone number, and billing/shipping addresses.</li>
                <li><strong>Bespoke Profiling:</strong> Custom sizing measurements, monogram preferences, and private viewing appointment records.</li>
                <li><strong>Transactional Data:</strong> Purchase history, certificates of authenticity, and armored delivery confirmations.</li>
              </ul>
            </div>

            <div className="legal-section">
              <span className="legal-sec-num">03</span>
              <h2>How We Use Your Data</h2>
              <p>Your information is processed under rigorous technical and organizational safeguards for the following purposes:</p>
              <ul className="legal-bullet-list">
                <li>Fulfilling bespoke commissions and atelier monogram requests.</li>
                <li>Scheduling and hosting private salon appointments in Paris, Milan, New York, and Dubai.</li>
                <li>Arranging fully insured, armored white-glove international dispatch.</li>
                <li>Sending private previews of limited edition drops to registered collectors.</li>
              </ul>
            </div>

            <div className="legal-section">
              <span className="legal-sec-num">04</span>
              <h2>Data Security & Encryption</h2>
              <p>
                All personal and transactional data is encrypted in transit and at rest using banking-grade AES-256 encryption. Payment processing is conducted through Tier 1 PCI-DSS compliant gateways with zero on-server storage of sensitive card details.
              </p>
            </div>

            <div className="legal-section">
              <span className="legal-sec-num">05</span>
              <h2>Your Sovereign Rights</h2>
              <p>
                Regardless of your country of residence, you possess the right to access, rectify, restrict, or request the permanent erasure of your personal records from our databases at any time by contacting our Data Protection Officer.
              </p>
            </div>

            <div className="legal-section">
              <span className="legal-sec-num">06</span>
              <h2>Contact Our Privacy Desk</h2>
              <p>
                For all inquiries regarding our data practices or to exercise your rights, please reach out directly:
              </p>
              <div className="legal-contact-callout">
                <p><strong>RAKVIH Data Sovereignty Desk</strong></p>
                <p>Email: <a href="mailto:privacy@rakvihoriginals.com">privacy@rakvihoriginals.com</a></p>
                <p>Address: 18 Place Vendôme, 75001 Paris, France</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
