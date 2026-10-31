"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/admin/Sidebar"; // Adjust path if your Sidebar is located elsewhere
import { Menu } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [role, setRole] = useState<"admin" | "subadmin">("admin");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem("rakvih_admin_role");
    if (storedRole === "admin" || storedRole === "subadmin") {
      setRole(storedRole);
    }
  }, []);

  return (
    // overflow-x-hidden is the fix that was missing — without it, any
    // descendant that overflows (like the orders table) creates page-level
    // horizontal scroll, and since Sidebar is position:fixed, it stays put
    // while the content scrolls under it — that's exactly what your
    // screenshots show.
    <div
      className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0a0a] text-white"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Sidebar Component with Role and Mobile Drawer State */}
      <Sidebar
        role={role}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Wrapper (Reserves 272px space on large screens) */}
      <div className="exec-admin-main flex flex-col min-h-screen min-w-0">

        {/* Mobile Header Bar (Visible on mobile/tablet to toggle the drawer) */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 border border-white/10 transition-colors"
              aria-label="Open Sidebar Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/admin/dashboard" className="flex items-center" aria-label="RAKVIH Admin Dashboard">
              <Image
                src="/rakvih-logo.png"
                alt="RAKVIH Originals"
                width={140}
                height={18}
                priority
                className="h-[18px] sm:h-5 w-auto object-contain"
              />
            </Link>
          </div>
          <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-[#c4a174] uppercase px-2.5 py-1 rounded-full bg-[#c4a174]/10 border border-[#c4a174]/20">
            {role === "admin" ? "Console" : "Subadmin"}
          </span>
        </header>

        {/* Main Body Children Container */}
        <main className="flex-1 min-w-0 p-5 md:p-7 lg:p-8">
          <div className="w-full max-w-none mx-0 space-y-6 min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}