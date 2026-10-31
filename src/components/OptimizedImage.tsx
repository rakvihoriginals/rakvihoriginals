"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { ImageOff } from "lucide-react";
import { isSupabaseStorageUrl, supabaseImageLoader } from "@/lib/imageUrl";

interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  unoptimized?: boolean;
}

function isRemoteUrl(src: string | null | undefined): boolean {
  if (!src) return false;
  return /^https?:\/\//i.test(src);
}

export default function OptimizedImage({
  src,
  alt,
  className = "",
  priority = false,
  fill = true,
  width,
  height,
  sizes = "100vw",
  unoptimized,
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(src || "");
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  // Resize via Supabase's image CDN; drop back to the raw original only if that fails
  const [useResized, setUseResized] = useState(true);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setCurrentSrc(src || "");
    setLoaded(false);
    setErrored(false);
    setUseResized(true);
  }, [src]);

  // Check if image is already cached/complete on mount or src change
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [currentSrc, useResized]);

  const handleError = () => {
    // If the resized variant failed, retry with the raw original
    if (useResized && unoptimized === undefined && isSupabaseStorageUrl(currentSrc)) {
      setUseResized(false);
      return;
    }
    // If the current URL failed and is different from raw src, fallback to raw src
    if (src && currentSrc !== src) {
      setCurrentSrc(src);
      return;
    }
    // If raw src also failed, fallback to default luxury placeholder image
    if (currentSrc !== "/handbag.webp") {
      setCurrentSrc("/handbag.webp");
      return;
    }
    setErrored(true);
  };

  if ((!src && !currentSrc) || errored) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(35, 30, 24, 0.5) 0%, rgba(12, 12, 14, 0.9) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <ImageOff style={{ color: "rgba(196, 161, 116, 0.35)" }} size={24} />
      </div>
    );
  }

  const displaySrc = currentSrc || src || "/handbag.webp";
  const resized = useResized && unoptimized === undefined && isSupabaseStorageUrl(displaySrc);
  const shouldSkipOptimizer = resized ? false : unoptimized ?? isRemoteUrl(displaySrc);

  return (
    <>
      {/* Luxury dark shimmer placeholder */}
      {!loaded && (
        <div
          className={`absolute inset-0 pointer-events-none ${fill ? "" : className}`}
          style={{
            background: "linear-gradient(135deg, rgba(28, 26, 32, 0.5) 0%, rgba(14, 14, 18, 0.8) 100%)",
            transition: "opacity 0.4s ease",
            zIndex: 1,
          }}
        />
      )}
      <Image
        ref={imgRef}
        src={displaySrc}
        alt={alt || "RAKVIH"}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        sizes={sizes}
        loader={resized ? supabaseImageLoader : undefined}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        unoptimized={shouldSkipOptimizer}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`${className} transition-opacity duration-300 ease-out`}
      />
    </>
  );
}