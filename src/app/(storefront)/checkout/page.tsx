"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/fetchProducts";
import { supabaseImageUrl } from "@/lib/imageUrl";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi NCR", "Chandigarh"
];
const UPI_ID = "8553902047@ybl";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, clearCart, user, customer, isAuthenticated, isLoading } = useAuth();

  // Form State
  const [fullName, setFullName] = useState(customer?.name || "");
  const [email, setEmail] = useState(user?.email || customer?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(customer?.phone || "");
  const [altPhoneNumber, setAltPhoneNumber] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Bangalore");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("");

  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState("");
  const [upiCopied, setUpiCopied] = useState(false);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentProof) {
      setPaymentProofPreview("");
      return;
    }
    const previewUrl = URL.createObjectURL(paymentProof);
    setPaymentProofPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [paymentProof]);

  if (isLoading) {
    return (
      <main className="subpage-wrapper">
        <div className="subpage-container" style={{ padding: "6rem 0", textAlign: "center" }}>
          <h2 style={{ color: "var(--color-gold)", fontFamily: "var(--font-heading)" }}>
            Preparing VIP Checkout...
          </h2>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="subpage-wrapper">
        <section style={{ padding: "4rem 0" }}>
          <div className="subpage-container" style={{ textAlign: "center", maxWidth: "550px", margin: "0 auto" }}>
            <div className="auth-card-wrap">
              <span className="brand-gold-badge" style={{ marginBottom: "1rem" }}>
                Authentication Required
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "#ffffff", marginBottom: "0.75rem" }}>
                Sign In To Proceed To Checkout
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.88rem", marginBottom: "2rem" }}>
                Sign in or register your VIP profile to unlock insured express delivery and concierge order processing.
              </p>
              <Link href="/login?redirect=/checkout" className="hero-cta-pill" style={{ width: "100%", display: "block" }}>
                Sign In / Register
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="subpage-wrapper">
        <section style={{ padding: "4rem 0" }}>
          <div className="subpage-container" style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
            <div className="auth-card-wrap">
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "#ffffff", marginBottom: "0.5rem" }}>
                Your Shopping Bag Is Empty
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "2rem", fontSize: "0.9rem" }}>
                Please add items to your shopping bag before proceeding to checkout.
              </p>
              <Link href="/collection-hub" className="hero-cta-pill">
                Explore All Collections
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

// Submit Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !houseNumber.trim() || !street.trim() || !city.trim() || !pincode.trim()) {
      setSubmitError("Please fill in all mandatory delivery address fields.");
      return;
    }
    if (!paymentProof) {
      setSubmitError("Upload your UPI payment screenshot so our team can verify the transfer.");
      return;
    }

    setIsSubmitting(true);

    try {
      const cartItemsPayload = cart.map((item) => ({
        quantity: item.quantity,
        productId: item.product.id,
        variationId: item.variant?.id || null,
        variationName: item.variant?.sizeName || "",
      }));

      const formData = new FormData();
      formData.set("userId", user?.id || "");
      formData.set("fullName", fullName.trim());
      formData.set("email", email.trim() || user?.email || "");
      formData.set("phoneNumber", phoneNumber.trim());
      formData.set("altPhoneNumber", altPhoneNumber.trim());
      formData.set("houseNumber", houseNumber.trim());
      formData.set("street", street.trim());
      formData.set("city", city.trim());
      formData.set("state", state.trim());
      formData.set("pincode", pincode.trim());
      formData.set("items", JSON.stringify(cartItemsPayload));
      formData.set("paymentProof", paymentProof);

      const response = await fetch("/api/checkout/create-order", { method: "POST", body: formData });
      const orderResult = await response.json();
      if (!response.ok) throw new Error(orderResult.error || "Unable to place the order.");
      clearCart();
      router.push(`/order-success?orderId=${orderResult.orderId}`);
    } catch (err: unknown) {
      console.error("Order placement exception:", err);
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred while placing the order.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="subpage-wrapper">
      {/* Hero Header */}
      <section className="subpage-hero" style={{ padding: "3rem 0 2rem 0" }}>
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/">Home</Link> <span>/</span> <Link href="/cart">Bag</Link> <span>/</span>{" "}
            <span className="active">VIP Checkout</span>
          </div>
          <div className="hero-accent-line">
            <div className="accent-bar"></div>
            <span className="accent-label">Private Order Vault</span>
          </div>
          <h1 className="subpage-title checkout-title">
            EXPRESS <span className="hero-title-stroke">CHECKOUT</span>
          </h1>
        </div>
      </section>

      {/* Main Checkout Section */}
      <section style={{ padding: "2rem 0 6rem 0" }}>
        <div className="subpage-container">
          <form onSubmit={handlePlaceOrder} className="checkout-layout">
            {/* Left Column: Delivery Details & Payment */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", minWidth: 0 }}>
              {/* Error Notification */}
              {submitError && (
                <div style={{ background: "rgba(231, 76, 60, 0.15)", border: "1px solid rgba(231, 76, 60, 0.4)", color: "#e74c3c", padding: "1rem 1.25rem", borderRadius: "12px", fontSize: "0.85rem" }}>
                  {submitError}
                </div>
              )}

              {/* Step 1: Shipping Address */}
              <div className="auth-card-wrap">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "0.75rem" }}>
                  <span className="brand-gold-badge">01</span>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#ffffff", margin: 0 }}>
                    VIP Delivery Address
                  </h3>
                </div>

                <div className="checkout-fields-grid">
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.4rem", fontWeight: 700 }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      placeholder="e.g. Purvi Sharma"
                      className="filter-input-glass"
                      style={{ width: "100%", borderRadius: "10px", padding: "0.8rem 1rem" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.4rem", fontWeight: 700 }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="name@example.com"
                      className="filter-input-glass"
                      style={{ width: "100%", borderRadius: "10px", padding: "0.8rem 1rem" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.4rem", fontWeight: 700 }}>
                      Primary Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      autoComplete="tel"
                      placeholder="+91 98200 00000"
                      className="filter-input-glass"
                      style={{ width: "100%", borderRadius: "10px", padding: "0.8rem 1rem" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.6)", marginBottom: "0.4rem", fontWeight: 700 }}>
                      Alternate Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={altPhoneNumber}
                      onChange={(e) => setAltPhoneNumber(e.target.value)}
                      autoComplete="tel"
                      placeholder="+91 80000 00000"
                      className="filter-input-glass"
                      style={{ width: "100%", borderRadius: "10px", padding: "0.8rem 1rem" }}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.4rem", fontWeight: 700 }}>
                      House / Flat / Villa / Building Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      autoComplete="address-line1"
                      placeholder="e.g. Penthouse 4B, Signature Horizon"
                      className="filter-input-glass"
                      style={{ width: "100%", borderRadius: "10px", padding: "0.8rem 1rem" }}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.4rem", fontWeight: 700 }}>
                      Street Address & Landmark *
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      autoComplete="address-line2"
                      placeholder="e.g. 100ft Road, Near Luxury Boulevard, Indiranagar"
                      className="filter-input-glass"
                      style={{ width: "100%", borderRadius: "10px", padding: "0.8rem 1rem" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.4rem", fontWeight: 700 }}>
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      autoComplete="address-level2"
                      placeholder="e.g. Bangalore"
                      className="filter-input-glass"
                      style={{ width: "100%", borderRadius: "10px", padding: "0.8rem 1rem" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.4rem", fontWeight: 700 }}>
                      State *
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="filter-select-glass"
                      style={{ width: "100%", borderRadius: "10px", padding: "0.8rem 1rem" }}
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.4rem", fontWeight: 700 }}>
                      Pincode / Postal Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      autoComplete="postal-code"
                      inputMode="numeric"
                      placeholder="e.g. 560038"
                      className="filter-input-glass"
                      style={{ width: "100%", borderRadius: "10px", padding: "0.8rem 1rem" }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: UPI Payment and Proof */}
              <div className="auth-card-wrap">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "0.75rem" }}>
                  <span className="brand-gold-badge">02</span>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#ffffff", margin: 0 }}>
                    Pay by UPI
                  </h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))", gap: "1.25rem", alignItems: "stretch", minWidth: 0 }}>
                  <div style={{ minWidth: 0, border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "1.25rem", textAlign: "center", background: "rgba(255,255,255,0.025)" }}>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem", margin: "0 0 0.9rem" }}>
                      Scan this PhonePe QR to pay <strong style={{ color: "var(--color-gold)" }}>{formatINR(cartSubtotal)}</strong>
                    </p>
                    <img
                      src="/upi-payment-qr.png"
                      alt="PhonePe UPI payment QR code"
                      style={{ display: "block", width: "min(100%, 250px)", maxWidth: "100%", aspectRatio: "1 / 1", objectFit: "contain", background: "#ffffff", borderRadius: "10px", padding: "8px", margin: "0 auto" }}
                    />
                    <div style={{ marginTop: "0.9rem", color: "#ffffff", fontWeight: 700, letterSpacing: "0.03em" }}>
                      UPI ID: <span style={{ color: "var(--color-gold)" }}>{UPI_ID}</span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(UPI_ID);
                          setUpiCopied(true);
                          window.setTimeout(() => setUpiCopied(false), 1800);
                        } catch {
                          setSubmitError("Copy is unavailable here. Please enter the UPI ID manually.");
                        }
                      }}
                      style={{ marginTop: "0.7rem", padding: "0.45rem 0.8rem", borderRadius: "8px", border: "1px solid rgba(196,161,116,0.4)", background: "rgba(196,161,116,0.1)", color: "var(--color-gold)", cursor: "pointer", fontWeight: 700 }}
                    >
                      {upiCopied ? "UPI ID Copied" : "Copy UPI ID"}
                    </button>
                  </div>

                  <div style={{ minWidth: 0, border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "1.25rem", background: "rgba(255,255,255,0.025)" }}>
                    <h4 style={{ color: "#ffffff", margin: "0 0 0.5rem", fontFamily: "var(--font-heading)" }}>Upload payment screenshot</h4>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", lineHeight: 1.5, margin: "0 0 1rem" }}>
                      After paying, upload the success screen or receipt. Your order will stay pending until an admin verifies it.
                    </p>
                    <label style={{ minHeight: "150px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.7rem", border: "1px dashed rgba(196,161,116,0.55)", borderRadius: "12px", padding: "1rem", cursor: "pointer", textAlign: "center", background: "rgba(196,161,116,0.04)" }}>
                      {paymentProofPreview ? (
                        <img src={paymentProofPreview} alt="Payment proof preview" style={{ maxWidth: "100%", maxHeight: "190px", borderRadius: "8px", objectFit: "contain" }} />
                      ) : (
                        <>
                          <span style={{ color: "var(--color-gold)", fontSize: "1.8rem" }}>＋</span>
                          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.85rem" }}>Choose screenshot or photo</span>
                          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem" }}>JPG, PNG, or WebP · up to 5 MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          if (file && file.size > 5 * 1024 * 1024) {
                            setSubmitError("Payment screenshot must be 5 MB or smaller.");
                            setPaymentProof(null);
                            event.target.value = "";
                            return;
                          }
                          setSubmitError(null);
                          setPaymentProof(file);
                        }}
                        style={{ display: "none" }}
                      />
                    </label>
                    {paymentProof && <p style={{ color: "#b8d9b8", fontSize: "0.75rem", margin: "0.65rem 0 0" }}>Ready to upload: {paymentProof.name}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Placement */}
            <div className="checkout-summary-col">
              {/* Order Items Card */}
              <div className="auth-card-wrap">
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#ffffff", marginBottom: "1rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "0.75rem" }}>
                  Bag Summary ({cart.length} items)
                </h3>

                <div className="checkout-summary-items">
                  {cart.map((item, idx) => {
                    const price = item.variant?.salePrice || item.variant?.price || item.product.priceValue || 0;
                    return (
                      <div key={idx} style={{ display: "grid", gridTemplateColumns: "50px 1fr auto", gap: "12px", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.04)", paddingBottom: "0.75rem" }}>
                        <img
                          src={supabaseImageUrl(item.product.img, 120)}
                          alt={item.product.name}
                          style={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: "8px", background: "rgba(255, 255, 255, 0.05)" }}
                        />
                        <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                          <span style={{ fontSize: "0.62rem", color: "var(--color-gold)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                            {item.product.brandName}
                          </span>
                          <span style={{ fontSize: "0.82rem", color: "#ffffff", fontWeight: 600, display: "block", lineHeight: 1.3 }}>
                            {item.product.name}
                          </span>
                          {item.variant && (
                            <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.5)" }}>
                              Size: {item.variant.sizeName} (x{item.quantity})
                            </span>
                          )}
                        </div>
                        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.9rem", color: "#ffffff", whiteSpace: "nowrap" }}>
                          {formatINR(price * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Pricing Line Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255, 255, 255, 0.7)", fontSize: "0.85rem" }}>
                    <span>Subtotal</span>
                    <span style={{ color: "#ffffff", fontWeight: 700 }}>{formatINR(cartSubtotal)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", color: "rgba(255, 255, 255, 0.7)", fontSize: "0.85rem" }}>
                    <span>Presentation Box & Courier Transit</span>
                    <span style={{ color: "var(--color-gold)", fontWeight: 700 }}>Complimentary</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", paddingTop: "0.85rem", borderTop: "1px solid rgba(255, 255, 255, 0.15)", fontSize: "clamp(1.05rem, 3.5vw, 1.25rem)", color: "#ffffff", fontWeight: 800 }}>
                    <span>Grand Total</span>
                    <span style={{ fontFamily: "var(--font-heading)", color: "var(--color-gold)" }}>
                      {formatINR(cartSubtotal)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="hero-cta-pill"
                  style={{
                    width: "100%",
                    marginTop: "1.75rem",
                    padding: "1.1rem",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    boxShadow: "0 10px 30px rgba(196, 161, 116, 0.35)",
                  }}
                >
                  {isSubmitting
                    ? "Submitting Payment Proof..."
                    : `Submit Order for Verification (${formatINR(cartSubtotal)})`}
                </button>
              </div>

              {/* Guarantees Box */}
              <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "14px", padding: "1.25rem", fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.55)", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div>🛡️ <strong>100% Authenticity Verified:</strong> Each masterpiece arrives with an embossed Maison certificate.</div>
                <div>📦 <strong>Insured Express Delivery:</strong> Real-time GPS tracking dispatched directly to your doorstep.</div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
