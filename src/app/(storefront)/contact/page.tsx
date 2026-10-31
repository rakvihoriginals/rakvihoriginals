"use client";

import React, { useState } from "react";
import Link from "next/link";

const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/rakvih_solutions_pvt_ltd?igsh=N2xybTAzYW10bHRm",
  facebook: "https://www.facebook.com/share/15UG4Sd23e/",
  google: "https://www.google.com/search?gs_ssp=eJzj4tVP1zc0LC5MSbLINY83YLRSNagwTkpMNbQ0TDQ1TbE0NEwytTKoMDU0ME5LMTVPsTQytUhMMfNiK0rMLsvMAAAgchGg&q=rakvih&oq=rakvih&gs_lcrp=EgZjaHJvbWUqEggBEC4YJxivARjHARiABBiKBTIGCAAQRRg8MhIIARAuGCcYrwEYxwEYgAQYigUyDAgCECMYJxjwBRieBjIRCAMQABgKGAsYgwEYsQMYgAQyDggEEC4YChgLGLEDGIAEMgYIBRBFGDwyBggGEEUYPDIGCAcQRRg80gEIMzY5OWowajeoAgCwAgA&sourceid=chrome&ie=UTF-8",
};

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "Private Salon Appointment",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const contactChannels = [
    {
      title: "Corporate Headquarters",
      detail: "office@rakvih.in",
      link: "https://rakvih.in/contact.html#",
      desc: "Official inquiries, atelier visits & appointments.",
    },
    {
      title: "Direct Client Helpline",
      detail: "+91 82963 92047",
      link: "tel:+918296392047",
      desc: "Dedicated personal styling & assistance line.",
    },
  ];

  const locations = [
    {
      city: "BENGALURU HEADQUARTERS",
      address: "Yelahanka, Bengaluru, Karnataka 560064",
      phone: "+91 82963 92047",
      hours: "Mon – Sat: 09:30 – 19:00 IST",
    },
    {
      city: "PARIS SHOWROOM",
      address: "18 Place Vendôme, 75001 Paris, France",
      phone: "+33 1 42 68 00 18",
      hours: "Mon – Sat: 10:00 – 19:00 CET",
    },
    {
      city: "MILAN ATELIER",
      address: "Via Montenapoleone 8, 20121 Milano, Italy",
      phone: "+39 02 7600 1818",
      hours: "Mon – Sat: 10:30 – 19:30 CET",
    },
  ];

  const faqs = [
    {
      q: "How can I schedule a private viewing appointment?",
      a: "You may complete the inquiry form below or contact our direct client helpline. An advisor will confirm your private salon slot within 2 hours.",
    },
    {
      q: "Do you offer bespoke leather monogramming and custom sizing?",
      a: "Yes. All RAKVIH handbags, footwear, and belts can be personalized with hand-painted initials, custom hardware engraving, or bespoke sizing created in our Italian ateliers.",
    },
    {
      q: "What are your international shipping and white-glove delivery terms?",
      a: "We provide fully insured worldwide courier delivery via secure armored transit, accompanied by a numbered certificate of authenticity and archival packaging.",
    },
  ];

  return (
    <main className="subpage-wrapper">
      {/* Hero */}
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/">Home</Link> <span>/</span> <span className="active">Contact Us</span>
          </div>
          <div className="hero-accent-line">
            <div className="accent-bar"></div>
            <span className="accent-label">Client Services & Salons</span>
          </div>
          <h1 className="subpage-title">
            CONTACT <span className="hero-title-stroke">US</span>
          </h1>
          <p className="subpage-subtitle">
            Our dedicated client advisors are at your service for private showroom appointments, bespoke commissions, and order assistance.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="subpage-content-section">
        <div className="subpage-container">
          {/* Quick Channels Cards */}
          <div className="contact-channels-grid">
            {contactChannels.map((ch, idx) => (
              <a key={idx} href={ch.link} target={ch.link.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="contact-channel-card">
                <span className="accent-label">Direct Channel</span>
                <h3>{ch.title}</h3>
                <p className="channel-detail">{ch.detail}</p>
                <span className="channel-desc">{ch.desc}</span>
              </a>
            ))}
          </div>

          {/* Form & Locations Grid */}
          <div className="contact-main-grid" style={{ marginTop: "3rem" }}>
            {/* Contact Form */}
            <div className="contact-form-card">
              <span className="accent-label">Get in Touch</span>
              <h2>Send An Inquiry</h2>

              {submitted ? (
                <div className="contact-success-box">
                  <div className="success-icon">✓</div>
                  <h3>Inquiry Received</h3>
                  <p>
                    Thank you for reaching out to RAKVIH Originals. A dedicated client advisor will review your message and respond within 2 hours.
                  </p>
                  <button
                    type="button"
                    className="hero-cta-pill"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ firstName: "", lastName: "", email: "", phone: "", subject: "Private Salon Appointment", message: "" });
                    }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form className="luxury-contact-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Eleanor"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Vance"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. eleanor@vance.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        placeholder="+91 98200 00000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Inquiry Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    >
                      <option value="Private Salon Appointment">Private Salon Appointment</option>
                      <option value="Bespoke Atelier Commission">Bespoke Monogramming / Atelier Commission</option>
                      <option value="Product Availability & Sizing">Product Availability & Sizing Consultation</option>
                      <option value="Customer Care & Delivery">Customer Care & Worldwide Insured Delivery</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Message</label>
                    <textarea
                      rows={4}
                      placeholder="Please detail your request, preferred dates, or specific collection inquiries..."
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    ></textarea>
                  </div>

                  <button type="submit" className="hero-cta-pill" style={{ width: "100%", textAlign: "center" }}>
                    Submit Message
                  </button>
                </form>
              )}
            </div>

            {/* Global Salons Directory & Social Links */}
            <div className="contact-info-card">
              <span className="accent-label">Official Atelier & Salons</span>
              <h2>Locations & Hours</h2>

              <div className="salon-locations-list">
                {locations.map((loc) => (
                  <div key={loc.city} className="salon-location-item">
                    <h4>{loc.city}</h4>
                    <p>{loc.address}</p>
                    <span className="salon-phone">{loc.phone}</span>
                    <span className="salon-hours">{loc.hours}</span>
                  </div>
                ))}
              </div>

              {/* Social Channels in Contact */}
              <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", fontWeight: 700, display: "block", marginBottom: "0.75rem" }}>
                  Connect on Official Channels
                </span>
                <div className="footer-social-row" style={{ marginTop: 0 }}>
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

              <div className="direct-concierge-pill" style={{ marginTop: "1.5rem" }}>
                <p>Direct Advisory Desk</p>
                <a href="mailto:office@rakvih.in">office@rakvih.in</a>
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="contact-faqs-section" style={{ marginTop: "3rem" }}>
            <div className="about-pillars-header">
              <span className="accent-label">Assistance</span>
              <h2>Frequently Asked Questions</h2>
            </div>
            <div className="faqs-grid">
              {faqs.map((faq, idx) => (
                <div key={idx} className="faq-card">
                  <h4>{faq.q}</h4>
                  <p>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
