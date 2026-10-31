"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatINR } from "@/lib/fetchProducts";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("Rakvih_orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (data) {
          setOrder(data);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div className="auth-card-wrap" style={{ textAlign: "center", padding: "3.5rem 2.5rem" }}>
        {/* Top Celebration Icon */}
        <div
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(196, 161, 116, 0.2) 0%, rgba(168, 139, 74, 0.3) 100%)",
            border: "1px solid var(--color-gold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            color: "var(--color-gold)",
            fontSize: "2rem",
            boxShadow: "0 0 30px rgba(196, 161, 116, 0.3)",
          }}
        >
          ✓
        </div>

        <span className="brand-gold-badge" style={{ marginBottom: "1rem" }}>
          Order Confirmed & Secured
        </span>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", color: "#ffffff", marginBottom: "0.5rem" }}>
          Thank You For Your Acquisition
        </h1>

        <p style={{ color: "rgba(255, 255, 255, 0.65)", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "2rem" }}>
          Your bespoke luxury order has been registered in the Maison ledger. Our atelier artisans are preparing your complimentary signature presentation box.
        </p>

        {/* Order Details Card */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "1.25rem", padding: "1.5rem", textAlign: "left", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "0.85rem", marginBottom: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block" }}>
                Order Reference
              </span>
              <strong style={{ fontFamily: "var(--font-heading)", color: "var(--color-gold)", fontSize: "0.95rem" }}>
                {orderId || "CONFIRMED-VIP"}
              </strong>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block" }}>
                Status
              </span>
              <span style={{ color: "#2ecc71", fontWeight: 700, fontSize: "0.85rem" }}>
                ● Confirmed & Dispatched Soon
              </span>
            </div>
          </div>

          {order && (
            <>
              {/* Recipient & Address */}
              <div style={{ marginBottom: "1.25rem", fontSize: "0.82rem", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.5 }}>
                <span style={{ display: "block", color: "var(--color-gold)", fontWeight: 700, marginBottom: "2px" }}>
                  Delivery Destination:
                </span>
                <div>{order.full_name} ({order.phone_number})</div>
                <div>{order.house_number}, {order.street}</div>
                <div>{order.city}, {order.state} - {order.pincode}</div>
              </div>

              {/* Items */}
              {order.cart_items && Array.isArray(order.cart_items) && (
                <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "1rem", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Reserved Pieces:
                  </span>
                  {order.cart_items.map((it: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", color: "#ffffff" }}>
                      <span>
                        {it.name} {it.variationName ? `(Size: ${it.variationName})` : ""} x{it.quantity}
                      </span>
                      <span style={{ fontWeight: 700, color: "var(--color-gold)" }}>
                        {formatINR(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Grand Total */}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "0.85rem", fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                <span>Grand Total Settled</span>
                <span style={{ color: "var(--color-gold)", fontFamily: "var(--font-heading)" }}>
                  {formatINR(order.grand_total)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>


          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Link href="/profile" className="hero-cta-pill" style={{ textAlign: "center" }}>
              View In My Orders
            </Link>
            <Link href="/collection-hub" className="quickview-appointment-btn" style={{ textAlign: "center" }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <main className="subpage-wrapper" style={{ minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 1.5rem" }}>
      <Suspense fallback={<div style={{ textAlign: "center", color: "var(--color-gold)" }}>Loading Confirmation...</div>}>
        <OrderSuccessContent />
      </Suspense>
    </main>
  );
}
