"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatINR } from "@/lib/fetchProducts";
import { supabaseImageUrl } from "@/lib/imageUrl";

export default function ProfilePage() {
  const router = useRouter();
  const { user, customer, isAuthenticated, isLoading, logout, wishlist, addToCart } = useAuth();

  const [activeTab, setActiveTab] = useState<"orders" | "details" | "wishlist">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);

  // Profile Edit State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (customer) {
      setEditName(customer.name || "");
      setEditPhone(customer.phone || "");
    }
  }, [customer]);

  // Fetch User's Orders from Supabase
  useEffect(() => {
    async function loadOrders() {
      if (!user) return;
      setIsOrdersLoading(true);

      try {
        const { data, error } = await supabase
          .from("Rakvih_orders")
          .select("*")
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .order("order_date", { ascending: false });

        if (!error && data) {
          setOrders(data);
        }
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setIsOrdersLoading(false);
      }
    }

    if (isAuthenticated) {
      loadOrders();
    }
  }, [user, isAuthenticated]);

  if (isLoading) {
    return (
      <main className="subpage-wrapper">
        <div className="subpage-container" style={{ padding: "6rem 0", textAlign: "center" }}>
          <h2 style={{ color: "var(--color-gold)", fontFamily: "var(--font-heading)" }}>
            Loading VIP Profile...
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
                VIP Authentication
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "#ffffff", marginBottom: "0.75rem" }}>
                Sign In To Access Your Profile & Orders
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.88rem", marginBottom: "2rem" }}>
                Track your active orders, inspect saved pieces, and update your delivery destinations.
              </p>
              <Link href="/login?redirect=/profile" className="hero-cta-pill" style={{ width: "100%", display: "block" }}>
                Sign In / Register
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Update Profile Details
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMsg(null);

    try {
      if (user) {
        await supabase
          .from("customers")
          .update({ name: editName, phone: editPhone })
          .eq("auth_user_id", user.id);

        setUpdateMsg("VIP profile details updated successfully!");
        setTimeout(() => setUpdateMsg(null), 3000);
      }
    } catch {
      setUpdateMsg("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const displayName = customer?.name || user?.email?.split("@")[0] || "VIP Member";

  return (
    <main className="subpage-wrapper">
      {/* Hero Header */}
      <section className="subpage-hero" style={{ padding: "3rem 0 2rem 0" }}>
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/">Home</Link> <span>/</span> <span className="active">My Account</span>
          </div>
          <div className="hero-accent-line">
            <div className="accent-bar"></div>
            <span className="accent-label">Maison Privé Member</span>
          </div>
          <h1 className="subpage-title" style={{ fontSize: "2.4rem" }}>
            WELCOME, <span className="hero-title-stroke">{displayName}</span>
          </h1>
          <p className="subpage-subtitle">
            Authenticated Member Account • {user?.email}
          </p>
        </div>
      </section>

      {/* Main Account Dashboard */}
      <section style={{ padding: "2rem 0 6rem 0" }}>
        <div className="subpage-container">
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "2.5rem", alignItems: "start" }}>
            {/* Left Sidebar Navigation */}
            <div className="auth-card-wrap" style={{ padding: "1.5rem" }}>
              <div style={{ paddingBottom: "1.25rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", fontWeight: 800, display: "block", marginBottom: "4px" }}>
                  Maison Privé Tier
                </span>
                <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "#ffffff" }}>
                  {displayName}
                </strong>
                <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)", display: "block" }}>
                  {user?.email}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    background: activeTab === "orders" ? "rgba(196, 161, 116, 0.15)" : "transparent",
                    color: activeTab === "orders" ? "var(--color-gold)" : "rgba(255, 255, 255, 0.7)",
                    border: activeTab === "orders" ? "1px solid rgba(196, 161, 116, 0.35)" : "none",
                    fontFamily: "var(--font-heading)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>My Orders</span>
                  <span style={{ background: "rgba(255, 255, 255, 0.08)", padding: "2px 8px", borderRadius: "999px", fontSize: "0.7rem" }}>
                    {orders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("wishlist")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    background: activeTab === "wishlist" ? "rgba(196, 161, 116, 0.15)" : "transparent",
                    color: activeTab === "wishlist" ? "var(--color-gold)" : "rgba(255, 255, 255, 0.7)",
                    border: activeTab === "wishlist" ? "1px solid rgba(196, 161, 116, 0.35)" : "none",
                    fontFamily: "var(--font-heading)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>Saved Wishlist</span>
                  <span style={{ background: "rgba(255, 255, 255, 0.08)", padding: "2px 8px", borderRadius: "999px", fontSize: "0.7rem" }}>
                    {wishlist.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    background: activeTab === "details" ? "rgba(196, 161, 116, 0.15)" : "transparent",
                    color: activeTab === "details" ? "var(--color-gold)" : "rgba(255, 255, 255, 0.7)",
                    border: activeTab === "details" ? "1px solid rgba(196, 161, 116, 0.35)" : "none",
                    fontFamily: "var(--font-heading)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>Profile & Security</span>
                  <span>⚙</span>
                </button>

                <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "10px",
                      background: "rgba(231, 76, 60, 0.1)",
                      border: "1px solid rgba(231, 76, 60, 0.25)",
                      color: "#e74c3c",
                      fontFamily: "var(--font-heading)",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Right Main Panel */}
            <div>
              {/* TAB 1: MY ORDERS */}
              {activeTab === "orders" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "1rem" }}>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "#ffffff", margin: 0 }}>
                      Acquisition History
                    </h2>
                    <span style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.5)" }}>
                      {orders.length} {orders.length === 1 ? "Order" : "Orders"} placed
                    </span>
                  </div>

                  {isOrdersLoading ? (
                    <div style={{ padding: "4rem 0", textAlign: "center", color: "var(--color-gold)" }}>
                      Loading orders...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="auth-card-wrap" style={{ textAlign: "center", padding: "4rem 2rem" }}>
                      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#ffffff", marginBottom: "0.5rem" }}>
                        No Orders Recorded Yet
                      </h3>
                      <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.88rem", marginBottom: "2rem" }}>
                        You haven&apos;t placed any luxury acquisitions with this account yet.
                      </p>
                      <Link href="/collection-hub" className="hero-cta-pill">
                        Explore All Collections
                      </Link>
                    </div>
                  ) : (
                    orders.map((ord) => {
                      return (
                        <div key={ord.id} className="auth-card-wrap" style={{ padding: "1.75rem" }}>
                          {/* Order Header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
                            <div>
                              <span style={{ fontSize: "0.68rem", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block" }}>
                                Order Reference
                              </span>
                              <strong style={{ fontFamily: "var(--font-heading)", color: "var(--color-gold)", fontSize: "1rem" }}>
                                {ord.id}
                              </strong>
                              <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)", display: "block", marginTop: "2px" }}>
                                {ord.order_date ? new Date(ord.order_date).toLocaleDateString("en-IN", { dateStyle: "long" }) : "Recently placed"}
                              </span>
                            </div>

                            <div style={{ textAlign: "right" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "4px 12px",
                                  borderRadius: "999px",
                                  fontSize: "0.72rem",
                                  fontFamily: "var(--font-heading)",
                                  fontWeight: 800,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  background: ord.status === "delivered" ? "rgba(46, 204, 113, 0.15)" : "rgba(196, 161, 116, 0.15)",
                                  border: ord.status === "delivered" ? "1px solid rgba(46, 204, 113, 0.35)" : "1px solid rgba(196, 161, 116, 0.35)",
                                  color: ord.status === "delivered" ? "#2ecc71" : "var(--color-gold)",
                                }}
                              >
                                ● {ord.status || "Confirmed"}
                              </span>
                              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.2rem", color: "#ffffff", marginTop: "6px" }}>
                                {formatINR(ord.grand_total)}
                              </div>
                            </div>
                          </div>

                          {/* Order Items */}
                          {ord.cart_items && Array.isArray(ord.cart_items) && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.25rem" }}>
                              {ord.cart_items.map((it: any, itemIdx: number) => (
                                <div key={itemIdx} style={{ display: "grid", gridTemplateColumns: "45px 1fr auto", gap: "12px", alignItems: "center" }}>
                                  <img
                                    src={it.image ? supabaseImageUrl(it.image, 120) : "/handbag.webp"}
                                    alt={it.name}
                                    style={{ width: "45px", height: "45px", objectFit: "contain", borderRadius: "8px", background: "rgba(255, 255, 255, 0.05)" }}
                                  />
                                  <div>
                                    <span style={{ fontSize: "0.85rem", color: "#ffffff", fontWeight: 600, display: "block" }}>
                                      {it.name}
                                    </span>
                                    {it.variationName && (
                                      <span style={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.5)" }}>
                                        Size: {it.variationName} | Qty: {it.quantity}
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.85rem", color: "var(--color-gold)" }}>
                                    {formatINR(it.price * it.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Delivery Address Snippet */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "1rem" }}>
                            <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>
                              <span>Delivered to: </span>
                              <strong style={{ color: "#ffffff" }}>{ord.house_number}, {ord.street}, {ord.city}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: PROFILE DETAILS */}
              {activeTab === "details" && (
                <div className="auth-card-wrap">
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "#ffffff", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "1rem" }}>
                    VIP Profile Details
                  </h2>

                  {updateMsg && (
                    <div style={{ background: "rgba(46, 204, 113, 0.15)", border: "1px solid rgba(46, 204, 113, 0.4)", color: "#2ecc71", padding: "0.85rem 1.25rem", borderRadius: "12px", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
                      {updateMsg}
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.4rem", fontWeight: 700 }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="filter-input-glass"
                        style={{ width: "100%", borderRadius: "10px", padding: "0.8rem 1rem" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.5)", marginBottom: "0.4rem", fontWeight: 700 }}>
                        Email Address (Permanent VIP Identifier)
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ""}
                        className="filter-input-glass"
                        style={{ width: "100%", borderRadius: "10px", padding: "0.8rem 1rem", opacity: 0.6, cursor: "not-allowed" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.4rem", fontWeight: 700 }}>
                        Primary Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+91 98200 00000"
                        className="filter-input-glass"
                        style={{ width: "100%", borderRadius: "10px", padding: "0.8rem 1rem" }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="hero-cta-pill"
                      style={{ marginTop: "1rem", alignSelf: "flex-start", padding: "0.85rem 2rem", cursor: isUpdating ? "not-allowed" : "pointer" }}
                    >
                      {isUpdating ? "Updating..." : "Save Profile Details"}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: WISHLIST PREVIEW */}
              {activeTab === "wishlist" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "#ffffff", margin: 0 }}>
                      Saved In Private Vault
                    </h2>
                    <Link
                      href="/wishlist"
                      style={{ color: "var(--color-gold)", fontFamily: "var(--font-heading)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, textDecoration: "none" }}
                    >
                      Full Wishlist View →
                    </Link>
                  </div>

                  {wishlist.length === 0 ? (
                    <div className="auth-card-wrap" style={{ textAlign: "center", padding: "4rem 2rem" }}>
                      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#ffffff", marginBottom: "0.5rem" }}>
                        Your Wishlist Is Empty
                      </h3>
                      <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
                        Bookmark your favorite pieces while browsing our collections.
                      </p>
                      <Link href="/collection-hub" className="hero-cta-pill">
                        Discover Masterpieces
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
                      {wishlist.map((item) => (
                        <div key={item.id} className="auth-card-wrap" style={{ padding: "1.25rem", textAlign: "center" }}>
                          <Link href={`/product/${item.id}`} style={{ textDecoration: "none" }}>
                            <img
                              src={supabaseImageUrl(item.img, 400)}
                              alt={item.name}
                              style={{ width: "100%", height: "140px", objectFit: "contain", marginBottom: "0.75rem" }}
                            />
                            <span style={{ fontSize: "0.65rem", color: "var(--color-gold)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                              {item.brandName}
                            </span>
                            <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "#ffffff", margin: "0.2rem 0 0.5rem 0", fontWeight: 500 }}>
                              {item.name}
                            </h4>
                            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "#ffffff", fontSize: "0.9rem", marginBottom: "1rem" }}>
                              {item.price}
                            </div>
                          </Link>

                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            className="hero-cta-pill"
                            style={{ width: "100%", padding: "0.6rem", fontSize: "0.72rem" }}
                          >
                            Add To Bag
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
