"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, User, Heart, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

const PORTAL_ROUTES = [
  "/dashboard", "/brands", "/categorysetup", "/products", "/attribute",
  "/coupons", "/payments", "/orderupdate", "/pos", "/productreport",
  "/orderreport", "/hero", "/header", "/middle", "/bottom", "/insta",
  "/about-top", "/about-identity", "/about-bottom", "/review", "/site-info",
  "/videos-admin", "/createsub", "/messages", "/customer",
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { isAuthenticated, cartCount, wishlistCount, logout, user, customer } = useAuth();

  const isPortal = pathname ? PORTAL_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/")) : false;

  const displayName = customer?.name || (user?.email ? user.email.split("@")[0] : "VIP Member");

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll only for mobile drawer
  useEffect(() => {
    if (menuOpen && window.innerWidth <= 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // NAVIGATION ITEMS: All Collections & The Original Hub replacing Fashion Studio & Videos removed
  const navItems = [
    { name: "Home", href: "/" },
    { name: "All Collections", href: "/collection-hub" },
    { name: "The Original Hub", href: "/original-hub" },
    { name: "Handbags", href: "/handbags" },
    { name: "Footwear", href: "/footwear" },
    { name: "Belts", href: "/belts" },
    { name: "Stoles", href: "/stoles" },
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
  ];

  if (isPortal) return null;

  return (
    <>
      {/* ── DESKTOP HEADER WITH LEFT BRAND TITLE & RIGHT EXPANDING DRAWER ── */}
      <header className={`desktop-header-bar ${scrolled ? "is-scrolled" : ""}`}>
        <div className="desktop-header-inner flex items-center justify-between w-full">
          {/* Left Corner: Official Brand Logo */}
          <Link href="/" className="header-brand-mark" aria-label="RAKVIH Originals">
            <Image
              src="/rakvih-logo.png"
              alt="RAKVIH Originals"
              width={184}
              height={23}
              priority
              className="header-brand-logo-img"
            />
          </Link>

          {/* Right Side: Horizontal Expanding Drawer & Actions */}
          <div className="flex items-center gap-6">
            
            {/* Quick Actions (Cart & Wishlist visible ONLY after login) */}
            <div className="flex items-center gap-3 text-white pointer-events-auto">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/wishlist"
                    className="desktop-action-icon-btn relative"
                    title="Saved Wishlist"
                  >
                    <Heart size={16} />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-gold text-brand-blue text-[9px] font-bold rounded-full flex items-center justify-center shadow-md">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/cart"
                    className="desktop-action-icon-btn relative"
                    title="Shopping Bag"
                  >
                    <ShoppingCart size={16} />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-gold text-brand-blue text-[9px] font-bold rounded-full flex items-center justify-center shadow-md">
                        {cartCount}
                      </span>
                    )}
                  </Link>

                  {/* Desktop User Name & Dropdown */}
                  <div className="relative user-dropdown-container">
                    <button
                      type="button"
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="desktop-user-pill-btn"
                      aria-label="User account menu"
                    >
                      <div className="desktop-avatar-circle">
                        <User size={13} className="text-brand-gold" />
                      </div>
                      <span className="desktop-user-display-name truncate">
                        {displayName}
                      </span>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={`transition-transform duration-200 ${
                          userDropdownOpen ? "rotate-180 text-brand-gold" : "opacity-60"
                        }`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>

                    {/* Luxury Dropdown Menu */}
                    {userDropdownOpen && (
                      <div className="desktop-user-dropdown-menu">
                        <div className="dropdown-user-header">
                          <span className="dropdown-vip-pill">VIP PATRON</span>
                          <div className="dropdown-user-name truncate">
                            {displayName}
                          </div>
                          <div className="dropdown-user-email truncate">
                            {user?.email}
                          </div>
                        </div>

                        <div className="dropdown-menu-divider" />

                        <Link
                          href="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="dropdown-menu-item"
                        >
                          <User size={14} className="text-brand-gold" />
                          <span>My Profile & Orders</span>
                        </Link>

                        <div className="dropdown-menu-divider" />

                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="dropdown-menu-item dropdown-exit-item w-full text-left"
                        >
                          <LogOut size={14} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="desktop-user-pill-btn text-xs font-bold uppercase tracking-wider hover:text-brand-gold"
                >
                  <div className="desktop-avatar-circle">
                    <User size={13} className="text-brand-gold" />
                  </div>
                  <span>Login / Register</span>
                </button>
              )}
            </div>

            <div className={`header-drawer-wrapper right-drawer ${menuOpen ? "drawer-expanded" : ""}`}>
              {/* The Horizontal Drawer that smoothly expands to the left */}
              <div className="horizontal-nav-drawer" aria-hidden={!menuOpen}>
                <div className="horizontal-drawer-track">
                  <nav className="horizontal-nav-list">
                    {navItems.map((item) => {
                      const isCurrent = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`h-nav-link ${isCurrent ? "is-active" : ""}`}
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className="h-nav-label">{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* The 3-Stripe Trigger Button */}
              <button
                type="button"
                className={`drawer-trigger-stripe ${menuOpen ? "active" : ""}`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                <div className="stripe-stack">
                  <span className="h-stripe h-stripe-1"></span>
                  <span className="h-stripe h-stripe-2"></span>
                  <span className="h-stripe h-stripe-3"></span>
                </div>
                {!menuOpen && <span className="drawer-btn-text">MENU</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE HEADER (MOBILE ONLY) ── */}
      <div className="mobile-header-bar">
        {/* Left: Official Brand Logo */}
        <Link href="/" className="header-brand-mark mobile-header-brand" aria-label="RAKVIH Originals">
          <Image
            src="/rakvih-logo.png"
            alt="RAKVIH Originals"
            width={144}
            height={18}
            priority
            className="header-brand-logo-img"
          />
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <>
              <Link href="/wishlist" className="mobile-header-icon-btn relative text-white" aria-label="Wishlist">
                <Heart size={18} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-gold text-brand-blue text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link href="/cart" className="mobile-header-icon-btn relative text-white" aria-label="Shopping Bag">
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-gold text-brand-blue text-[9px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}

          <button
            type="button"
            className={`mobile-stripe-btn ${menuOpen ? "is-open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle mobile menu"
          >
            <div className="stripe-stack">
              <span className="h-stripe h-stripe-1"></span>
              <span className="h-stripe h-stripe-2"></span>
              <span className="h-stripe h-stripe-3"></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Slide-In Sidebar (Mobile only) */}
      <div className={`mobile-sidebar-drawer ${menuOpen ? "mobile-drawer-open" : ""}`}>
        <div className="mobile-backdrop" onClick={() => setMenuOpen(false)}></div>
        <aside className="mobile-sidebar-panel">
          {/* Top Bar */}
          <div className="mobile-sidebar-top">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="header-brand-mark mobile-sidebar-brand-mark"
              aria-label="RAKVIH Originals"
            >
              <Image
                src="/rakvih-logo.png"
                alt="RAKVIH Originals"
                width={136}
                height={17}
                className="header-brand-logo-img"
              />
            </Link>
            <button
              type="button"
              className="mobile-close-btn"
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation"
            >
              ✕
            </button>
          </div>

          {/* User Account Section (Top Highlight) */}
          <div className="mobile-auth-section">
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setAuthOpen(true);
                }}
                className="mobile-auth-login-card"
              >
                <div className="mobile-auth-icon-circle">
                  <User size={18} className="text-brand-gold" />
                </div>
                <div className="text-left">
                  <div className="mobile-auth-main-text">LOGIN / SIGN UP</div>
                  <div className="mobile-auth-sub-text">Access VIP Concierge & Orders</div>
                </div>
                <span className="mobile-auth-arrow">→</span>
              </button>
            ) : (
              <div className="mobile-user-profile-card">
                <div className="flex items-center gap-3">
                  <div className="mobile-user-avatar-circle">
                    <User size={18} className="text-brand-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="mobile-vip-badge">VIP PATRON</span>
                    </div>
                    <h4 className="mobile-user-name truncate">
                      {customer?.name || (user?.email ? user.email.split("@")[0] : "VIP Member")}
                    </h4>
                    <p className="mobile-user-email truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="mobile-user-quick-links">
                  <Link
                    href="/profile"
                    className="mobile-quick-link-btn"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>Profile & Orders</span>
                    <span>→</span>
                  </Link>
                  <Link
                    href="/wishlist"
                    className="mobile-quick-link-btn"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>Wishlist ({wishlistCount})</span>
                    <span>→</span>
                  </Link>
                  <Link
                    href="/cart"
                    className="mobile-quick-link-btn"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>Shopping Bag ({cartCount})</span>
                    <span>→</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="mobile-quick-link-btn text-rose-400 hover:text-rose-300"
                  >
                    <span>Sign Out</span>
                    <LogOut size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Main Navigation List */}
          <ul className="mobile-sidebar-list">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`mobile-sidebar-link ${pathname === item.href ? "is-active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="mobile-nav-title">{item.name}</span>
                  <span className="mobile-nav-arrow">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Login / Sign Up popup — triggered from either the desktop pill or the mobile drawer card above */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab="signin" />
    </>
  );
}