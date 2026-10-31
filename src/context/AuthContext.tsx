"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import bcrypt from "bcryptjs";

import { supabase } from "@/lib/supabase";

import {
  StoreProduct,
  ProductVariant,
} from "@/lib/fetchProducts";

/* =====================================================
   TYPES
===================================================== */

export interface CartItem {
  product: StoreProduct;
  variant?: ProductVariant;
  quantity: number;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  is_blocked?: boolean;
  created_at?: string;
  last_sign_in_at?: string | null;
  // `password` (hashed) lives on this row in the DB but is intentionally
  // stripped out before it ever touches React state — see `stripPassword`.
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  customer: CustomerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  cart: CartItem[];
  wishlist: StoreProduct[];

  cartCount: number;
  wishlistCount: number;
  cartSubtotal: number;

  login: (
    email: string,
    password: string
  ) => Promise<AuthResult>;

  register: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<AuthResult>;

  /**
   * Lightweight session sync for auth flows that live OUTSIDE this
   * context (e.g. a self-contained modal querying its own `users`
   * table). It does NOT hash/verify anything or touch Supabase — it
   * just takes a row you've already authenticated elsewhere and
   * mirrors it into shared state (user/customer + localStorage
   * session pointer), which is what drives the header, cart and
   * wishlist. Pass whatever row you fetched; `password` (if present)
   * is stripped automatically.
   */
  setSessionUser: (
    profile: { id: string; email: string; [key: string]: any }
  ) => void;

  logout: () => Promise<void>;

  addToCart: (
    product: StoreProduct,
    variant?: ProductVariant,
    quantity?: number
  ) => boolean;

  removeFromCart: (
    productId: number | string,
    variantId?: number | string
  ) => void;

  updateCartQuantity: (
    productId: number | string,
    quantity: number,
    variantId?: number | string
  ) => void;

  clearCart: () => void;

  toggleWishlist: (
    product: StoreProduct
  ) => boolean;

  isInWishlist: (
    productId: number | string
  ) => boolean;
}

/* =====================================================
   CONTEXT
===================================================== */

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

/* =====================================================
   STORAGE KEYS
   Cart & wishlist are scoped PER USER via their id, regardless of
   which table (`customers` or `users`) that id came from.
===================================================== */

const CART_STORAGE_KEY = "rakvih_user_cart_v2"; // v2: reset carts saved before the 15% store-wide discount
const WISHLIST_STORAGE_KEY = "rakvih_user_wishlist_v1";
const SESSION_STORAGE_KEY = "rakvih_customer_session_v1";

function cartKey(userId: string) {
  return `${CART_STORAGE_KEY}:${userId}`;
}

function wishlistKey(userId: string) {
  return `${WISHLIST_STORAGE_KEY}:${userId}`;
}

/* =====================================================
   HELPERS
===================================================== */

function stripPassword(row: any): any {
  if (!row) return row;
  const { password, ...rest } = row;
  return rest;
}

/* =====================================================
   PROVIDER
===================================================== */

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(
    null
  );

  const [customer, setCustomer] =
    useState<CustomerProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [wishlist, setWishlist] =
    useState<StoreProduct[]>([]);

  /* =====================================================
     RESTORE SESSION FROM LOCALSTORAGE
     Tries `customers` first (the built-in login/register flow),
     then falls back to `users` (the standalone AuthModal flow),
     so whichever table the saved id actually belongs to is found.
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const raw = window.localStorage.getItem(
          SESSION_STORAGE_KEY
        );

        if (!raw) {
          return;
        }

        const { id } = JSON.parse(raw) as { id: string };

        const { data: customerRow, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (customerError) {
          console.error(
            "Session restore error (customers):",
            customerError.message
          );
        }

        if (customerRow && !customerRow.is_blocked) {
          if (mounted) {
            setUser({ id: customerRow.id, email: customerRow.email });
            setCustomer(stripPassword(customerRow));
          }
          return;
        }

        const { data: userRow, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (userError) {
          console.error(
            "Session restore error (users):",
            userError.message
          );
        }

        if (!userRow) {
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
          return;
        }

        if (mounted) {
          setUser({ id: userRow.id, email: userRow.email });
          setCustomer(stripPassword(userRow));
        }
      } catch (error) {
        console.error(
          "Unexpected session restore error:",
          error
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     LOAD CART + WISHLIST — keyed to whichever user is
     currently logged in, from either table.
  ===================================================== */

  useEffect(() => {
    if (!user?.id) {
      setCart([]);
      setWishlist([]);
      return;
    }

    try {
      const savedCart = localStorage.getItem(cartKey(user.id));
      setCart(savedCart ? JSON.parse(savedCart) : []);

      const savedWishlist = localStorage.getItem(
        wishlistKey(user.id)
      );
      setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
    } catch (error) {
      console.error("Storage loading error:", error);
      setCart([]);
      setWishlist([]);
    }
  }, [user?.id]);

  /* =====================================================
     SAVE CART
  ===================================================== */

  useEffect(() => {
    if (!user?.id) return;
    try {
      localStorage.setItem(cartKey(user.id), JSON.stringify(cart));
    } catch {
      // Ignore storage errors
    }
  }, [cart, user?.id]);

  /* =====================================================
     SAVE WISHLIST
  ===================================================== */

  useEffect(() => {
    if (!user?.id) return;
    try {
      localStorage.setItem(
        wishlistKey(user.id),
        JSON.stringify(wishlist)
      );
    } catch {
      // Ignore storage errors
    }
  }, [wishlist, user?.id]);

  /* =====================================================
     LOGIN (customers table — used elsewhere in the app)
  ===================================================== */

  async function login(
    email: string,
    password: string
  ): Promise<AuthResult> {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { data: row, error } = await supabase
        .from("customers")
        .select("*")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!row) {
        return {
          success: false,
          error: "No account found with that email.",
        };
      }

      if (row.is_blocked) {
        return {
          success: false,
          error:
            "Your account has been blocked. Please contact support.",
        };
      }

      const passwordMatches = await bcrypt.compare(
        password,
        row.password
      );

      if (!passwordMatches) {
        return {
          success: false,
          error: "Incorrect password.",
        };
      }

      const { data: updated, error: updateError } = await supabase
        .from("customers")
        .update({
          last_sign_in_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .select()
        .single();

      const freshRow = updateError ? row : updated;

      setUser({ id: freshRow.id, email: freshRow.email });
      setCustomer(stripPassword(freshRow));

      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ id: freshRow.id })
      );

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error?.message ||
          "An unexpected error occurred.",
      };
    }
  }

  /* =====================================================
     REGISTER (customers table — used elsewhere in the app)
  ===================================================== */

  async function register(
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<AuthResult> {
    try {
      const normalizedEmail =
        email.trim().toLowerCase();

      const { data: existing, error: lookupError } = await supabase
        .from("customers")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (lookupError) {
        return {
          success: false,
          error: lookupError.message,
        };
      }

      if (existing) {
        return {
          success: false,
          error: "An account with this email already exists.",
        };
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const customerData = {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        password: passwordHash,
        is_blocked: false,
        last_sign_in_at: new Date().toISOString(),
      };

      const {
        data: insertedCustomer,
        error: customerError,
      } = await supabase
        .from("customers")
        .insert(customerData)
        .select()
        .single();

      if (customerError) {
        console.error(
          "Customer insert error:",
          customerError.message
        );

        return {
          success: false,
          error:
            "Account could not be created. Please try again.",
        };
      }

      setUser({
        id: insertedCustomer.id,
        email: insertedCustomer.email,
      });

      setCustomer(stripPassword(insertedCustomer));

      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ id: insertedCustomer.id })
      );

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error?.message ||
          "An unexpected error occurred.",
      };
    }
  }

  /* =====================================================
     SET SESSION USER — for auth flows that manage their own
     table/queries (e.g. AuthModal's standalone `users` logic)
     and just need to sync the shared user/customer state,
     cart, and wishlist after they've already verified the
     credentials themselves.
  ===================================================== */

  function setSessionUser(
    profile: { id: string; email: string; [key: string]: any }
  ) {
    setUser({ id: profile.id, email: profile.email });
    setCustomer(stripPassword(profile) as CustomerProfile);

    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ id: profile.id })
    );
  }

  /* =====================================================
     LOGOUT
  ===================================================== */

  async function logout(): Promise<void> {
    setUser(null);
    setCustomer(null);
    setCart([]);
    setWishlist([]);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  /* =====================================================
     ADD TO CART
  ===================================================== */

  function addToCart(
    product: StoreProduct,
    variant?: ProductVariant,
    quantity: number = 1
  ): boolean {
    if (!user) {
      return false;
    }

    const effectiveVariant =
      variant ||
      (
        product.variants &&
        product.variants.length > 0
          ? product.variants[0]
          : undefined
      );

    const variantId =
      effectiveVariant?.id;

    setCart((previous) => {
      const existingIndex =
        previous.findIndex(
          (item) =>
            item.product.id ===
              product.id &&
            (
              (
                !variantId &&
                !item.variant?.id
              ) ||
              item.variant?.id ===
                variantId
            )
        );

      if (existingIndex > -1) {
        return previous.map(
          (item, index) => {
            if (
              index ===
              existingIndex
            ) {
              return {
                ...item,
                quantity:
                  item.quantity +
                  quantity,
              };
            }

            return item;
          }
        );
      }

      return [
        ...previous,
        {
          product,
          variant:
            effectiveVariant,
          quantity,
        },
      ];
    });

    return true;
  }

  /* =====================================================
     REMOVE FROM CART
  ===================================================== */

  function removeFromCart(
    productId: number | string,
    variantId?: number | string
  ) {
    setCart((previous) =>
      previous.filter(
        (item) =>
          !(
            item.product.id ===
              productId &&
            (
              variantId === undefined ||
              item.variant?.id ===
                variantId
            )
          )
      )
    );
  }

  /* =====================================================
     UPDATE CART QUANTITY
  ===================================================== */

  function updateCartQuantity(
    productId: number | string,
    quantity: number,
    variantId?: number | string
  ) {
    if (quantity <= 0) {
      removeFromCart(
        productId,
        variantId
      );

      return;
    }

    setCart((previous) =>
      previous.map((item) => {
        if (
          item.product.id ===
            productId &&
          (
            variantId === undefined ||
            item.variant?.id ===
              variantId
          )
        ) {
          return {
            ...item,
            quantity,
          };
        }

        return item;
      })
    );
  }

  /* =====================================================
     CLEAR CART
  ===================================================== */

  function clearCart() {
    setCart([]);
  }

  /* =====================================================
     TOGGLE WISHLIST
  ===================================================== */

  function toggleWishlist(
    product: StoreProduct
  ): boolean {
    if (!user) {
      return false;
    }

    setWishlist((previous) => {
      const exists =
        previous.some(
          (item) =>
            item.id ===
            product.id
        );

      if (exists) {
        return previous.filter(
          (item) =>
            item.id !==
            product.id
        );
      }

      return [
        ...previous,
        product,
      ];
    });

    return true;
  }

  /* =====================================================
     CHECK WISHLIST
  ===================================================== */

  function isInWishlist(
    productId: number | string
  ): boolean {
    return wishlist.some(
      (item) =>
        item.id === productId
    );
  }

  /* =====================================================
     COUNTS
  ===================================================== */

  const cartCount =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  const wishlistCount =
    wishlist.length;

  const cartSubtotal =
    cart.reduce(
      (total, item) => {
        const itemPrice =
          item.variant?.salePrice ||
          item.variant?.price ||
          item.product.priceValue ||
          0;

        return (
          total +
          itemPrice *
            item.quantity
        );
      },
      0
    );

  /* =====================================================
     PROVIDER
  ===================================================== */

  return (
    <AuthContext.Provider
      value={{
        user,
        customer,

        isAuthenticated:
          Boolean(user),

        isLoading,

        cart,
        wishlist,

        cartCount,
        wishlistCount,
        cartSubtotal,

        login,
        register,
        setSessionUser,
        logout,

        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,

        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =====================================================
   AUTH HOOK
===================================================== */

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}