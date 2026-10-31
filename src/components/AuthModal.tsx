"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Gem, Mail, Lock, User, Eye, EyeOff, X, ArrowRight, ShieldCheck } from "lucide-react";

type Tab = "signin" | "signup";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: Tab;
}

export default function AuthModal({
  isOpen,
  onClose,
  defaultTab = "signin",
}: AuthModalProps) {
  const { setSessionUser } = useAuth();

  const [tab, setTab] = useState<Tab>(defaultTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setError(null);
    }
  }, [isOpen, defaultTab]);

  // Lock body scroll + close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (tab === "signup") {
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (cleanPassword.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (cleanPassword !== confirmPassword.trim()) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (tab === "signup") {
        const { data: existing, error: lookupError } = await supabase
          .from("users")
          .select("id")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (lookupError) throw lookupError;
        if (existing) {
          setError("An account with this email already exists.");
          setLoading(false);
          return;
        }

        const passwordHash = await bcrypt.hash(cleanPassword, 10);

        const { data: inserted, error: insertError } = await supabase
          .from("users")
          .insert({
            name: name.trim(),
            email: cleanEmail,
            password: passwordHash,
          })
          .select("id, email, name")
          .single();

        if (insertError) throw insertError;

        setSessionUser(inserted);
        onClose();
      } else {
        const { data: row, error: fetchError } = await supabase
          .from("users")
          .select("id, email, name, password")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!row) {
          setError("No account found with this email.");
          setLoading(false);
          return;
        }

        const passwordMatches = await bcrypt.compare(cleanPassword, row.password);
        if (!passwordMatches) {
          setError("Invalid password.");
          setLoading(false);
          return;
        }

        setSessionUser({ id: row.id, email: row.email, name: row.name });
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setError("Unable to complete request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(5, 4, 3, 0.86)",
        backdropFilter: "blur(14px)",
        padding: "1.25rem",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth: "28rem",
          position: "relative",
          background: "linear-gradient(180deg, #14120e 0%, #0a0907 100%)",
          border: "1px solid rgba(212, 175, 55, 0.28)",
          borderRadius: "22px",
          padding: "2.5rem 2.25rem 2rem",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 45px -10px rgba(212, 175, 55, 0.15)",
          overflow: "hidden",
        }}
      >
        {/* Subtle Ambient Gold Radiance */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255, 255, 255, 0.5)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#d4af37";
            e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
          }}
        >
          <X size={15} />
        </button>

        {/* Clean Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Image
            src="/rakvih-logo.png"
            alt="RAKVIH Originals"
            width={200}
            height={25}
            priority
            style={{ height: "26px", width: "auto", objectFit: "contain", marginBottom: "8px" }}
          />
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-gold)", fontWeight: 600 }}>
            Private Client Portal
          </span>
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: "flex",
            background: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "1.5rem",
          }}
        >
          {(["signin", "signup"] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setError(null);
                }}
                style={{
                  flex: 1,
                  padding: "0.6rem 0",
                  background: active
                    ? "linear-gradient(180deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.08) 100%)"
                    : "transparent",
                  border: active ? "1px solid rgba(212, 175, 55, 0.45)" : "1px solid transparent",
                  borderRadius: "9px",
                  color: active ? "#ffffff" : "rgba(255, 255, 255, 0.45)",
                  fontFamily: "var(--font-heading, inherit)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  boxShadow: active ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
                }}
              >
                {t === "signin" ? "Sign In" : "Register"}
              </button>
            );
          })}
        </div>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#fca5a5",
              fontSize: "0.78rem",
              padding: "0.65rem 0.85rem",
              borderRadius: "10px",
              marginBottom: "1.25rem",
              lineHeight: 1.4,
            }}
          >
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {tab === "signup" && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.68rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255, 255, 255, 0.65)",
                  marginBottom: "0.4rem",
                  fontWeight: 600,
                }}
              >
                Full Name
              </label>
              <div style={{ position: "relative" }}>
                <User
                  size={15}
                  style={{
                    position: "absolute",
                    left: "0.85rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(212, 175, 55, 0.7)",
                  }}
                />
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.025)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "10px",
                    padding: "0.7rem 0.85rem 0.7rem 2.4rem",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#d4af37")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)")}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.68rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.65)",
                marginBottom: "0.4rem",
                fontWeight: 600,
              }}
            >
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={15}
                style={{
                  position: "absolute",
                  left: "0.85rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(212, 175, 55, 0.7)",
                }}
              />
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "10px",
                  padding: "0.7rem 0.85rem 0.7rem 2.4rem",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#d4af37")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)")}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.68rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.65)",
                marginBottom: "0.4rem",
                fontWeight: 600,
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={15}
                style={{
                  position: "absolute",
                  left: "0.85rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(212, 175, 55, 0.7)",
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "10px",
                  padding: "0.7rem 2.4rem 0.7rem 2.4rem",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#d4af37")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)")}
                autoComplete={tab === "signin" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.4)",
                  cursor: "pointer",
                  display: "flex",
                  padding: "2px",
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {tab === "signup" && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.68rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255, 255, 255, 0.65)",
                  marginBottom: "0.4rem",
                  fontWeight: 600,
                }}
              >
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <ShieldCheck
                  size={15}
                  style={{
                    position: "absolute",
                    left: "0.85rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(212, 175, 55, 0.7)",
                  }}
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.025)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "10px",
                    padding: "0.7rem 2.4rem 0.7rem 2.4rem",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#d4af37")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)")}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.4)",
                    cursor: "pointer",
                    display: "flex",
                    padding: "2px",
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.75rem",
              background: "linear-gradient(135deg, #e8c872 0%, #c59b39 50%, #b08726 100%)",
              color: "#0a0907",
              border: "none",
              borderRadius: "11px",
              padding: "0.85rem",
              fontFamily: "var(--font-heading, inherit)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontSize: "0.76rem",
              fontWeight: 800,
              cursor: loading ? "default" : "pointer",
              boxShadow: "0 4px 20px rgba(212, 175, 55, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.25s ease",
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{tab === "signin" ? "Sign In" : "Create Account"}</span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>

        {/* Bottom Toggle Prompt */}
        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "0.74rem", color: "rgba(255, 255, 255, 0.45)" }}>
            {tab === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setTab(tab === "signin" ? "signup" : "signin");
                setError(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#d4af37",
                cursor: "pointer",
                padding: 0,
                fontSize: "inherit",
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              {tab === "signin" ? "Register" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}