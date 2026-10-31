"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingCart,
  Users,
  Shield,
  Lock,
  LogOut,
  LayoutDashboard,
  Tag,
  Layers,
  Package,
  X,
  ChevronRight,
} from "lucide-react";

interface SubMenuItem {
  label: string;
  href: string;
}

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  subMenu?: SubMenuItem[];
}

interface SidebarProps {
  role: "admin" | "subadmin";
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ role, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [allowedRoutes, setAllowedRoutes] = useState<string[]>([]);

  // Load allowed routes from session
  useEffect(() => {
    try {
      const stored = localStorage.getItem("rakvih_admin_routes");
      if (stored) {
        setAllowedRoutes(JSON.parse(stored));
      }
    } catch {
      setAllowedRoutes([]);
    }
  }, []);

  const menu: MenuItem[] = [
    { 
      label: "OVERVIEW", 
      href: "/admin/dashboard", 
      icon: <LayoutDashboard size={16} strokeWidth={1.5} /> 
    },
    { 
      label: "List Brands", 
      href: "/admin/listbrands", 
      icon: <Tag size={16} strokeWidth={1.5} /> 
    },
    { 
      label: "Category", 
      href: "/admin/categorysetup", 
      icon: <Layers size={16} strokeWidth={1.5} /> 
    },
    { 
      label: "PRODUCTS", 
      href: "/admin/products", 
      icon: <Package size={16} strokeWidth={1.5} /> 
    },
    { 
      label: "ORDERS", 
      href: "/admin/orders", 
      icon: <ShoppingCart size={16} strokeWidth={1.5} /> 
    },
    { 
      label: "ADMINS", 
      href: "/admin/createsub", 
      icon: <Lock size={16} strokeWidth={1.5} /> 
    },
    { 
      label: "USERS", 
      href: "/admin/users", 
      icon: <Users size={16} strokeWidth={1.5} /> 
    },
  ];

  // Dynamic filtering:
  // 1. Admin gets all items
  // 2. Subadmin only sees items present in allowedRoutes (and never sees ADMINS)
  const filteredMenu = menu.filter((item) => {
    if (role === "admin") return true;

    // Subadmins never get access to ADMINS creation
    if (item.label === "ADMINS") return false;

    // Check if subadmin has permission for this item's href
    if (item.href) {
      return allowedRoutes.includes(item.href);
    }

    // Check if subadmin has permission for any sub-items
    if (item.subMenu) {
      return item.subMenu.some((sub) => allowedRoutes.includes(sub.href));
    }

    return false;
  });

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();

    // 1. Purge all admin session data
    localStorage.removeItem("rakvih_admin_role");
    localStorage.removeItem("rakvih_admin_email");
    localStorage.removeItem("rakvih_admin_id");
    localStorage.removeItem("rakvih_admin_routes");
    sessionStorage.clear();

    if (onCloseMobile) onCloseMobile();

    // 2. Hard redirect to the Admin Login portal (not public store login)
    // If your route is `/admin/login`, change the string below accordingly
    window.location.href = "/admin-login";
  };

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      <aside className={`exec-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="exec-sidebar-glow-top" />
        <div className="exec-sidebar-glow-bottom" />

        {/* Header */}
        <div className="exec-sidebar-header">
          <div className="flex items-start justify-between">
            <Link href="/admin/dashboard" className="exec-sidebar-badge" style={{ padding: "0.6rem 1.2rem" }}>
              <Image
                src="/rakvih-logo.png"
                alt="RAKVIH Originals"
                width={140}
                height={18}
                style={{ height: "18px", width: "auto", objectFit: "contain" }}
              />
            </Link>

            <button onClick={onCloseMobile} className="exec-sidebar-close-btn lg:hidden">
              <X size={18} />
            </button>
          </div>

          <div className="exec-sidebar-portal-row">
            <span className="exec-sidebar-portal-icon">
              <Shield size={11} strokeWidth={2} />
            </span>
            <span className="exec-sidebar-portal-label">
              {role === "admin" ? "Executive Portal (Owner)" : "Subadmin Portal"}
            </span>
          </div>
        </div>

        <div className="exec-sidebar-divider" />

        {/* Nav */}
        <nav className="exec-sidebar-nav no-scrollbar">
          <div className="exec-sidebar-nav-list">
            {filteredMenu.map((item) => {
              const isActive = pathname === item.href;
              const isChildActive = item.subMenu?.some((s) => pathname === s.href) ?? false;
              const isHighlighted = isActive || isChildActive;
              const isOpen = openMenu === item.label;

              return (
                <div key={item.label}>
                  {item.subMenu ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpenMenu(isOpen ? null : item.label)}
                        className={`exec-nav-item ${isHighlighted ? "active" : ""}`}
                      >
                        <span className="exec-nav-item-left">
                          <span className="exec-nav-icon">{item.icon}</span>
                          <span className="exec-nav-label">{item.label}</span>
                        </span>
                        <ChevronRight
                          size={13}
                          className={`exec-nav-chevron ${isOpen ? "open" : ""}`}
                        />
                      </button>

                      <div className={`exec-submenu ${isOpen ? "open" : ""}`}>
                        <div className="exec-submenu-track">
                          {item.subMenu
                            .filter((sub) =>
                              role === "admin" ? true : allowedRoutes.includes(sub.href)
                            )
                            .map((sub) => {
                              const subActive = pathname === sub.href;
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  onClick={onCloseMobile}
                                  className={`exec-submenu-link ${subActive ? "active" : ""}`}
                                >
                                  {sub.label}
                                </Link>
                              );
                            })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href!}
                      onClick={onCloseMobile}
                      className={`exec-nav-item ${isActive ? "active" : ""}`}
                    >
                      <span className="exec-nav-item-left">
                        <span className="exec-nav-icon">{item.icon}</span>
                        <span className="exec-nav-label">{item.label}</span>
                      </span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer with Dedicated Logout Action */}
        <div className="exec-sidebar-footer">
          <button
            type="button"
            onClick={handleLogout}
            className="exec-end-session-btn"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <LogOut size={14} strokeWidth={2} />
            <span>End Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}