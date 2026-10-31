"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Edit3, CheckSquare, Square, X } from "lucide-react";

const PRIMARY_ADMIN_EMAIL = "rakvihoriginals@gmail.com";

// Exactly matches your sidebar pages (ADMINS excluded from subadmin control)
const AVAILABLE_PAGES = [
  { path: "/admin/dashboard", label: "OVERVIEW" },
  { path: "/admin/listbrands", label: "List Brands" },
  { path: "/admin/categorysetup", label: "Category" },
  { path: "/admin/products", label: "PRODUCTS" },
  { path: "/admin/orders", label: "ORDERS" },
  { path: "/admin/users", label: "USERS" },
];

export interface SubAdmin {
  id: string;
  email: string;
  role: string;
  allowed_routes?: string[];
  created_at: string;
}

export default function AdminSubadminsPage() {
  const router = useRouter();
  const [subadmins, setSubadmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Accordion State
  const [query, setQuery] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  // Registration Form State
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"subadmin" | "admin">("subadmin");
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([
    "/admin/dashboard",
    "/admin/products",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  // Edit Modal State
  const [editingSubadmin, setEditingSubadmin] = useState<SubAdmin | null>(null);
  const [editRole, setEditRole] = useState<"subadmin" | "admin">("subadmin");
  const [editRoutes, setEditRoutes] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  /* ---------------------------------------------------
     FETCH DATA
  --------------------------------------------------- */
  const loadSubadmins = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/createsub");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load subadmins");
      }

      setSubadmins(data.subadmins || []);
    } catch (err: any) {
      console.error("Error fetching subadmins:", err);
      setError(err?.message || "Failed to load subadmins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentRole = localStorage.getItem("rakvih_admin_role");
    if (currentRole === "subadmin") {
      router.push("/admin/dashboard");
      return;
    }
    loadSubadmins();
  }, [loadSubadmins, router]);

  /* ---------------------------------------------------
     CHECKBOX HANDLERS
  --------------------------------------------------- */
  const toggleRoute = (route: string) => {
    setSelectedRoutes((prev) =>
      prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route]
    );
  };

  const toggleEditRoute = (route: string) => {
    setEditRoutes((prev) =>
      prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route]
    );
  };

  /* ---------------------------------------------------
     CREATE SUBADMIN
  --------------------------------------------------- */
  const handleCreateSubadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanPassword = newPassword.trim();

    try {
      if (!cleanEmail || !cleanPassword) {
        throw new Error("Email and password are required.");
      }

      if (newRole === "subadmin" && selectedRoutes.length === 0) {
        throw new Error("Please select at least one page for subadmin access.");
      }

      const res = await fetch("/api/admin/createsub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
          role: newRole,
          allowed_routes:
            newRole === "admin"
              ? AVAILABLE_PAGES.map((p) => p.path).concat("/admin/createsub")
              : selectedRoutes,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to register executive.");
      }

      setNewEmail("");
      setNewPassword("");
      setNewRole("subadmin");
      setSelectedRoutes(["/admin/dashboard", "/admin/products"]);
      loadSubadmins();
      alert("Executive registered successfully!");
    } catch (err: any) {
      setFormError(err.message || "Failed to create subadmin");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------------------------------------------
     EDIT SUBADMIN
  --------------------------------------------------- */
  const openEditModal = (sub: SubAdmin) => {
    setEditingSubadmin(sub);
    setEditRole(sub.role?.toLowerCase() === "admin" ? "admin" : "subadmin");
    setEditRoutes(
      sub.allowed_routes && sub.allowed_routes.length > 0
        ? sub.allowed_routes
        : ["/admin/dashboard"]
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubadmin) return;

    setIsSavingEdit(true);
    try {
      if (editRole === "subadmin" && editRoutes.length === 0) {
        throw new Error("Select at least one page privilege for this subadmin.");
      }

      const res = await fetch("/api/admin/createsub", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSubadmin.id,
          role: editRole,
          allowed_routes:
            editRole === "admin"
              ? AVAILABLE_PAGES.map((p) => p.path).concat("/admin/createsub")
              : editRoutes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update permissions");
      }

      setEditingSubadmin(null);
      loadSubadmins();
    } catch (err: any) {
      alert(err.message || "Error saving permissions");
    } finally {
      setIsSavingEdit(false);
    }
  };

  /* ---------------------------------------------------
     DELETE SUBADMIN
  --------------------------------------------------- */
  const handleDeleteSubadmin = async (id: string, email: string) => {
    if (email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      alert("Master Administrator cannot be deleted.");
      return;
    }

    if (!confirm(`Are you sure you want to revoke and delete ${email}?`)) {
      return;
    }

    setActionId(id);
    try {
      const res = await fetch(`/api/admin/createsub?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete subadmin");
      }

      loadSubadmins();
    } catch (err: any) {
      alert(err.message || "Failed to delete account");
    } finally {
      setActionId(null);
    }
  };

  /* ---------------------------------------------------
     ACCORDION & FILTERS
  --------------------------------------------------- */
  function toggleItem(id: string) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpandAll() {
    if (allExpanded) {
      setOpenItems(new Set());
      setAllExpanded(false);
    } else {
      setOpenItems(new Set(subadmins.map((s) => s.id)));
      setAllExpanded(true);
    }
  }

  const q = query.trim().toLowerCase();
  const filteredSubadmins = useMemo(() => {
    return subadmins.filter((sub) => {
      if (!q) return true;
      return (
        sub.email?.toLowerCase().includes(q) ||
        sub.role?.toLowerCase().includes(q) ||
        sub.id?.toLowerCase().includes(q)
      );
    });
  }, [subadmins, q]);

  return (
    <div className="subpage-wrapper brand-directory-admin">
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/admin/dashboard">Dashboard</Link>
            <span>/</span>
            <span className="active">Admins Management</span>
          </div>

          <h1 className="subpage-title">Executive Access</h1>
          <p className="subpage-subtitle">
            Configure boutique credentials &amp; page permissions connected to <code>rakvih_subadmins</code>.
          </p>
        </div>
      </section>

      <section className="subpage-grid-section">
        <div className="subpage-container">
          {error && (
            <p style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: "1.5rem" }}>
              {error}
            </p>
          )}

          {/* Metric Summary Cards */}
          {!loading && (
            <div className="cat-tree-summary">
              <div className="cat-tree-summary-item">
                <span className="cat-tree-summary-num">{subadmins.length}</span>
                <span className="cat-tree-summary-label">Total Executives</span>
              </div>
              <div className="cat-tree-summary-item">
                <span className="cat-tree-summary-num" style={{ color: "var(--color-gold, #d4af37)" }}>
                  {subadmins.filter((s) => s.role === "subadmin").length}
                </span>
                <span className="cat-tree-summary-label">Subadmins</span>
              </div>
              <div className="cat-tree-summary-item">
                <span className="cat-tree-summary-num" style={{ color: "#10b981" }}>
                  Active
                </span>
                <span className="cat-tree-summary-label">Dynamic Authorization</span>
              </div>
            </div>
          )}

          {/* Registration Form Box */}
          <div
            style={{
              background: "#0e0c08",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <h3 style={{ fontSize: "1rem", color: "#ffffff", marginBottom: "1rem", fontWeight: 700 }}>
              Register Portal Administrator
            </h3>

            {formError && (
              <p style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: "1rem" }}>
                {formError}
              </p>
            )}

            <form onSubmit={handleCreateSubadmin}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                  alignItems: "flex-end",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.3rem" }}>
                    Executive Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@domain.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "10px",
                      padding: "0.65rem 0.9rem",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.3rem" }}>
                    Security Passcode
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "10px",
                      padding: "0.65rem 0.9rem",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.3rem" }}>
                    Assigned Authority
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as "admin" | "subadmin")}
                    style={{
                      width: "100%",
                      background: "#12100c",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "10px",
                      padding: "0.65rem 0.9rem",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    <option value="subadmin">Subadmin (Restricted Console)</option>
                    <option value="admin">Admin (Full Privilege)</option>
                  </select>
                </div>
              </div>

              {/* Page Permissions Checklist (Visible if Subadmin) */}
              {newRole === "subadmin" && (
                <div style={{ marginBottom: "1.25rem", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-gold, #d4af37)", marginBottom: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Select Permitted Pages for this Subadmin:
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.6rem" }}>
                    {AVAILABLE_PAGES.map((page) => {
                      const checked = selectedRoutes.includes(page.path);
                      return (
                        <div
                          key={page.path}
                          onClick={() => toggleRoute(page.path)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            cursor: "pointer",
                            padding: "0.4rem 0.6rem",
                            borderRadius: "6px",
                            background: checked ? "rgba(212, 175, 55, 0.08)" : "transparent",
                            border: `1px solid ${checked ? "rgba(212, 175, 55, 0.3)" : "rgba(255,255,255,0.05)"}`,
                            fontSize: "0.8rem",
                            color: checked ? "#ffffff" : "rgba(255,255,255,0.6)",
                          }}
                        >
                          {checked ? <CheckSquare size={16} color="#d4af37" /> : <Square size={16} />}
                          <span>{page.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: "var(--color-gold, #d4af37)",
                  color: "#000000",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "10px",
                  padding: "0.7rem 1.5rem",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                {isSubmitting ? "Enrolling..." : "+ Register Account"}
              </button>
            </form>
          </div>

          {/* Search & Collapse Toolbar */}
          <div className="cat-tree-toolbar">
            <div className="cat-tree-search">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search administrators by email, role..."
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button onClick={loadSubadmins} className="cat-tree-expand-btn">
                ↻ Refresh
              </button>

              {!loading && subadmins.length > 0 && (
                <button onClick={toggleExpandAll} className="cat-tree-expand-btn">
                  {allExpanded ? "Collapse All" : "Expand All"}
                </button>
              )}
            </div>
          </div>

          {/* Listing */}
          {loading ? (
            <div className="cat-tree">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="cat-tree-skeleton" />
              ))}
            </div>
          ) : filteredSubadmins.length === 0 ? (
            <div className="cat-tree-empty">
              <p>
                {query ? `No administrators match "${query}".` : "No accounts registered in this portal."}
              </p>
            </div>
          ) : (
            <div className="cat-tree">
              {filteredSubadmins.map((sub) => {
                const isOpen = openItems.has(sub.id);
                const isMaster = sub.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
                const initial = sub.email ? sub.email.charAt(0).toUpperCase() : "A";
                const createdDate = sub.created_at
                  ? new Date(sub.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";

                return (
                  <div key={sub.id} className="cat-node">
                    <div className="cat-node-row">
                      <span
                        className={`cat-node-chevron${isOpen ? " open" : ""}`}
                        onClick={() => toggleItem(sub.id)}
                      >
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

                      <div className="cat-node-thumb" onClick={() => toggleItem(sub.id)}>
                        <span className="cat-node-thumb-fallback">{initial}</span>
                      </div>

                      <div className="cat-node-body" style={{ flex: 1 }} onClick={() => toggleItem(sub.id)}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                          <span className="cat-node-name">{sub.email}</span>
                          {isMaster && (
                            <span style={{ fontSize: "0.65rem", background: "rgba(212, 175, 55, 0.2)", color: "#d4af37", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                              MASTER OWNER
                            </span>
                          )}
                        </div>

                        <div className="cat-node-meta" style={{ marginTop: "0.25rem" }}>
                          <span className="cat-node-badge priority">
                            Role: {sub.role}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                            Enrolled {createdDate}
                          </span>
                        </div>
                      </div>

                      {/* Action Controls: Edit & Delete */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingRight: "0.5rem" }}>
                        {!isMaster && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(sub);
                              }}
                              title="Edit Permissions"
                              style={{
                                background: "rgba(212, 175, 55, 0.12)",
                                border: "1px solid rgba(212, 175, 55, 0.3)",
                                color: "#d4af37",
                                padding: "0.45rem",
                                borderRadius: "8px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubadmin(sub.id, sub.email);
                              }}
                              disabled={actionId === sub.id}
                              title="Delete administrator"
                              style={{
                                background: "rgba(239, 68, 68, 0.12)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#ef4444",
                                padding: "0.45rem",
                                borderRadius: "8px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Accordion Details */}
                    <div className={`cat-node-children${isOpen ? " open" : ""}`}>
                      <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                        <div
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            padding: "0.85rem",
                            borderRadius: "10px",
                            border: "1px solid rgba(255,255,255,0.05)",
                            fontSize: "0.82rem",
                          }}
                        >
                          <div style={{ color: "var(--color-gold, #d4af37)", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>
                            Assigned Page Permissions
                          </div>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
                            {sub.role === "admin" ? (
                              <span style={{ color: "#10b981", fontSize: "0.75rem", fontWeight: 600 }}>
                                ✓ Full Access Granted (All Portal Features)
                              </span>
                            ) : sub.allowed_routes && sub.allowed_routes.length > 0 ? (
                              sub.allowed_routes.map((route) => (
                                <span
                                  key={route}
                                  style={{
                                    background: "rgba(255, 255, 255, 0.05)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    fontSize: "0.72rem",
                                    color: "rgba(255, 255, 255, 0.8)",
                                  }}
                                >
                                  {AVAILABLE_PAGES.find((p) => p.path === route)?.label || route}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: "#f87171", fontSize: "0.75rem" }}>
                                No pages assigned.
                              </span>
                            )}
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

      {/* =====================================================
          EDIT PERMISSIONS MODAL
      ===================================================== */}
      {editingSubadmin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#0e0c08",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              borderRadius: "16px",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                  Edit Permissions
                </h3>
                <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginTop: "0.2rem" }}>
                  {editingSubadmin.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSubadmin(null)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              {/* Role Select */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", marginBottom: "0.4rem" }}>
                  Assigned Authority
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as "admin" | "subadmin")}
                  style={{
                    width: "100%",
                    background: "#16130e",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "10px",
                    padding: "0.65rem 0.9rem",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  <option value="subadmin">Subadmin (Restricted Console)</option>
                  <option value="admin">Admin (Full Privilege)</option>
                </select>
              </div>

              {/* Allowed Pages (if Subadmin) */}
              {editRole === "subadmin" && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-gold, #d4af37)", marginBottom: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Select Permitted Pages:
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {AVAILABLE_PAGES.map((page) => {
                      const checked = editRoutes.includes(page.path);
                      return (
                        <div
                          key={page.path}
                          onClick={() => toggleEditRoute(page.path)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            cursor: "pointer",
                            padding: "0.55rem 0.8rem",
                            borderRadius: "8px",
                            background: checked ? "rgba(212, 175, 55, 0.08)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${checked ? "rgba(212, 175, 55, 0.3)" : "rgba(255,255,255,0.06)"}`,
                            fontSize: "0.82rem",
                            color: checked ? "#ffffff" : "rgba(255,255,255,0.6)",
                          }}
                        >
                          {checked ? <CheckSquare size={16} color="#d4af37" /> : <Square size={16} />}
                          <span>{page.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setEditingSubadmin(null)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "none",
                    borderRadius: "10px",
                    padding: "0.65rem 1.25rem",
                    color: "rgba(255,255,255,0.7)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  style={{
                    background: "var(--color-gold, #d4af37)",
                    border: "none",
                    borderRadius: "10px",
                    padding: "0.65rem 1.4rem",
                    color: "#000000",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}