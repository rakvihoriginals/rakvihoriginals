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

    const {
      fullName,
      email,
      phone,
      password,
    } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Full name, email and password are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // Check existing user
    const { data: existingUser, error: checkError } =
      await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

    if (checkError) {
      console.error(checkError);

      return NextResponse.json(
        {
          success: false,
          error:
            "Could not check existing account.",
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "An account already exists with this email.",
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash =
      await bcrypt.hash(password, 12);

    // Insert directly into users table
    const { data: newUser, error: insertError } =
      await supabaseAdmin
        .from("users")
        .insert({
          full_name: fullName.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || null,
          password_hash: passwordHash,
          role: "customer",
        })
        .select(
          `
          id,
          full_name,
          email,
          phone,
          role,
          created_at
        `
        )
        .single();

    if (insertError) {
      console.error(insertError);

      return NextResponse.json(
        {
          success: false,
          error:
            "Could not create your account.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Something went wrong while creating the account.",
      },
      { status: 500 }
    );
  }
}