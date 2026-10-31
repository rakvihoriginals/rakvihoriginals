"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import AdminHeader from "./AdminHeader";

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

  const handleToggleRole = (newRole: "admin" | "subadmin") => {
    setRole(newRole);
    localStorage.setItem("rakvih_admin_role", newRole);
  };

  return (
    <div className="relative min-h-screen flex overflow-hidden bg-[#f5f3f0]" style={{ fontFamily: "var(--font-body)" }}>
      <Sidebar
        role={role}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Added min-w-0 to prevent tables from blowing out the layout width */}
      <div className="exec-admin-main flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        <AdminHeader
          role={role}
          onToggleRole={handleToggleRole}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-5 md:p-7 lg:p-8">
          <div className="w-full max-w-[1400px] mx-auto space-y-6 min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}