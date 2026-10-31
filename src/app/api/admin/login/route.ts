import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

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

export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Fetch user AND allowed_routes
    const { data: admin, error } = await supabase
      .from("rakvih_subadmins")
      .select("id, email, password, role, allowed_routes")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (error || !admin) {
      return NextResponse.json(
        { error: "Invalid credentials or unauthorized portal access." },
        { status: 401 }
      );
    }

    let isMatch = false;
    const dbPassword = (admin.password || "").trim();

    if (dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(cleanPassword, dbPassword);
    } else {
      isMatch = dbPassword === cleanPassword;
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Return user with allowed_routes (fallback to dashboard if empty)
    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        allowed_routes:
          admin.allowed_routes && admin.allowed_routes.length > 0
            ? admin.allowed_routes
            : ["/admin/dashboard"],
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal authentication error." },
      { status: 500 }
    );
  }
}