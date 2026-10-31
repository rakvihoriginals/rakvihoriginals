import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const PRIMARY_ADMIN_EMAIL = "rakvihoriginals@gmail.com";

const ALL_PORTAL_PAGES = [
  "/admin/dashboard",
  "/admin/listbrands",
  "/admin/categorysetup",
  "/admin/products",
  "/admin/orders",
  "/admin/createsub",
  "/admin/users",
];

// Helper function to initialize Supabase at runtime, preventing build-time crashes
const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// 1. GET: Fetch all admins/subadmins
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("rakvih_subadmins")
      .select("id, email, role, allowed_routes, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, subadmins: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Fetch failed" }, { status: 500 });
  }
}

// 2. POST: Create subadmin with specific page permissions
export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    const { email, password, role, allowed_routes } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const routes =
      role === "admin"
        ? ALL_PORTAL_PAGES
        : allowed_routes && allowed_routes.length > 0
        ? allowed_routes
        : ["/admin/dashboard"];

    const { data, error } = await supabase
      .from("rakvih_subadmins")
      .insert([
        {
          email: cleanEmail,
          password: hashedPassword,
          role: role || "subadmin",
          allowed_routes: routes,
        },
      ])
      .select("id, email, role, allowed_routes, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, subadmin: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create subadmin" },
      { status: 500 }
    );
  }
}

// 3. PATCH: Edit role and page access
export async function PATCH(request: Request) {
  try {
    const supabase = getSupabase();
    const { id, role, allowed_routes } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const routes =
      role === "admin"
        ? ALL_PORTAL_PAGES
        : allowed_routes && allowed_routes.length > 0
        ? allowed_routes
        : ["/admin/dashboard"];

    const { data, error } = await supabase
      .from("rakvih_subadmins")
      .update({
        role,
        allowed_routes: routes,
      })
      .eq("id", id)
      .select("id, email, role, allowed_routes, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, subadmin: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update permissions" },
      { status: 500 }
    );
  }
}

// 4. DELETE: Remove subadmin (protects primary owner)
export async function DELETE(request: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Subadmin ID is required." }, { status: 400 });
    }

    const { data: targetUser, error: checkErr } = await supabase
      .from("rakvih_subadmins")
      .select("email")
      .eq("id", id)
      .single();

    if (checkErr || !targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (targetUser.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: "Master Owner Admin cannot be deleted." },
        { status: 403 }
      );
    }

    const { error: deleteErr } = await supabase
      .from("rakvih_subadmins")
      .delete()
      .eq("id", id);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully." });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete subadmin." },
      { status: 500 }
    );
  }
}