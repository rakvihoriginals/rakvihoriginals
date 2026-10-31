"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Brand = {
  id: number;
  name_en: string;
  alt_text: string;
  image_url: string | null;
  status: boolean | null;
};

const LIKED_BRANDS_KEY = "liked_brands_v1";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Clean and validate image URLs (filters out raw video formats and parses JSON arrays)
function cleanImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let value: unknown = raw;

  try {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      value = Array.isArray(parsed) ? parsed[0] : parsed;
    }
  } catch {
    // not JSON — treat as plain string
  }

  let clean = String(value ?? "")
    .split(",")[0]
    .replace(/[\[\]"'\\]/g, "")
    .trim();

  if (!clean) return null;
  if (clean.startsWith("http:")) clean = clean.replace(/^http:/i, "https:");
  
  // Reject videos completely
  if (/\.(mp4|webm|ogg|mov)$/i.test(clean)) return null;

  return clean;
}

function readLikedBrands(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LIKED_BRANDS_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function writeLikedBrands(ids: number[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LIKED_BRANDS_KEY, JSON.stringify(ids));
  } catch {
    // storage blocked/full — likes just won't persist this session
  }
}

function firstLetterOf(name: string): string {
  const ch = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : "#";
}

export default function ListBrandsPage() {
  const supabase = createClient();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [likedOnly, setLikedOnly] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setLikedIds(readLikedBrands());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeLikedBrands(likedIds);
  }, [likedIds, hydrated]);

  const loadBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("brands")
      .select("id, name_en, alt_text, image_url, status")
      .eq("status", true)
      .order("name_en", { ascending: true });

    if (error) {
      setError(error.message);
      setBrands([]);
    } else {
      setBrands((data ?? []) as Brand[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  function toggleLike(id: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLikedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const filteredBrands = useMemo(() => {
    let list = brands;
    if (likedOnly) list = list.filter((b) => likedIds.includes(b.id));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((b) => b.name_en.toLowerCase().includes(q));
    }
    return list;
  }, [brands, query, likedOnly, likedIds]);

  const grouped = useMemo(() => {
    const map = new Map<string, Brand[]>();
    for (const brand of filteredBrands) {
      const letter = firstLetterOf(brand.name_en);
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(brand);
    }
    return map;
  }, [filteredBrands]);

  const availableLetters = useMemo(() => new Set(grouped.keys()), [grouped]);

  function scrollToLetter(letter: string) {
    const el = sectionRefs.current[letter];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveLetter(letter);
    }
  }

  const likedCount = likedIds.length;
  const totalCount = brands.length;

  return (
    <div className="subpage-wrapper brand-directory-admin">
      {/* Hero */}
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/admin">Dashboard</Link>
            <span>/</span>
            <span className="active">Brand Directory</span>
          </div>

          <h1 className="subpage-title">Every House, A to Z</h1>
          <p className="subpage-subtitle">
            {totalCount > 0
              ? `${totalCount} brand${totalCount === 1 ? "" : "s"} currently carried in the atelier. Browse alphabetically or search by name.`
              : "Browse the brands we carry, alphabetically."}
          </p>
        </div>
      </section>

      {/* Grid section */}
      <section className="subpage-grid-section">
        <div className="subpage-container">
          {error && (
            <p style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: "1.5rem" }}>
              {error}
            </p>
          )}

          {/* Toolbar: search + liked filter */}
          <div className="brand-directory-toolbar">
            <div className="brand-directory-search">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search brands"
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              {likedCount > 0 && (
                <span className="brand-directory-liked-pill">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                  {likedCount} liked
                </span>
              )}

              <button
                onClick={() => setLikedOnly((v) => !v)}
                className={`filter-pill${likedOnly ? " active" : ""}`}
              >
                Liked only
              </button>
            </div>
          </div>

          {/* A–Z rail */}
          {!loading && filteredBrands.length > 0 && (
            <div className="brand-directory-alpha-rail">
              {ALPHABET.map((letter) => {
                const available = availableLetters.has(letter);
                return (
                  <button
                    key={letter}
                    onClick={() => available && scrollToLetter(letter)}
                    disabled={!available}
                    className={`brand-directory-alpha-btn ${
                      available ? "available" : "disabled"
                    } ${activeLetter === letter ? "active" : ""}`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="brand-directory-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="brand-directory-skeleton" />
              ))}
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="brand-directory-empty">
              <p>
                {likedOnly
                  ? "You haven't liked any brands yet."
                  : query
                  ? `No brands match "${query}".`
                  : "No brands to show yet."}
              </p>
              {(query || likedOnly) && (
                <button
                  onClick={() => {
                    setQuery("");
                    setLikedOnly(false);
                  }}
                  className="brand-directory-clear-btn"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            Array.from(grouped.entries()).map(([letter, letterBrands]) => (
              <div
                key={letter}
                ref={(el) => {
                  sectionRefs.current[letter] = el;
                }}
                className="brand-directory-section"
              >
                <div className="brand-directory-section-heading">
                  <span className="brand-directory-section-letter">{letter}</span>
                  <span className="brand-directory-section-line" />
                  <span className="brand-directory-section-count">
                    {letterBrands.length}
                  </span>
                </div>

                <div className="brand-directory-grid">
                  {letterBrands.map((brand) => {
                    const liked = likedIds.includes(brand.id);
                    const validImg = cleanImageUrl(brand.image_url);

                    return (
                      <div key={brand.id} className="brand-directory-card">
                        <button
                          onClick={(e) => toggleLike(brand.id, e)}
                          title={liked ? "Unlike" : "Like this brand"}
                          aria-pressed={liked}
                          className={`brand-directory-like-btn${liked ? " liked" : ""}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill={liked ? "currentColor" : "none"}
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                            />
                          </svg>
                        </button>

                        <div
                          className="brand-directory-card-image"
                          style={{
                            position: "relative",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0.75rem",
                          }}
                        >
                          {validImg ? (
                            <Image
                              src={validImg}
                              alt={brand.alt_text || brand.name_en}
                              fill
                              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
                              style={{ objectFit: "contain", padding: "8px" }}
                              unoptimized={validImg.startsWith("http:")}
                            />
                          ) : (
                            <span className="brand-directory-card-fallback">
                              {brand.name_en}
                            </span>
                          )}
                        </div>

                        <div className="brand-directory-card-name">
                          {brand.name_en}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}