"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { downloadOrderInvoice } from "@/lib/invoiceGenerator";

/* =====================================================
   DATABASE CONFIGURATION
===================================================== */
const ORDERS_TABLE = "Rakvih_orders";

/* =====================================================
   TYPES
===================================================== */

export interface CartItem {
  id: number | string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  productId: number | string;
  variationId?: number | string;
  originalPrice?: number;
  variationName?: string;
}

export interface Order {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  alt_phone_number?: string;
  house_number: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  payment_method: string;
  payment_id: string;
  payment_status: string;
  total_price: string | number;
  shipping_cost: string | number;
  grand_total: string | number;
  cart_items: CartItem[];
  status: string;
  order_date: string;
  email: string;
  payment_rejection_reason?: string | null;
  stock_restored?: boolean;
  coupon_code?: string | null;
  discount_amount?: string | number;
}

const ORDER_STATUSES = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Accordion Expand States
  const [openOrders, setOpenOrders] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  const handleDownloadInvoice = async (order: Order) => {
    try {
      setDownloadingInvoiceId(order.id);
      await downloadOrderInvoice(order);
    } catch (err) {
      console.error("Failed to generate invoice:", err);
      alert("Could not generate invoice PDF. Please try again.");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  /* ---------------------------------------------------
     FETCH ORDERS FROM Rakvih_orders
  --------------------------------------------------- */
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from(ORDERS_TABLE)
        .select("*")
        .order("order_date", { ascending: false });

      if (fetchErr) {
        throw new Error(fetchErr.message || JSON.stringify(fetchErr));
      }

      const parsedOrders = (data || []).map((o: any) => ({
        ...o,
        cart_items: Array.isArray(o.cart_items)
          ? o.cart_items
          : typeof o.cart_items === "string"
          ? JSON.parse(o.cart_items)
          : [],
      }));

      setOrders(parsedOrders);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /* ---------------------------------------------------
     UPDATE STATUS HANDLERS
  --------------------------------------------------- */
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(orderId);
    try {
      const { error: updateErr } = await supabase
        .from(ORDERS_TABLE)
        .update({ status: newStatus })
        .eq("id", orderId);

      if (updateErr) throw new Error(updateErr.message);

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    setIsUpdatingStatus(orderId);
    try {
      const { error: updateErr } = await supabase
        .from(ORDERS_TABLE)
        .update({ payment_status: newPaymentStatus })
        .eq("id", orderId);

      if (updateErr) throw new Error(updateErr.message);

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, payment_status: newPaymentStatus } : o))
      );
    } catch (err: any) {
      alert("Failed to update payment status: " + err.message);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  /* ---------------------------------------------------
     ACCORDION TOGGLES
  --------------------------------------------------- */
  function toggleOrder(id: string) {
    setOpenOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpandAll() {
    if (allExpanded) {
      setOpenOrders(new Set());
      setAllExpanded(false);
    } else {
      setOpenOrders(new Set(orders.map((o) => o.id)));
      setAllExpanded(true);
    }
  }

  /* ---------------------------------------------------
     FILTER LOGIC & COUNTERS
  --------------------------------------------------- */
  const q = query.trim().toLowerCase();

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" ||
        order.status?.toLowerCase() === statusFilter.toLowerCase();

      const matchesPayment =
        paymentFilter === "all" ||
        order.payment_status?.toLowerCase() === paymentFilter.toLowerCase();

      const matchesQuery =
        !q ||
        order.id?.toLowerCase().includes(q) ||
        order.full_name?.toLowerCase().includes(q) ||
        order.email?.toLowerCase().includes(q) ||
        order.phone_number?.includes(q) ||
        order.payment_id?.toLowerCase().includes(q) ||
        order.city?.toLowerCase().includes(q) ||
        order.cart_items.some((item) => item.name?.toLowerCase().includes(q));

      return matchesStatus && matchesPayment && matchesQuery;
    });
  }, [orders, statusFilter, paymentFilter, q]);

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0);
  }, [orders]);

  const pendingCount = useMemo(() => {
    return orders.filter((o) =>
      ["pending", "confirmed", "processing"].includes(o.status?.toLowerCase())
    ).length;
  }, [orders]);

  return (
    <div className="subpage-wrapper brand-directory-admin">
      {/* Hero (Same structure as Category Setup) */}
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/admin/dashboard">Dashboard</Link>
            <span>/</span>
            <span className="active">Orders</span>
          </div>

          <h1 className="subpage-title">Orders Management</h1>
          <p className="subpage-subtitle">
            Live order tracking, item inspection, and fulfillment pipeline connected to{" "}
            <code>{ORDERS_TABLE}</code>.
          </p>
        </div>
      </section>

      {/* Grid / Content Container */}
      <section className="subpage-grid-section">
        <div className="subpage-container">
          {error && (
            <p style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: "1.5rem" }}>
              {error}
            </p>
          )}

          {/* Metric Chips Summary (Same as Category tree summary) */}
          {!loading && orders.length > 0 && (
            <div className="cat-tree-summary">
              <div className="cat-tree-summary-item">
                <span className="cat-tree-summary-num">{orders.length}</span>
                <span className="cat-tree-summary-label">Total Orders</span>
              </div>
              <div className="cat-tree-summary-item">
                <span className="cat-tree-summary-num">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </span>
                <span className="cat-tree-summary-label">Gross Revenue</span>
              </div>
              <div className="cat-tree-summary-item">
                <span className="cat-tree-summary-num" style={{ color: "#f59e0b" }}>
                  {pendingCount}
                </span>
                <span className="cat-tree-summary-label">Pending Action</span>
              </div>
              <div className="cat-tree-summary-item">
                <span className="cat-tree-summary-num" style={{ color: "#10b981" }}>
                  {orders.filter((o) => o.status?.toLowerCase() === "delivered").length}
                </span>
                <span className="cat-tree-summary-label">Delivered</span>
              </div>
            </div>
          )}

          {/* Toolbar with Search, Status Selectors, and Expand All */}
          <div className="cat-tree-toolbar" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
            <div className="cat-tree-search" style={{ flex: "1 1 280px" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search orders by ID, name, email, phone, item..."
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="brand-directory-clear-btn"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                <option value="all" style={{ background: "#111" }}>All Statuses</option>
                {ORDER_STATUSES.filter((s) => s !== "all").map((s) => (
                  <option key={s} value={s} style={{ background: "#111" }}>
                    {s.toUpperCase()}
                  </option>
                ))}
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="brand-directory-clear-btn"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                <option value="all" style={{ background: "#111" }}>All Payments</option>
                <option value="pending" style={{ background: "#111" }}>Payment: Pending</option>
                <option value="paid" style={{ background: "#111" }}>Payment: Paid</option>
                <option value="failed" style={{ background: "#111" }}>Payment: Failed</option>
              </select>

              {!loading && orders.length > 0 && (
                <button onClick={toggleExpandAll} className="cat-tree-expand-btn">
                  {allExpanded ? "Collapse All" : "Expand All"}
                </button>
              )}
            </div>
          </div>

          {/* Skeletons while loading */}
          {loading ? (
            <div className="cat-tree">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="cat-tree-skeleton" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="cat-tree-empty">
              <p>
                {query
                  ? `No orders match "${query}".`
                  : "No orders found in Rakvih_orders."}
              </p>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="brand-directory-clear-btn"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            /* Collapsible Tree Structure matching cat-tree */
            <div className="cat-tree">
              {filteredOrders.map((order) => {
                const isOpen = openOrders.has(order.id);
                const firstItemImg = order.cart_items?.[0]?.image;
                const formattedDate = order.order_date
                  ? new Date(order.order_date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";

                return (
                  <div
                    key={order.id}
                    className={`cat-node${
                      q &&
                      (order.full_name?.toLowerCase().includes(q) ||
                        order.id?.toLowerCase().includes(q))
                        ? " has-match"
                        : ""
                    }`}
                  >
                    {/* Order Top Bar (Clickable) */}
                    <div
                      className="cat-node-row"
                      onClick={() => toggleOrder(order.id)}
                    >
                      <span className={`cat-node-chevron${isOpen ? " open" : ""}`}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </span>

                      {/* Customer / Order Lead Thumbnail */}
                      <div className="cat-node-thumb">
                        {firstItemImg ? (
                          <Image
                            src={firstItemImg}
                            alt="Lead Product"
                            fill
                            sizes="44px"
                            style={{ objectFit: "cover" }}
                            unoptimized
                          />
                        ) : (
                          <span className="cat-node-thumb-fallback">
                            {order.full_name ? order.full_name.charAt(0).toUpperCase() : "#"}
                          </span>
                        )}
                      </div>

                      {/* Order Identity & Badges */}
                      <div className="cat-node-body" style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                          <span className="cat-node-name">{order.full_name}</span>
                          <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>
                            #{order.id.slice(0, 8)}
                          </span>
                        </div>

                        <div className="cat-node-meta" style={{ marginTop: "0.25rem" }}>
                          <span className="cat-node-count">
                            {order.cart_items.length} item{order.cart_items.length === 1 ? "" : "s"}
                          </span>
                          <span className="cat-node-badge priority">
                            ₹{Number(order.grand_total || 0).toLocaleString("en-IN")}
                          </span>
                          <span
                            className="cat-node-badge"
                            style={{
                              textTransform: "uppercase",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              background:
                                order.status?.toLowerCase() === "delivered"
                                  ? "rgba(16, 185, 129, 0.18)"
                                  : "rgba(212, 175, 55, 0.15)",
                              color:
                                order.status?.toLowerCase() === "delivered"
                                  ? "#10b981"
                                  : "var(--color-gold, #d4af37)",
                            }}
                          >
                            {order.status || "confirmed"}
                          </span>
                          <span
                            className="cat-node-badge"
                            style={{
                              textTransform: "uppercase",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              background:
                                order.payment_status?.toLowerCase() === "paid"
                                  ? "rgba(16, 185, 129, 0.18)"
                                  : "rgba(245, 158, 11, 0.15)",
                              color:
                                order.payment_status?.toLowerCase() === "paid"
                                  ? "#10b981"
                                  : "#f59e0b",
                            }}
                          >
                            {order.payment_status}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                            {formattedDate}
                          </span>

                          <button
                            type="button"
                            title="Download Official Tax Invoice PDF"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadInvoice(order);
                            }}
                            disabled={downloadingInvoiceId === order.id}
                            style={{
                              marginLeft: "auto",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              background: "rgba(196, 161, 116, 0.12)",
                              border: "1px solid rgba(196, 161, 116, 0.35)",
                              color: "var(--color-gold)",
                              padding: "0.3rem 0.65rem",
                              borderRadius: "6px",
                              fontSize: "0.7rem",
                              fontFamily: "var(--font-heading)",
                              fontWeight: 700,
                              cursor: downloadingInvoiceId === order.id ? "wait" : "pointer",
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            {downloadingInvoiceId === order.id ? "Generating..." : "Invoice"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Children Body (Reveals Items, Details, and Quick Updates) */}
                    <div className={`cat-node-children${isOpen ? " open" : ""}`}>
                      <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        
                        {/* Control Bar: Update Status & Payment directly */}
                        <div
                          style={{
                            display: "flex",
                            gap: "1rem",
                            flexWrap: "wrap",
                            background: "rgba(255, 255, 255, 0.02)",
                            padding: "0.75rem 1rem",
                            borderRadius: "12px",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#d4af37", fontWeight: 700 }}>
                              Fulfillment:
                            </span>
                            <select
                              disabled={isUpdatingStatus === order.id}
                              value={order.status}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                              style={{
                                background: "#0c0a06",
                                border: "1px solid rgba(255,255,255,0.15)",
                                color: "#ffffff",
                                padding: "0.35rem 0.6rem",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                              }}
                            >
                              {ORDER_STATUSES.filter((s) => s !== "all").map((s) => (
                                <option key={s} value={s}>
                                  {s.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#d4af37", fontWeight: 700 }}>
                              Payment:
                            </span>
                            <select
                              disabled={isUpdatingStatus === order.id}
                              value={order.payment_status}
                              onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value)}
                              style={{
                                background: "#0c0a06",
                                border: "1px solid rgba(255,255,255,0.15)",
                                color: "#ffffff",
                                padding: "0.35rem 0.6rem",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                              }}
                            >
                              <option value="pending">PENDING</option>
                              <option value="paid">PAID</option>
                              <option value="failed">FAILED</option>
                            </select>
                          </div>

                          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                              Method: <strong>{order.payment_method}</strong> ({order.payment_id})
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadInvoice(order);
                              }}
                              disabled={downloadingInvoiceId === order.id}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.45rem",
                                background: "linear-gradient(135deg, rgba(196, 161, 116, 0.22) 0%, rgba(168, 139, 74, 0.15) 100%)",
                                border: "1px solid rgba(196, 161, 116, 0.45)",
                                color: "var(--color-gold)",
                                padding: "0.45rem 0.95rem",
                                borderRadius: "8px",
                                fontSize: "0.75rem",
                                fontFamily: "var(--font-heading)",
                                fontWeight: 700,
                                cursor: downloadingInvoiceId === order.id ? "wait" : "pointer",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                              {downloadingInvoiceId === order.id ? "Generating PDF Invoice..." : "Download Official Invoice (PDF)"}
                            </button>
                          </div>
                        </div>

                        {/* Customer & Shipping Summary */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                            gap: "1rem",
                            fontSize: "0.82rem",
                            color: "rgba(255, 255, 255, 0.7)",
                          }}
                        >
                          <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.75rem", borderRadius: "8px" }}>
                            <div style={{ fontWeight: 700, color: "#fff", marginBottom: "0.3rem" }}>Contact Details</div>
                            <div>Email: {order.email}</div>
                            <div>Phone: {order.phone_number}</div>
                            {order.alt_phone_number && <div>Alt: {order.alt_phone_number}</div>}
                          </div>

                          <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.75rem", borderRadius: "8px" }}>
                            <div style={{ fontWeight: 700, color: "#fff", marginBottom: "0.3rem" }}>Shipping Address</div>
                            <div>{order.house_number}, {order.street}</div>
                            <div>{order.city}, {order.state} - {order.pincode}</div>
                          </div>
                        </div>

                        {/* Product Line Items (Styled like subcat-list) */}
                        <div className="subcat-list">
                          {order.cart_items.map((item, idx) => (
                            <div key={idx} className="subcat-node">
                              <div className="subcat-node-row" style={{ cursor: "default" }}>
                                <span className="subcat-node-index">{idx + 1}.</span>

                                <div className="subcat-node-thumb">
                                  {item.image ? (
                                    <Image
                                      src={item.image}
                                      alt={item.name || "Item"}
                                      fill
                                      sizes="32px"
                                      style={{ objectFit: "cover" }}
                                      unoptimized
                                    />
                                  ) : null}
                                </div>

                                <span className="subcat-node-name">{item.name}</span>

                                <div className="subcat-node-meta">
                                  {item.variationName && (
                                    <span className="cat-node-badge priority">
                                      {item.variationName}
                                    </span>
                                  )}
                                  <span className="cat-node-count">Qty {item.quantity}</span>
                                  <span className="cat-node-badge priority">
                                    ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}