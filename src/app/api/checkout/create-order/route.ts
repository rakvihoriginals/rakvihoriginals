import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { applyStoreDiscount, storeBasePrice } from "@/lib/fetchProducts";

const PAYMENT_PROOF_BUCKET = "payment-proofs";
const MAX_PROOF_SIZE = 5 * 1024 * 1024;
const ACCEPTED_PROOF_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type CheckoutLine = {
  productId: number;
  variantId: number;
  quantity: number;
  variationName?: string;
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server database configuration is missing.");
  return createClient(url, key, { auth: { persistSession: false } });
}

function validString(value: FormDataEntryValue | null, maxLength = 250): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function matchesImageType(bytes: Buffer, mimeType: string) {
  if (mimeType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/webp") return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  return false;
}

async function ensureProofBucket(supabase: ReturnType<typeof getAdminClient>) {
  const { data: bucket } = await supabase.storage.getBucket(PAYMENT_PROOF_BUCKET);
  if (bucket) return;

  const { error } = await supabase.storage.createBucket(PAYMENT_PROOF_BUCKET, {
    public: true,
    fileSizeLimit: MAX_PROOF_SIZE,
    allowedMimeTypes: [...ACCEPTED_PROOF_TYPES],
  });
  if (error) {
    const { data: existingBucket } = await supabase.storage.getBucket(PAYMENT_PROOF_BUCKET);
    if (!existingBucket) throw error;
  }
}

export async function POST(request: Request) {
  let supabase: ReturnType<typeof getAdminClient> | undefined;
  let uploadedPath: string | undefined;
  let insertedOrderId: string | number | undefined;

  try {
    const form = await request.formData();
    const userId = form.get("userId");
    const email = form.get("email");
    const fullName = form.get("fullName");
    const phoneNumber = form.get("phoneNumber");
    const altPhoneNumber = form.get("altPhoneNumber");
    const houseNumber = form.get("houseNumber");
    const street = form.get("street");
    const city = form.get("city");
    const state = form.get("state");
    const pincode = form.get("pincode");
    const itemsValue = form.get("items");
    const proof = form.get("paymentProof");

    if (
      !validString(userId, 100) || !validString(email, 254) || !validString(fullName, 120) ||
      !validString(phoneNumber, 30) || !validString(houseNumber, 200) || !validString(street, 250) ||
      !validString(city, 100) || !validString(state, 100) || !validString(pincode, 6) || !/^\d{6}$/.test(pincode) ||
      !validString(itemsValue, 100_000) || !(proof instanceof File)
    ) {
      return NextResponse.json({ error: "Please complete the delivery details and upload your UPI payment screenshot." }, { status: 400 });
    }
    if (!ACCEPTED_PROOF_TYPES.has(proof.type) || proof.size <= 0 || proof.size > MAX_PROOF_SIZE) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or WebP payment screenshot up to 5 MB." }, { status: 400 });
    }

    let rawItems: unknown;
    try {
      rawItems = JSON.parse(itemsValue);
    } catch {
      return NextResponse.json({ error: "Your bag details could not be read. Refresh and try again." }, { status: 400 });
    }
    if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 100) {
      return NextResponse.json({ error: "Your bag is empty or invalid." }, { status: 400 });
    }

    const lines: CheckoutLine[] = [];
    for (const item of rawItems) {
      const productId = Number(item?.productId);
      const variantId = Number(item?.variationId);
      const quantity = Number(item?.quantity);
      if (!Number.isSafeInteger(productId) || productId <= 0 || !Number.isSafeInteger(variantId) || variantId <= 0 ||
          !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) {
        return NextResponse.json({ error: "One or more bag items are invalid." }, { status: 400 });
      }
      lines.push({ productId, variantId, quantity, variationName: typeof item.variationName === "string" ? item.variationName.slice(0, 80) : "" });
    }

    const proofBytes = Buffer.from(await proof.arrayBuffer());
    if (!matchesImageType(proofBytes, proof.type)) {
      return NextResponse.json({ error: "The uploaded file does not appear to be a valid image." }, { status: 400 });
    }

    supabase = getAdminClient();
    const [customerLookup, userLookup] = await Promise.all([
      supabase.from("customers").select("id, email").eq("id", userId).maybeSingle(),
      supabase.from("users").select("id, email").eq("id", userId).maybeSingle(),
    ]);
    const account = customerLookup.data || userLookup.data;
    if (!account || (customerLookup.error && userLookup.error)) {
      return NextResponse.json({ error: "Please sign in again before placing your order." }, { status: 401 });
    }

    // Rakvih_orders.user_id is linked to the storefront customers table. Some
    // legacy sign-in flows authenticate against `users`; keep those orders
    // associated by email when a matching customer record exists, otherwise
    // leave user_id null (the profile page also finds orders by email).
    let orderUserId: string | number | null = customerLookup.data?.id ?? null;
    if (!orderUserId) {
      const { data: matchingCustomer } = await supabase
        .from("customers")
        .select("id")
        .ilike("email", email.trim())
        .maybeSingle();
      orderUserId = matchingCustomer?.id ?? null;
    }

    const productIds = [...new Set(lines.map((line) => line.productId))];
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        active,
        product_images (id, image_url),
        product_variations (id, price, sale_price, size_id, stock)
      `)
      .in("id", productIds)
      .eq("active", true)
      .not("product_images.image_url", "imatch", "[.](mp4|mov|webm|m4v)($|[?])")
      .order("id", { referencedTable: "product_images", ascending: true })
      .limit(1, { referencedTable: "product_images" });

    if (productsError || !products) {
      console.error("Checkout product lookup failed:", productsError?.message);
      return NextResponse.json({ error: "We could not validate your bag. Please try again." }, { status: 500 });
    }

    const productsById = new Map(products.map((product: any) => [Number(product.id), product]));
    const cartItems: Array<Record<string, unknown>> = [];
    let total = 0;

    for (const line of lines) {
      const product = productsById.get(line.productId) as any;
      const variant = product?.product_variations?.find((entry: any) => Number(entry.id) === line.variantId);
      if (!product || !variant) {
        return NextResponse.json({ error: "A bag item is no longer available. Refresh your bag and try again." }, { status: 409 });
      }
      if (typeof variant.stock === "number" && variant.stock < line.quantity) {
        return NextResponse.json({ error: `${product.name} does not have enough stock for this quantity.` }, { status: 409 });
      }

      const salePrice = variant.sale_price == null ? null : Number(variant.sale_price);
      const basePrice = storeBasePrice(Number(variant.price) || 0, salePrice);
      const unitPrice = applyStoreDiscount(Number(variant.price) || 0, salePrice);
      if (unitPrice <= 0 || !Number.isFinite(unitPrice)) {
        return NextResponse.json({ error: `${product.name} is not available for checkout.` }, { status: 409 });
      }

      total += unitPrice * line.quantity;
      cartItems.push({
        id: product.id,
        productId: product.id,
        variationId: variant.id,
        name: product.name,
        image: product.product_images?.[0]?.image_url || "/handbag.webp",
        price: unitPrice,
        originalPrice: basePrice,
        quantity: line.quantity,
        variationName: line.variationName || "",
      });
    }

    if (!Number.isSafeInteger(total) || total <= 0) {
      return NextResponse.json({ error: "The bag total is invalid." }, { status: 400 });
    }

    await ensureProofBucket(supabase);
    const { data: inserted, error: insertError } = await supabase
      .from("Rakvih_orders")
      .insert([{
        user_id: orderUserId,
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        alt_phone_number: validString(altPhoneNumber, 30) ? altPhoneNumber.trim() : "",
        house_number: houseNumber.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        payment_method: "UPI",
        payment_id: "UPI proof submitted",
        payment_status: "pending",
        total_price: total,
        shipping_cost: 0,
        grand_total: total,
        cart_items: cartItems,
        status: "pending",
        order_date: new Date().toISOString(),
        email: email.trim() || account.email || "",
      }])
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Order insertion error:", {
        code: insertError?.code,
        message: insertError?.message,
        details: insertError?.details,
        hint: insertError?.hint,
      });
      const errorMessage = process.env.NODE_ENV === "development" && insertError?.message
        ? `Order save failed (${insertError.code || "database"}): ${insertError.message}`
        : "We could not save your order. Your bag is unchanged; please try again.";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
    insertedOrderId = inserted.id;

    const extension = proof.type === "image/png" ? "png" : proof.type === "image/webp" ? "webp" : "jpg";
    uploadedPath = `${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(PAYMENT_PROOF_BUCKET).upload(uploadedPath, proof, {
      contentType: proof.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const proofUrl = supabase.storage.from(PAYMENT_PROOF_BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
    const { error: proofUpdateError } = await supabase
      .from("Rakvih_orders")
      .update({ payment_proof_url: proofUrl })
      .eq("id", inserted.id);
    if (proofUpdateError) throw proofUpdateError;

    return NextResponse.json({ orderId: inserted.id });
  } catch (error) {
    console.error("UPI order submission failed:", error);
    if (supabase && uploadedPath) await supabase.storage.from(PAYMENT_PROOF_BUCKET).remove([uploadedPath]);
    if (supabase && insertedOrderId) await supabase.from("Rakvih_orders").delete().eq("id", insertedOrderId);
    const errorMessage = process.env.NODE_ENV === "development" && error instanceof Error
      ? `Order submission failed: ${error.message}`
      : "Unable to submit your order and payment proof. Please try again.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
