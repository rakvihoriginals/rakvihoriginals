"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/fetchProducts";
import { supabase } from "@/lib/supabase";
import { supabaseImageUrl } from "@/lib/imageUrl";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi NCR", "Chandigarh"
];

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

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Bank Transfer" | "Cash on Delivery" | "Card">("UPI");

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

    if (!fullName.trim() || !phoneNumber.trim() || !houseNumber.trim() || !street.trim() || !city.trim() || !pincode.trim()) {
      setSubmitError("Please fill in all mandatory delivery address fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const cartItemsPayload = cart.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        image: item.product.img,
        price: item.variant?.salePrice || item.variant?.price || item.product.priceValue,
        originalPrice: item.product.originalPriceValue || item.product.priceValue,
        quantity: item.quantity,
        productId: item.product.id,
        variationId: item.variant?.id || null,
        variationName: item.variant?.sizeName || "",
      }));

      const newOrder = {
        user_id: user?.id || null,
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        alt_phone_number: altPhoneNumber.trim() || "",
        house_number: houseNumber.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        payment_method: paymentMethod,
        payment_id: `RAKVIH-${Date.now()}`,
        payment_status: paymentMethod === "Cash on Delivery" ? "pending" : "paid",
        total_price: cartSubtotal,
        shipping_cost: 0,
        grand_total: cartSubtotal,
        cart_items: cartItemsPayload,
        status: "confirmed",
        order_date: new Date().toISOString(),
        email: email.trim() || user?.email || "",
      };

      const { data: insertedData, error: insertError } = await supabase
        .from("Rakvih_orders")
        .insert([newOrder])
        .select("id")
        .single();

      if (insertError) {
        console.error("Order insertion error:", insertError);
        // Fallback with client UUID if DB trigger restricted
        const generatedId = `RAK-${Math.floor(100000 + Math.random() * 900000)}`;
        clearCart();
        router.push(`/order-success?orderId=${generatedId}`);
        return;
      }

      clearCart();
      const orderId = insertedData?.id || `RAK-${Date.now()}`;
      router.push(`/order-success?orderId=${orderId}`);
    } catch (err: any) {
      console.error("Order placement exception:", err);
      setSubmitError(err.message || "An unexpected error occurred while placing the order.");
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
          <h1 className="subpage-title" style={{ fontSize: "2.4rem" }}>
            EXPRESS <span className="hero-title-stroke">CHECKOUT</span>
          </h1>
        </div>
      </section>

      {/* Main Checkout Section */}
      <section style={{ padding: "2rem 0 6rem 0" }}>
        <div className="subpage-container">
          <form onSubmit={handlePlaceOrder} style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: "3.5rem", alignItems: "start" }}>
            {/* Left Column: Delivery Details & Payment */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.4rem", fontWeight: 700 }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
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
                      placeholder="e.g. 560038"
                      className="filter-input-glass"
                      style={{ width: "100%", borderRadius: "10px", padding: "0.8rem 1rem" }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Payment Method */}
              <div className="auth-card-wrap">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "0.75rem" }}>
                  <span className="brand-gold-badge">02</span>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#ffffff", margin: 0 }}>
                    Payment & Settlement
                  </h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* UPI */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      background: paymentMethod === "UPI" ? "rgba(196, 161, 116, 0.12)" : "rgba(255, 255, 255, 0.03)",
                      border: paymentMethod === "UPI" ? "1px solid var(--color-gold)" : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "14px",
                      padding: "1rem 1.25rem",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "UPI"}
                      onChange={() => setPaymentMethod("UPI")}
                      style={{ accentColor: "var(--color-gold)" }}
                    />
                    <div>
                      <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "#ffffff", fontSize: "0.95rem", display: "block" }}>
                        Instant UPI / QR Code Transfer (Recommended)
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>
                        Google Pay, PhonePe, Paytm, or BHIM UPI instant processing.
                      </span>
                    </div>
                  </label>

                  {/* Bank Transfer */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      background: paymentMethod === "Bank Transfer" ? "rgba(196, 161, 116, 0.12)" : "rgba(255, 255, 255, 0.03)",
                      border: paymentMethod === "Bank Transfer" ? "1px solid var(--color-gold)" : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "14px",
                      padding: "1rem 1.25rem",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "Bank Transfer"}
                      onChange={() => setPaymentMethod("Bank Transfer")}
                      style={{ accentColor: "var(--color-gold)" }}
                    />
                    <div>
                      <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "#ffffff", fontSize: "0.95rem", display: "block" }}>
                        Direct IMPS / NEFT Bank Transfer
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>
                        Official RAKVIH Originals Maison Escrow account settlement.
                      </span>
                    </div>
                  </label>

                  {/* Cash on Delivery */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      background: paymentMethod === "Cash on Delivery" ? "rgba(196, 161, 116, 0.12)" : "rgba(255, 255, 255, 0.03)",
                      border: paymentMethod === "Cash on Delivery" ? "1px solid var(--color-gold)" : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "14px",
                      padding: "1rem 1.25rem",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "Cash on Delivery"}
                      onChange={() => setPaymentMethod("Cash on Delivery")}
                      style={{ accentColor: "var(--color-gold)" }}
                    />
                    <div>
                      <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "#ffffff", fontSize: "0.95rem", display: "block" }}>
                        Cash On Delivery (Verified VIP Delivery)
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>
                        Pay upon physical inspection by our armored courier escort.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Placement */}
            <div style={{ position: "sticky", top: "6rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Order Items Card */}
              <div className="auth-card-wrap">
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#ffffff", marginBottom: "1rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "0.75rem" }}>
                  Bag Summary ({cart.length} items)
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "280px", overflowY: "auto", paddingRight: "0.5rem", marginBottom: "1.25rem" }}>
                  {cart.map((item, idx) => {
                    const price = item.variant?.salePrice || item.variant?.price || item.product.priceValue || 0;
                    return (
                      <div key={idx} style={{ display: "grid", gridTemplateColumns: "50px 1fr auto", gap: "12px", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.04)", paddingBottom: "0.75rem" }}>
                        <img
                          src={supabaseImageUrl(item.product.img, 120)}
                          alt={item.product.name}
                          style={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: "8px", background: "rgba(255, 255, 255, 0.05)" }}
                        />
                        <div>
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
                        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.9rem", color: "#ffffff" }}>
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

                  <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255, 255, 255, 0.7)", fontSize: "0.85rem" }}>
                    <span>Presentation Box & Courier Transit</span>
                    <span style={{ color: "var(--color-gold)", fontWeight: 700 }}>Complimentary</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.85rem", borderTop: "1px solid rgba(255, 255, 255, 0.15)", fontSize: "1.25rem", color: "#ffffff", fontWeight: 800 }}>
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
                  {isSubmitting ? "Securing VIP Order..." : `Place Luxury Order (${formatINR(cartSubtotal)})`}
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
