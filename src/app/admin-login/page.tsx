"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      // 1. Dispatch authentication check to the server-side bcrypt route
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid credentials or unauthorized portal access.");
      }

      // 2. Persist session, role, and granular route access
      const assignedRole = data.user?.role?.toLowerCase() === "admin" ? "admin" : "subadmin";
      localStorage.setItem("rakvih_admin_role", assignedRole);
      localStorage.setItem("rakvih_admin_email", data.user?.email || cleanEmail);
      localStorage.setItem("rakvih_admin_id", data.user?.id || "");

      // Ensure routes are stored for sidebar filtering
      const permittedRoutes =
        data.user?.allowed_routes && data.user.allowed_routes.length > 0
          ? data.user.allowed_routes
          : ["/admin/dashboard"];
      localStorage.setItem("rakvih_admin_routes", JSON.stringify(permittedRoutes));

      // 3. Redirect to Admin Dashboard
      router.push("/admin/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Background ambient gold glows */}
      <div className="login-glow login-glow--top" />
      <div className="login-glow login-glow--bottom" />

      <div className="login-container">
        {/* Brand Header */}
        <div className="login-brand" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Image
            src="/rakvih-logo.png"
            alt="RAKVIH Originals"
            width={240}
            height={30}
            priority
            style={{ height: "32px", width: "auto", objectFit: "contain", marginBottom: "12px" }}
          />
          <p className="login-brand-tag">Executive Portal &amp; Atelier Console</p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="login-card-highlight" />

          {/* Error Message banner */}
          {errorMessage && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                fontSize: "0.85rem",
                marginBottom: "1.25rem",
                textAlign: "center",
              }}
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div>
              <label className="login-field-label">
                Executive Credential (Email)
              </label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="login-input"
                  placeholder="name@domain.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="login-field-head">
                <label className="login-field-label">Security Passcode</label>
              </div>
              <div className="login-input-wrap" style={{ position: "relative" }}>
                <Lock size={16} className="login-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="login-input"
                  placeholder="Enter your security passcode"
                  autoComplete="current-password"
                  style={{ paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255, 255, 255, 0.5)",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#d4af37")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)")}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
            >
              {loading ? (
                <span>Authenticating Atelier Token...</span>
              ) : (
                <>
                  <span>Authorize Access</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to Boutique */}
        <div className="login-back-wrap">
          <Link href="/" className="login-back-link">
            <span>← Return to Public Boutique</span>
          </Link>
        </div>
      </div>
    </div>
  );
}