/**
 * Product photos in Supabase Storage are camera originals (~6000px, 7–11 MB each).
 * Supabase's render endpoint resizes them on its CDN (e.g. 9.6 MB → ~50 KB at 640px),
 * so every storefront image should go through here instead of using the raw object URL.
 */
const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

export function isSupabaseStorageUrl(src: string | null | undefined): src is string {
  return !!src && /^https?:\/\//i.test(src) && src.includes(OBJECT_PATH);
}

export function supabaseImageUrl(src: string, width: number, quality = 75): string {
  if (!isSupabaseStorageUrl(src)) return src;
  try {
    const url = new URL(src);
    url.pathname = url.pathname.replace(OBJECT_PATH, RENDER_PATH);
    url.searchParams.set("width", String(Math.round(width)));
    url.searchParams.set("quality", String(quality));
    url.searchParams.set("resize", "contain");
    return url.toString();
  } catch {
    return src;
  }
}

/** next/image loader: lets the browser pick a right-sized variant from srcset. */
export function supabaseImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  return supabaseImageUrl(src, width, quality || 75);
}
