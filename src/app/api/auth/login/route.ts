import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    // Initialize Supabase inside the handler to prevent Next.js build-time crashes
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error.",
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Get user directly from users table
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error(error);
      return NextResponse.json(
        {
          success: false,
          error: "Could not process login.",
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account has been disabled.",
        },
        { status: 403 }
      );
    }

    // Compare password
    const passwordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!passwordCorrect) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // Never send password hash to browser
    const { password_hash, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while signing in.",
      },
      { status: 500 }
    );
  }
}