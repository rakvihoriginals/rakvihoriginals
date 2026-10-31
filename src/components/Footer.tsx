"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const PORTAL_ROUTES = [
  "/dashboard",
  "/brands",
  "/categorysetup",
  "/products",
  "/attribute",
  "/coupons",
  "/payments",
  "/orderupdate",
  "/pos",
  "/productreport",
  "/orderreport",
  "/hero",
  "/header",
  "/middle",
  "/bottom",
  "/insta",
  "/about-top",
  "/about-identity",
  "/about-bottom",
  "/review",
  "/site-info",
  "/videos-admin",
  "/createsub",
  "/messages",
  "/customer",
];

const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/rakvih_solutions_pvt_ltd?igsh=N2xybTAzYW10bHRm",
  facebook: "https://www.facebook.com/share/15UG4Sd23e/",
  google: "https://www.google.com/search?gs_ssp=eJzj4tVP1zc0LC5MSbLINY83YLRSNagwTkpMNbQ0TDQ1TbE0NEwytTKoMDU0ME5LMTVPsTQytUhMMfNiK0rMLsvMAAAgchGg&q=rakvih&oq=rakvih&gs_lcrp=EgZjaHJvbWUqEggBEC4YJxivARjHARiABBiKBTIGCAAQRRg8MhIIARAuGCcYrwEYxwEYgAQYigUyDAgCECMYJxjwBRieBjIRCAMQABgKGAsYgwEYsQMYgAQyDggEEC4YChgLGLEDGIAEMgYIBRBFGDwyBggGEEUYPDIGCAcQRRg80gEIMzY5OWowajeoAgCwAgA&sourceid=chrome&ie=UTF-8",
};

export default function Footer() {
  const pathname = usePathname();

  const isPortal = pathname ? PORTAL_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/")) : false;
  if (isPortal) return null;

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "All Collections", href: "/collection-hub" },
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
  ];

  const genderLinks = [
    { name: "Men", href: "/collection-hub?gender=Men" },
    { name: "Women", href: "/collection-hub?gender=Women" },
    { name: "Unisex", href: "/collection-hub?gender=Unisex" },
  ];

  const categoryLinks = [
    { name: "Handbags", href: "/handbags" },
    { name: "Footwear", href: "/footwear" },
    { name: "Belts", href: "/belts" },
    { name: "Stoles", href: "/stoles" },
    { name: "The Original Hub", href: "/original-hub" },
  ];

  return (
    <footer className="luxury-site-footer">
      {/* Top Gold Accent Bar */}
      <div className="footer-gold-glow"></div>

      <div className="footer-container">
        {/* Main 4-Column Grid */}
        <div className="footer-main-grid">
          {/* Column 1: Brand Info & Socials */}
          <div className="footer-col brand-col">
            <Link href="/" className="footer-brand-logo" aria-label="RAKVIH Originals">
              <Image
                src="/rakvih-logo.png"
                alt="RAKVIH Originals"
                width={200}
                height={25}
                className="footer-brand-logo-img"
              />
            </Link>
            <p className="footer-manifesto">
              Crafting permanent luxury objects where Italian artisanal mastery converges with modern architectural design.
            </p>
            <div className="footer-contact-snippet">
              <a href="mailto:contact@rakvihoriginals.com" className="footer-email-link">
                contact@rakvihoriginals.com
              </a>
              <a href="tel:+918296392047" className="footer-phone-snippet" style={{ color: "rgba(255, 255, 255, 0.7)", textDecoration: "none" }}>
                +91 82963 92047
              </a>
            </div>

            {/* Social Media Links */}
            <div className="footer-social-row">
              {/* Instagram */}
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                title="Instagram @rakvih_solutions_pvt_ltd"
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                title="Facebook"
                aria-label="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>

              {/* Google */}
              <a
                href={SOCIAL_LINKS.google}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                title="Google Business Listing"
                aria-label="Google"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a9.96 9.96 0 0 0-7.07 2.93A10 10 0 0 0 2 12c0 5.52 4.48 10 10 10 4.97 0 9.17-3.64 9.88-8.4H12v-3.6h11.8c.13.63.2 1.29.2 2 0 6.63-5.37 12-12 12C5.37 24 0 18.63 0 12S5.37 0 12 0c3.27 0 6.27 1.25 8.54 3.32l-2.7 2.7C16.42 4.6 14.33 3.8 12 3.8z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">QUICK LINKS</h4>
            <ul className="footer-links-list quick-links-grid">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Gender */}
          <div className="footer-col">
            <h4 className="footer-col-title">GENDER</h4>
            <ul className="footer-links-list">
              {genderLinks.map((item, idx) => (
                <li key={idx}>
                  <Link href={item.href}>{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Categories */}
          <div className="footer-col">
            <h4 className="footer-col-title">CATEGORIES</h4>
            <ul className="footer-links-list">
              {categoryLinks.map((item, idx) => (
                <li key={idx}>
                  <Link href={item.href}>{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Corporate Office & Atelier Address */}
          <div className="footer-col address-col">
            <h4 className="footer-col-title">CORPORATE ATELIER</h4>
            <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.82rem", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p style={{ margin: 0 }}>
                Yelahanka, Bengaluru, Karnataka 560064
              </p>

              <div>
                <span style={{ fontSize: "0.7rem", color: "var(--color-gold)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", fontWeight: 700 }}>
                  Official Email
                </span>
                <a
                  href="https://rakvih.in/contact.html#"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#ffffff", textDecoration: "none" }}
                >
                  office@rakvih.in
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="copyright-text">
            © {new Date().getFullYear()} RAKVIH ORIGINALS. ALL RIGHTS RESERVED.
          </p>
          <div className="footer-legal-links">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms">Terms & Conditions</Link>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <span style={{ color: "rgba(255, 255, 255, 0.45)" }}>Powered by :- </span>
              <a
                href="https://rakvih.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-dev-link"
              >
                RAKVIH
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}