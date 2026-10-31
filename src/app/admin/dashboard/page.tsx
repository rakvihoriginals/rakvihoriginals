"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  TrendingUp,
  Package,
  Users,
  Zap,
  ChevronRight,
  PlusCircle,
  RefreshCw,
  Layers,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { applyStoreDiscount } from "@/lib/fetchProducts";

const ORDERS_TABLE = "Rakvih_orders";

// Curated subcategories identical to Products page
const CURATED_SUBCATS: Record<string, string[]> = {
  men: ["Belts", "Footwear"],
  women: ["Belts", "Footwear", "Hand Bags"],
  unisex: ["Stoles"],
};

function cleanImageUrl(raw: string | null | undefined): string {
  if (!raw) return "/handbag.webp";
  let value: unknown = raw;

  try {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      value = Array.isArray(parsed) ? parsed[0] : parsed;
    }
  } catch {
    // Treat as plain string
  }

  let clean = String(value ?? "")
    .split(",")[0]
    .replace(/[\[\]"'\\]/g, "")
    .trim();

  if (!clean) return "/handbag.webp";
  if (clean.startsWith("http:")) clean = clean.replace(/^http:/i, "https:");
  if (/\.(mp4|webm|ogg|mov)$/i.test(clean)) return "/handbag.webp";

  return clean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [curatedProductCount, setCuratedProductCount] = useState<number>(0);
  const [userCount, setUserCount] = useState<number>(0);
  const [activeCoupons, setActiveCoupons] = useState<number>(0);

  /* ---------------------------------------------------
     MOUNT & PERMISSION VALIDATION
  --------------------------------------------------- */
  useEffect(() => {
    setMounted(true);

    const routesStr = localStorage.getItem("rakvih_admin_routes");
    const role = localStorage.getItem("rakvih_admin_role");

    if (role === "subadmin" && routesStr) {
      try {
        const routes: string[] = JSON.parse(routesStr);
        if (!routes.includes("/admin/dashboard")) {
          const fallback = routes[0] || "/admin/login";
          router.push(fallback);
          return;
        }
      } catch {
        router.push("/admin/login");
        return;
      }
    }
  }, [router]);

  /* ---------------------------------------------------
     FETCH ORDERS & CURATED INVENTORY
  --------------------------------------------------- */
  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Fetch Orders from Rakvih_orders using order_date
      const { data: ordersData, error: ordersErr } = await supabase
        .from(ORDERS_TABLE)
        .select("*")
        .order("order_date", { ascending: false })
        .limit(10);

      if (ordersErr) {
        console.error("Dashboard orders query error:", ordersErr.message);
      }

      const parsedOrders = (ordersData || []).map((o: any) => ({
        ...o,
        cart_items: Array.isArray(o.cart_items)
          ? o.cart_items
          : typeof o.cart_items === "string"
          ? JSON.parse(o.cart_items)
          : [],
      }));
      setOrders(parsedOrders);

      // 2. Fetch categories & subcategories to build the curated visibility filter
      const [catRes, subcatRes] = await Promise.all([
        supabase.from("categories").select("id, name"),
        supabase.from("subcategories").select("id, name, category_id"),
      ]);

      const categories = ((catRes.data || []) as { id: number; name: string }[]).filter(
        (c) => c.name.trim().toLowerCase() !== "watches" && c.id !== 8
      );
      const subcategories = (subcatRes.data || []) as { id: number; name: string; category_id: number | null }[];

      const nonCuratedVisibleIds: number[] = [];
      const curatedClauses: string[] = [];

      for (const cat of categories) {
        const catNameLower = cat.name.trim().toLowerCase();
        const curatedSubs = CURATED_SUBCATS[catNameLower];
        if (!curatedSubs) {
          nonCuratedVisibleIds.push(cat.id);
          continue;
        }

        const validSubIds = subcategories
          .filter(
            (s) =>
              s.category_id === cat.id &&
              curatedSubs.some((n) => n.toLowerCase() === s.name.trim().toLowerCase())
          )
          .map((s) => s.id);

        if (validSubIds.length > 0) {
          curatedClauses.push(
            `and(category_id.eq.${cat.id},subcategory_id.in.(${validSubIds.join(",")}))`
          );
        }
      }

      const orClauses: string[] = [];
      if (nonCuratedVisibleIds.length > 0) {
        orClauses.push(`category_id.in.(${nonCuratedVisibleIds.join(",")})`);
      }
      orClauses.push(...curatedClauses);
      const visibilityFilter = orClauses.length > 0 ? orClauses.join(",") : null;

      // 3. Count products matching the CURATED filter (~550-600)
      let countQuery = supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .neq("category_id", 8);

      if (visibilityFilter) {
        countQuery = countQuery.or(visibilityFilter);
      }

      const { count: actualCount } = await countQuery;
      setCuratedProductCount(actualCount || 0);

      // 4. Fetch Top 6 products matching the curated filter
      let prodsQuery = supabase
        .from("products")
        .select(
          `id, name, sku, active,
           product_variations ( id, price, sale_price, stock ),
           product_images ( id, image_url )`
        )
        .neq("category_id", 8)
        .order("id", { ascending: false })
        .limit(6);

      if (visibilityFilter) {
        prodsQuery = prodsQuery.or(visibilityFilter);
      }

      const { data: prodsData, error: prodsErr } = await prodsQuery;
      if (prodsErr) {
        console.error("Dashboard products query error:", prodsErr.message);
      }
      setProducts(prodsData || []);

      // 5. User directory count
      const { count: customersCount } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true });
      setUserCount(customersCount || 0);

      // 6. Active coupons count
      const { count: couponsCount } = await supabase
        .from("coupons")
        .select("id", { count: "exact", head: true });
      setActiveCoupons(couponsCount || 0);

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchDashboardData();
    }
  }, [mounted, fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  /* ---------------------------------------------------
     DYNAMIC CALCULATIONS
  --------------------------------------------------- */
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0);
  }, [orders]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) =>
      ["pending", "confirmed", "processing"].includes(o.status?.toLowerCase())
    ).length;
  }, [orders]);

  const formatNumber = (val: number) => {
    if (!mounted) return String(val);
    return val.toLocaleString("en-IN");
  };

  const topStats = useMemo(
    () => [
      {
        label: "TOTAL REVENUE",
        value: mounted && !loading ? `₹${formatNumber(totalRevenue)}` : "—",
        icon: <TrendingUp size={18} strokeWidth={1.5} />,
        badge: "Gross Volume",
      },
      {
        label: "TOTAL ORDERS",
        value: mounted && !loading ? orders.length.toString() : "—",
        icon: <ShoppingBag size={18} strokeWidth={1.5} />,
        badge: `${pendingOrdersCount} In Queue`,
      },
      {
        label: "ACTIVE INVENTORY",
        // Matches the curated catalog count (~550-600)
        value: mounted && !loading ? formatNumber(curatedProductCount) : "—",
        icon: <Package size={18} strokeWidth={1.5} />,
        badge: "Curated Creations",
      },
      {
        label: "REGISTERED USERS",
        value: mounted && !loading ? userCount.toString() : "—",
        icon: <Users size={18} strokeWidth={1.5} />,
        badge: "Verified Profiles",
      },
    ],
    [mounted, loading, totalRevenue, orders.length, pendingOrdersCount, curatedProductCount, userCount]
  );

  const bottomStats = useMemo(
    () => [
      {
        label: "ACTIVE COUPONS",
        value: mounted && !loading ? activeCoupons.toString() : "—",
        icon: <Zap size={18} strokeWidth={1.5} />,
        badge: "Live Offers",
      },
      {
        label: "CATALOG STATUS",
        value: mounted && !loading ? `${formatNumber(curatedProductCount)} Active` : "—",
        icon: <Layers size={18} strokeWidth={1.5} />,
        badge: "Synced with Store",
      },
      {
        label: "PENDING ACTION",
        value: mounted && !loading ? pendingOrdersCount.toString() : "—",
        icon: <Clock size={18} strokeWidth={1.5} />,
        badge: "Needs Fulfillment",
      },
    ],
    [mounted, loading, activeCoupons, curatedProductCount, pendingOrdersCount]
  );

  return (
    <div className="dash-wrapper">
      {/* ── Page Header ── */}
      <div className="dash-header">
        <div>
          <div className="dash-header-eyebrow">
            <span className="dash-header-dot"></span>
            <span>Live Telemetry &amp; Intelligence</span>
          </div>
          <h1 className="dash-header-title">
            <span className="dash-header-title-bold">STUDIO </span>
            <span className="dash-header-title-italic">DASHBOARD</span>
          </h1>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="dash-refresh-btn"
          style={{ opacity: refreshing ? 0.6 : 1 }}
        >
          <RefreshCw
            size={14}
            strokeWidth={1.5}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh Intel"}
        </button>
      </div>

      {/* ── TOP KPI ROW ── */}
      <div className="dash-kpi-grid">
        {topStats.map((s) => (
          <div key={s.label} className="dash-kpi-card dash-kpi-card--top">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="dash-kpi-icon">{s.icon}</div>
              <span
                style={{
                  fontSize: "0.68rem",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: "rgba(212, 175, 55, 0.12)",
                  color: "#d4af37",
                  fontWeight: 600,
                }}
              >
                {s.badge}
              </span>
            </div>
            <p className="dash-kpi-label">{s.label}</p>
            <p className="dash-kpi-value">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── SECONDARY METRICS ── */}
      <div className="dash-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {bottomStats.map((s) => (
          <div key={s.label} className="dash-kpi-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="dash-kpi-icon dash-kpi-icon--muted">{s.icon}</div>
              <span
                style={{
                  fontSize: "0.65rem",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "rgba(255, 255, 255, 0.5)",
                }}
              >
                {s.badge}
              </span>
            </div>
            <p className="dash-kpi-label">{s.label}</p>
            <p className="dash-kpi-value">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── LIVE DATA PANELS ── */}
      <div className="dash-panels-grid">
        {/* Recent Orders Panel */}
        <div className="dash-panel dash-panel--orders">
          <div className="dash-panel-head">
            <div>
              <h3 className="dash-panel-title">Recent Orders</h3>
              <p className="dash-panel-subtitle">Streaming from {ORDERS_TABLE}</p>
            </div>
            <Link href="/admin/orders" className="dash-panel-link">
              View All <ChevronRight size={12} />
            </Link>
          </div>

          <div className="dash-table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  {["Order ID", "Customer", "Items", "Grand Total", "Payment", "Status"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!mounted || loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.4)" }}>
                      Querying live orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.4)" }}>
                      No orders found in {ORDERS_TABLE}.
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 6).map((order) => {
                    const isPaid = order.payment_status?.toLowerCase() === "paid";
                    const isDelivered = order.status?.toLowerCase() === "delivered";

                    return (
                      <tr key={order.id}>
                        <td>
                          <span className="dash-order-number" style={{ fontFamily: "monospace" }}>
                            #{order.id.slice(0, 8)}
                          </span>
                        </td>
                        <td>
                          <span className="dash-customer-name">{order.full_name}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
                            {order.cart_items?.length || 0} items
                          </span>
                        </td>
                        <td>
                          <span className="dash-amount">
                            ₹{formatNumber(Number(order.grand_total) || 0)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`dash-chip ${
                              isPaid ? "dash-chip--verified" : "dash-chip--pending"
                            }`}
                          >
                            {order.payment_status || "Pending"}
                          </span>
                        </td>
                        <td>
                          <span
                            className="dash-chip"
                            style={{
                              background: isDelivered
                                ? "rgba(16, 185, 129, 0.15)"
                                : "rgba(212, 175, 55, 0.15)",
                              color: isDelivered ? "#10b981" : "#d4af37",
                              fontWeight: 600,
                            }}
                          >
                            {order.status || "confirmed"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Creations / Products Panel */}
        <div className="dash-panel">
          <div className="dash-panel-head">
            <div>
              <h3 className="dash-panel-title">Active Creations</h3>
              <p className="dash-panel-subtitle">Curated catalog entries</p>
            </div>
            <Link href="/admin/products" className="dash-panel-link">
              Catalog <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="dash-product-list">
            {!mounted || loading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.4)" }}>
                Loading creations...
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.4)" }}>
                No creations found in catalog.
              </div>
            ) : (
              products.map((p) => {
                const rawImg = p.product_images?.[0]?.image_url;
                const img = cleanImageUrl(rawImg);

                const variations = p.product_variations || [];
                const rawPrices = variations.map((v: any) => Number(v.price || 0));
                const finalPrices = variations.map((v: any) =>
                  applyStoreDiscount(Number(v.price || 0), v.sale_price ? Number(v.sale_price) : null)
                );
                const minFinal = finalPrices.length > 0 ? Math.min(...finalPrices) : 0;
                const minRaw = rawPrices.length > 0 ? Math.min(...rawPrices) : 0;
                const isDiscounted = minFinal > 0 && minFinal < minRaw;
                const prodStock = variations.reduce(
                  (sum: number, v: any) => sum + (Number(v.stock) || 0),
                  0
                );

                return (
                  <div key={p.id} className="dash-product-row">
                    <div className="dash-product-thumb" style={{ position: "relative", width: "40px", height: "40px" }}>
                      <Image
                        src={img}
                        alt={p.name || "Creation"}
                        fill
                        sizes="40px"
                        style={{ objectFit: "cover", borderRadius: "6px" }}
                        unoptimized
                      />
                    </div>
                    <div className="dash-product-body">
                      <h4 className="dash-product-name">{p.name || "Untitled Piece"}</h4>
                      <div className="dash-product-meta">
                        <span className="dash-product-price">
                          {minFinal > 0 ? `₹${formatNumber(minFinal)}` : "—"}
                        </span>
                        {isDiscounted && (
                          <span className="dash-discount-pill">15% OFF</span>
                        )}
                        <span className="dash-product-stock">Stock: {formatNumber(prodStock)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="dash-add-product-wrap">
            <Link href="/admin/products" className="dash-add-product-btn">
              <PlusCircle size={14} strokeWidth={1.5} /> Manage Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}