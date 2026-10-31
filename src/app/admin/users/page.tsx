"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/* =====================================================
   DATABASE CONFIGURATION
===================================================== */
const USERS_TABLE = "users";

/* =====================================================
   TYPES
===================================================== */

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Accordion State
  const [query, setQuery] = useState("");
  const [openUsers, setOpenUsers] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  /* ---------------------------------------------------
     FETCH USERS
  --------------------------------------------------- */
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from(USERS_TABLE)
        .select("id, name, email, created_at")
        .order("created_at", { ascending: false });

      if (fetchErr) {
        throw new Error(fetchErr.message || JSON.stringify(fetchErr));
      }

      setUsers((data || []) as AdminUser[]);
    } catch (err: any) {
      console.error("Error fetching users from " + USERS_TABLE + ":", err);
      setError(err?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  /* ---------------------------------------------------
     ACCORDION TOGGLE HANDLERS
  --------------------------------------------------- */
  function toggleUser(id: string) {
    setOpenUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpandAll() {
    if (allExpanded) {
      setOpenUsers(new Set());
      setAllExpanded(false);
    } else {
      setOpenUsers(new Set(users.map((u) => u.id)));
      setAllExpanded(true);
    }
  }

  /* ---------------------------------------------------
     FILTER LOGIC
  --------------------------------------------------- */
  const q = query.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (!q) return true;
      const matchesName = user.name?.toLowerCase().includes(q);
      const matchesEmail = user.email?.toLowerCase().includes(q);
      const matchesId = user.id?.toLowerCase().includes(q);
      return Boolean(matchesName || matchesEmail || matchesId);
    });
  }, [users, q]);

  // Metrics
  const totalCount = users.length;
  const newThisMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return users.filter((u) => {
      if (!u.created_at) return false;
      const d = new Date(u.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [users]);

  return (
    <div className="subpage-wrapper brand-directory-admin">
      {/* Hero Section */}
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/admin/dashboard">Dashboard</Link>
            <span>/</span>
            <span className="active">Registered Users</span>
          </div>

          <h1 className="subpage-title">User Accounts</h1>
          <p className="subpage-subtitle">
            Customer directory connected to <code>{USERS_TABLE}</code>.
          </p>
        </div>
      </section>

      {/* Grid Content */}
      <section className="subpage-grid-section">
        <div className="subpage-container">
          {error && (
            <p style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: "1.5rem" }}>
              {error}
            </p>
          )}

          {/* Metric Summary Cards */}
          {!loading && users.length > 0 && (
            <div className="cat-tree-summary">
              <div className="cat-tree-summary-item">
                <span className="cat-tree-summary-num">{totalCount}</span>
                <span className="cat-tree-summary-label">Total Accounts</span>
              </div>
              <div className="cat-tree-summary-item">
                <span className="cat-tree-summary-num" style={{ color: "var(--color-gold, #d4af37)" }}>
                  {newThisMonth}
                </span>
                <span className="cat-tree-summary-label">Joined This Month</span>
              </div>
              <div className="cat-tree-summary-item">
                <span className="cat-tree-summary-num" style={{ color: "#10b981" }}>
                  Active
                </span>
                <span className="cat-tree-summary-label">Account Status</span>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="cat-tree-toolbar">
            <div className="cat-tree-search">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users by name, email, ID..."
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button onClick={loadUsers} className="cat-tree-expand-btn">
                ↻ Refresh
              </button>

              {!loading && users.length > 0 && (
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
          ) : filteredUsers.length === 0 ? (
            <div className="cat-tree-empty">
              <p>
                {query
                  ? `No users match "${query}".`
                  : "No registered users found in the database."}
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
            /* Collapsible Users Tree */
            <div className="cat-tree">
              {filteredUsers.map((user) => {
                const isOpen = openUsers.has(user.id);
                const initial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
                const joinedDate = user.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";

                return (
                  <div
                    key={user.id}
                    className={`cat-node${
                      q &&
                      (user.name?.toLowerCase().includes(q) ||
                        user.email?.toLowerCase().includes(q) ||
                        user.id?.toLowerCase().includes(q))
                        ? " has-match"
                        : ""
                    }`}
                  >
                    {/* User Header Row */}
                    <div
                      className="cat-node-row"
                      onClick={() => toggleUser(user.id)}
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

                      {/* Avatar initial */}
                      <div className="cat-node-thumb">
                        <span className="cat-node-thumb-fallback">
                          {initial}
                        </span>
                      </div>

                      {/* Info & Badges */}
                      <div className="cat-node-body" style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                          <span className="cat-node-name">{user.name || "Unnamed User"}</span>
                          <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                            ({user.email})
                          </span>
                        </div>

                        <div className="cat-node-meta" style={{ marginTop: "0.25rem" }}>
                          <span className="cat-node-badge priority">
                            ID: {user.id.slice(0, 8)}...
                          </span>
                          <span
                            className="cat-node-badge"
                            style={{
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "#10b981",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                            }}
                          >
                            ACTIVE
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                            Joined {joinedDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Details */}
                    <div className={`cat-node-children${isOpen ? " open" : ""}`}>
                      <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                        
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: "1rem",
                            fontSize: "0.82rem",
                          }}
                        >
                          <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.85rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ color: "var(--color-gold, #d4af37)", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>
                              Profile Identity
                            </div>
                            <div style={{ marginBottom: "0.3rem" }}>
                              <strong style={{ color: "rgba(255,255,255,0.6)" }}>Full Name:</strong>{" "}
                              <span style={{ color: "#ffffff" }}>{user.name || "Not provided"}</span>
                            </div>
                            <div style={{ marginBottom: "0.3rem" }}>
                              <strong style={{ color: "rgba(255,255,255,0.6)" }}>Email:</strong>{" "}
                              <span style={{ color: "#ffffff" }}>{user.email}</span>
                            </div>
                            <div>
                              <strong style={{ color: "rgba(255,255,255,0.6)" }}>User UUID:</strong>{" "}
                              <code style={{ fontSize: "0.75rem", background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: "4px" }}>
                                {user.id}
                              </code>
                            </div>
                          </div>

                          <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.85rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ color: "var(--color-gold, #d4af37)", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>
                              Account Metadata
                            </div>
                            <div style={{ marginBottom: "0.3rem" }}>
                              <strong style={{ color: "rgba(255,255,255,0.6)" }}>Registration Date:</strong>{" "}
                              <span style={{ color: "#ffffff" }}>
                                {new Date(user.created_at).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div>
                              <strong style={{ color: "rgba(255,255,255,0.6)" }}>Status:</strong>{" "}
                              <span style={{ color: "#10b981", fontWeight: 600 }}>Active Account</span>
                            </div>
                          </div>
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