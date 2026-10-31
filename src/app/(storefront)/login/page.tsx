"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const { login, register, isAuthenticated, user, customer, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sign in state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const res = await login(signInEmail, signInPassword);
    setIsLoading(false);

    if (res.success) {
      router.push(redirectUrl);
    } else {
      setErrorMsg(res.error || "Invalid credentials. Please check your email and password.");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (signUpPassword !== signUpConfirm) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    const res = await register(signUpName, signUpEmail, signUpPassword, signUpPhone);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg("Account created successfully! Welcome to RAKVIH Originals.");
      setTimeout(() => {
        router.push(redirectUrl);
      }, 1500);
    } else {
      setErrorMsg(res.error || "Could not register account. Please try again.");
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="auth-card-wrap" style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <span className="brand-gold-badge" style={{ marginBottom: "1rem" }}>
          VIP Member Authenticated
        </span>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "#ffffff", marginBottom: "0.5rem" }}>
          Welcome back, {customer?.name || user?.email?.split("@")[0] || "VIP Member"}
        </h2>
        <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "2rem" }}>
          You have full access to your saved wishlist, private salon appointments, and shopping bag.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/cart" className="hero-cta-pill">
            View Shopping Bag
          </Link>
          <Link href="/wishlist" className="quickview-appointment-btn">
            View Wishlist
          </Link>
          <button
            type="button"
            onClick={logout}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              padding: "0.85rem 1.75rem",
              borderRadius: "999px",
              cursor: "pointer",
              fontFamily: "var(--font-heading)",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card-wrap">
      {/* Brand Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "center" }}>
          <Image
            src="/rakvih-logo.png"
            alt="RAKVIH Originals"
            width={240}
            height={30}
            priority
            style={{ height: "32px", width: "auto", objectFit: "contain" }}
          />
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "#ffffff", marginBottom: "0.5rem" }}>
          {activeTab === "signin" ? "Sign In To Your Vault" : "Create VIP Membership"}
        </h1>
        <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.88rem" }}>
          Access exclusive drops, save your bespoke wishlist, and enjoy private concierge checkout.
        </p>
      </div>

      {/* Auth Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "rgba(255, 255, 255, 0.04)", padding: "6px", borderRadius: "999px", marginBottom: "2rem", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <button
          type="button"
          onClick={() => { setActiveTab("signin"); setErrorMsg(null); }}
          style={{
            background: activeTab === "signin" ? "var(--color-gold)" : "transparent",
            color: activeTab === "signin" ? "#0c0a06" : "rgba(255, 255, 255, 0.7)",
            border: "none",
            padding: "0.6rem",
            borderRadius: "999px",
            fontFamily: "var(--font-heading)",
            fontSize: "0.75rem",
            fontWeight: 800,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("signup"); setErrorMsg(null); }}
          style={{
            background: activeTab === "signup" ? "var(--color-gold)" : "transparent",
            color: activeTab === "signup" ? "#0c0a06" : "rgba(255, 255, 255, 0.7)",
            border: "none",
            padding: "0.6rem",
            borderRadius: "999px",
            fontFamily: "var(--font-heading)",
            fontSize: "0.75rem",
            fontWeight: 800,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          Create Account
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div style={{ background: "rgba(231, 76, 60, 0.15)", border: "1px solid rgba(231, 76, 60, 0.4)", color: "#e74c3c", padding: "0.85rem 1.25rem", borderRadius: "12px", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: "rgba(46, 204, 113, 0.15)", border: "1px solid rgba(46, 204, 113, 0.4)", color: "#2ecc71", padding: "0.85rem 1.25rem", borderRadius: "12px", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
          {successMsg}
        </div>
      )}

      {/* SIGN IN FORM */}
      {activeTab === "signin" ? (
        <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.5rem", fontWeight: 700 }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              placeholder="name@example.com"
              className="filter-input-glass"
              style={{ width: "100%", borderRadius: "12px", padding: "0.85rem 1.25rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.5rem", fontWeight: 700 }}>
              Password
            </label>
            <input
              type="password"
              required
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              placeholder="••••••••••••"
              className="filter-input-glass"
              style={{ width: "100%", borderRadius: "12px", padding: "0.85rem 1.25rem" }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="hero-cta-pill"
            style={{ marginTop: "1rem", width: "100%", padding: "1rem", cursor: isLoading ? "not-allowed" : "pointer" }}
          >
            {isLoading ? "Authenticating..." : "Sign In to VIP Vault"}
          </button>
        </form>
      ) : (
        /* SIGN UP FORM */
        <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.5rem", fontWeight: 700 }}>
              Full Name
            </label>
            <input
              type="text"
              required
              value={signUpName}
              onChange={(e) => setSignUpName(e.target.value)}
              placeholder="e.g. Devendra Verma"
              className="filter-input-glass"
              style={{ width: "100%", borderRadius: "12px", padding: "0.85rem 1.25rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.5rem", fontWeight: 700 }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              placeholder="name@example.com"
              className="filter-input-glass"
              style={{ width: "100%", borderRadius: "12px", padding: "0.85rem 1.25rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.5rem", fontWeight: 700 }}>
              Phone (Optional)
            </label>
            <input
              type="tel"
              value={signUpPhone}
              onChange={(e) => setSignUpPhone(e.target.value)}
              placeholder="+91 98200 00000"
              className="filter-input-glass"
              style={{ width: "100%", borderRadius: "12px", padding: "0.85rem 1.25rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.5rem", fontWeight: 700 }}>
              Password
            </label>
            <input
              type="password"
              required
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="filter-input-glass"
              style={{ width: "100%", borderRadius: "12px", padding: "0.85rem 1.25rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--font-heading)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.5rem", fontWeight: 700 }}>
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={signUpConfirm}
              onChange={(e) => setSignUpConfirm(e.target.value)}
              placeholder="Re-enter password"
              className="filter-input-glass"
              style={{ width: "100%", borderRadius: "12px", padding: "0.85rem 1.25rem" }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="hero-cta-pill"
            style={{ marginTop: "1rem", width: "100%", padding: "1rem", cursor: isLoading ? "not-allowed" : "pointer" }}
          >
            {isLoading ? "Creating Account..." : "Create VIP Account"}
          </button>
        </form>
      )}

      {/* Atelier note */}
      <div style={{ textAlign: "center", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <p style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.5)" }}>
          Need assistance or private salon appointment?{" "}
          <Link href="/contact" style={{ color: "var(--color-gold)", textDecoration: "underline" }}>
            Contact VIP Concierge
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function StorefrontLoginPage() {
  return (
    <main className="subpage-wrapper" style={{ minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 1.5rem" }}>
      <div style={{ maxWidth: "480px", width: "100%" }}>
        <Suspense fallback={<div style={{ textAlign: "center", color: "var(--color-gold)" }}>Loading VIP Access...</div>}>
          <LoginFormContent />
        </Suspense>
      </div>
    </main>
  );
}
