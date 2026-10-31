"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: number;
  name: string;
  priority: number | null;
  image_url: string | null;
  home_status: boolean | null;
};

type Subcategory = {
  id: number;
  name: string;
  category_id: number;
  priority: number | null;
  image_url: string | null;
};

type SubSubcategory = {
  id: number;
  name: string;
  category_id: number;
  subcategory_id: number;
  priority: number | null;
};

function byPriorityThenName<T extends { priority: number | null; name: string }>(
  a: T,
  b: T
) {
  const pa = a.priority ?? 0;
  const pb = b.priority ?? 0;
  if (pa !== pb) return pa - pb;
  return a.name.localeCompare(b.name);
}

// ─────────────────────────────────────────────────────────────
// CURATED VIEW CONFIG
// For a category listed here, only the named subcategories are
// shown, in this exact order — everything else under that
// category is hidden. Categories NOT listed here fall back to
// showing every subcategory, sorted by priority (unchanged
// behaviour). Matching is case-insensitive on the category /
// subcategory name.
// ─────────────────────────────────────────────────────────────
const CURATED_SUBCATS: Record<string, string[]> = {
  men: ["Belts", "Footwear"],
  women: ["Belts", "Footwear", "Hand Bags"],
  unisex: ["Stoles"],
};

function getCuratedList(categoryName: string): string[] | null {
  const key = categoryName.trim().toLowerCase();
  return CURATED_SUBCATS[key] ?? null;
}

export default function CategorySetupPage() {
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subSubcategories, setSubSubcategories] = useState<SubSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<number>>(new Set());
  const [openSubcategories, setOpenSubcategories] = useState<Set<number>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [catRes, subRes, subSubRes] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, priority, image_url, home_status"),
      supabase
        .from("subcategories")
        .select("id, name, category_id, priority, image_url"),
      supabase
        .from("sub_subcategories")
        .select("id, name, category_id, subcategory_id, priority"),
    ]);

    if (catRes.error) {
      setError(catRes.error.message);
    } else if (subRes.error) {
      setError(subRes.error.message);
    } else if (subSubRes.error) {
      setError(subSubRes.error.message);
    } else {
      const allCats = (catRes.data ?? []) as Category[];
      const cats = allCats.filter(
        (c) => c.name.trim().toLowerCase() !== "watches" && c.id !== 8
      );
      const excludedCatIds = new Set(
        allCats
          .filter((c) => c.name.trim().toLowerCase() === "watches" || c.id === 8)
          .map((c) => c.id)
      );
      const subs = ((subRes.data ?? []) as Subcategory[]).filter(
        (s) => !excludedCatIds.has(s.category_id)
      );
      setCategories(cats);
      setSubcategories(subs);
      setSubSubcategories((subSubRes.data ?? []) as SubSubcategory[]);

      // Auto-expand every category that has a curated view, and every
      // one of its curated subcategories, so sub-subcategories are
      // visible immediately without extra clicks.
      const curatedCatIds = new Set<number>();
      const curatedSubIds = new Set<number>();
      for (const cat of cats) {
        const curated = getCuratedList(cat.name);
        if (!curated) continue;
        curatedCatIds.add(cat.id);
        for (const sub of subs) {
          if (
            sub.category_id === cat.id &&
            curated.some((n) => n.toLowerCase() === sub.name.trim().toLowerCase())
          ) {
            curatedSubIds.add(sub.id);
          }
        }
      }
      setOpenCategories(curatedCatIds);
      setOpenSubcategories(curatedSubIds);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Group children by parent id, sorted
  const subcatsByCategory = useMemo(() => {
    const map = new Map<number, Subcategory[]>();
    for (const sub of subcategories) {
      if (!map.has(sub.category_id)) map.set(sub.category_id, []);
      map.get(sub.category_id)!.push(sub);
    }
    for (const list of map.values()) list.sort(byPriorityThenName);
    return map;
  }, [subcategories]);

  const subSubsBySubcategory = useMemo(() => {
    const map = new Map<number, SubSubcategory[]>();
    for (const ss of subSubcategories) {
      if (!map.has(ss.subcategory_id)) map.set(ss.subcategory_id, []);
      map.get(ss.subcategory_id)!.push(ss);
    }
    for (const list of map.values()) list.sort(byPriorityThenName);
    return map;
  }, [subSubcategories]);

  const sortedCategories = useMemo(
    () => [...categories].sort(byPriorityThenName),
    [categories]
  );

  // Returns a category's subcategories, respecting the curated allow-list
  // and order when one exists for that category name; otherwise returns
  // every subcategory sorted by priority.
  const getVisibleSubs = useCallback(
    (category: Category): Subcategory[] => {
      const all = subcatsByCategory.get(category.id) ?? [];
      const curated = getCuratedList(category.name);
      if (!curated) return all;

      const byName = new Map(all.map((s) => [s.name.trim().toLowerCase(), s]));
      return curated
        .map((name) => byName.get(name.toLowerCase()))
        .filter((s): s is Subcategory => Boolean(s));
    },
    [subcatsByCategory]
  );

  // Search matches at any level; a category "has a match" if itself,
  // any of its (curated, if applicable) subcategories, or any
  // sub-subcategory matches.
  const q = query.trim().toLowerCase();

  const matchesQuery = useCallback(
    (category: Category) => {
      if (!q) return true;
      if (category.name.toLowerCase().includes(q)) return true;
      const subs = getVisibleSubs(category);
      for (const sub of subs) {
        if (sub.name.toLowerCase().includes(q)) return true;
        const subsubs = subSubsBySubcategory.get(sub.id) ?? [];
        if (subsubs.some((ss) => ss.name.toLowerCase().includes(q))) return true;
      }
      return false;
    },
    [q, getVisibleSubs, subSubsBySubcategory]
  );

  const visibleCategories = useMemo(
    () => sortedCategories.filter(matchesQuery),
    [sortedCategories, matchesQuery]
  );

  function toggleCategory(id: number) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSubcategory(id: number) {
    setOpenSubcategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpandAll() {
    if (allExpanded) {
      setOpenCategories(new Set());
      setOpenSubcategories(new Set());
      setAllExpanded(false);
    } else {
      setOpenCategories(new Set(categories.map((c) => c.id)));
      setOpenSubcategories(new Set(subcategories.map((s) => s.id)));
      setAllExpanded(true);
    }
  }

  // Totals reflect what's actually shown (curated categories only count
  // their curated subcategories), not the raw table counts.
  const { totalSubcats, totalSubSubcats } = useMemo(() => {
    let subs = 0;
    let subsubs = 0;
    for (const cat of categories) {
      const visibleSubs = getVisibleSubs(cat);
      subs += visibleSubs.length;
      for (const sub of visibleSubs) {
        subsubs += (subSubsBySubcategory.get(sub.id) ?? []).length;
      }
    }
    return { totalSubcats: subs, totalSubSubcats: subsubs };
  }, [categories, getVisibleSubs, subSubsBySubcategory]);

  return (
    <div className="subpage-wrapper brand-directory-admin">
      {/* Hero */}
      <section className="subpage-hero">
        <div className="subpage-hero-inner">
          <div className="subpage-breadcrumbs">
            <Link href="/admin">Dashboard</Link>
            <span>/</span>
            <span className="active">Category Setup</span>
          </div>

          <h1 className="subpage-title">Category Structure</h1>
          <p className="subpage-subtitle">
            Curated category tree — Men, Women, and Unisex show only their
            selected subcategories below; every other category shows its
            full list.
          </p>
        </div>
      </section>

      <section className="subpage-grid-section">
        <div className="subpage-container">
          {error && (
            <p style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: "1.5rem" }}>
              {error}
            </p>
          )}

          {!loading && categories.length > 0 && (
            <div className="cat-tree-summary">
              <div className="cat-tree-summary-item">
                <span className="cat-tree-summary-num">{sortedCategories.length}</span>
                <span className="cat-tree-summary-label">Categories</span>
              </div>
              <div className="cat-tree-summary-item">
                <span className="cat-tree-summary-num">{totalSubcats}</span>
                <span className="cat-tree-summary-label">Subcategories Shown</span>
              </div>
              <div className="cat-tree-summary-item">
                <span className="cat-tree-summary-num">{totalSubSubcats}</span>
                <span className="cat-tree-summary-label">Sub-subcategories Shown</span>
              </div>
            </div>
          )}

          <div className="cat-tree-toolbar">
            <div className="cat-tree-search">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories, subcategories..."
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>

            {!loading && categories.length > 0 && (
              <button onClick={toggleExpandAll} className="cat-tree-expand-btn">
                {allExpanded ? "Collapse All" : "Expand All"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="cat-tree">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="cat-tree-skeleton" />
              ))}
            </div>
          ) : visibleCategories.length === 0 ? (
            <div className="cat-tree-empty">
              <p>
                {query
                  ? `Nothing matches "${query}".`
                  : "No categories have been set up yet."}
              </p>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="brand-directory-clear-btn"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="cat-tree">
              {visibleCategories.map((category) => {
                const isOpen = openCategories.has(category.id);
                const isCurated = getCuratedList(category.name) !== null;
                const subs = getVisibleSubs(category);
                const filteredSubs = q
                  ? subs.filter(
                      (sub) =>
                        sub.name.toLowerCase().includes(q) ||
                        category.name.toLowerCase().includes(q) ||
                        (subSubsBySubcategory.get(sub.id) ?? []).some((ss) =>
                          ss.name.toLowerCase().includes(q)
                        )
                    )
                  : subs;

                return (
                  <div
                    key={category.id}
                    className={`cat-node${q && category.name.toLowerCase().includes(q) ? " has-match" : ""}`}
                  >
                    <div
                      className="cat-node-row"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <span className={`cat-node-chevron${isOpen ? " open" : ""}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </span>

                      <div className="cat-node-thumb">
                        {category.image_url ? (
                          <Image
                            src={category.image_url}
                            alt={category.name}
                            fill
                            sizes="44px"
                          />
                        ) : (
                          <span className="cat-node-thumb-fallback">
                            {category.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="cat-node-body">
                        <span className="cat-node-name">{category.name}</span>
                        <div className="cat-node-meta">
                          <span className="cat-node-count">
                            {subs.length} sub{subs.length === 1 ? "" : "s"}
                          </span>
                          {category.home_status && (
                            <span className="cat-node-badge home">Home</span>
                          )}
                          <span className="cat-node-badge priority">
                            P{category.priority ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`cat-node-children${isOpen ? " open" : ""}`}>
                      {filteredSubs.length === 0 ? (
                        <p className="subcat-empty">
                          {isCurated
                            ? "None of the curated subcategories exist yet for this category."
                            : "No subcategories yet."}
                        </p>
                      ) : (
                        <div className="subcat-list">
                          {filteredSubs.map((sub, idx) => {
                            const subSubs = subSubsBySubcategory.get(sub.id) ?? [];
                            const subOpen = isCurated || openSubcategories.has(sub.id);
                            const hasChildren = subSubs.length > 0;

                            return (
                              <div key={sub.id} className="subcat-node">
                                <div
                                  className="subcat-node-row"
                                  onClick={() =>
                                    hasChildren && !isCurated && toggleSubcategory(sub.id)
                                  }
                                  style={{
                                    cursor: hasChildren && !isCurated ? "pointer" : "default",
                                  }}
                                >
                                  {isCurated && (
                                    <span className="subcat-node-index">{idx + 1}.</span>
                                  )}
                                  <span
                                    className={`subcat-node-chevron${
                                      subOpen ? " open" : ""
                                    }${!hasChildren ? " leaf" : ""}`}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                    </svg>
                                  </span>

                                  <div className="subcat-node-thumb">
                                    {sub.image_url ? (
                                      <Image
                                        src={sub.image_url}
                                        alt={sub.name}
                                        fill
                                        sizes="32px"
                                      />
                                    ) : null}
                                  </div>

                                  <span className="subcat-node-name">
                                    {sub.name}
                                  </span>

                                  <div className="subcat-node-meta">
                                    <span className="cat-node-count">
                                      {subSubs.length}
                                    </span>
                                    <span className="cat-node-badge priority">
                                      P{sub.priority ?? 0}
                                    </span>
                                  </div>
                                </div>

                                {hasChildren && (
                                  <div
                                    className={`cat-node-children${
                                      subOpen ? " open" : ""
                                    }`}
                                  >
                                    <div className="subsub-list">
                                      {subSubs.map((ss) => (
                                        <div key={ss.id} className="subsub-item">
                                          <span>{ss.name}</span>
                                          <span className="subsub-item-priority">
                                            P{ss.priority ?? 0}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}