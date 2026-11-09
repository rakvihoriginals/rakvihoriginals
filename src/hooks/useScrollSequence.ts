// @ts-nocheck
import { setupFrameAutoScroll } from '@/lib/frameAutoScroll';
/* ============================================
   MAISON ÉLÉGANCE — Scroll-Driven Animation Engine
   High-Performance, Zero-Glitch Canvas Renderer
   + Category Filters, Marquee, Brand Carousel
   ============================================ */

/**
 * Boots every scroll-driven effect on the homepage.
 * Returns a cleanup function to release all listeners, render loops,
 * and observers when unmounted.
 */
export function initScrollSequence(): () => void {
    'use strict';

    // ─── MOBILE / WEBVIEW DETECTION ───
    // Android WebViews typically have 150–300 MB heap; desktops have 8+ GB.
    // Detect constrained environments so we can dial back memory-hungry settings.
    const isMobileOrWebView = typeof window !== 'undefined' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        // Android WebView UA contains "wv" or lacks "Chrome/" (custom WebView)
        /\bwv\b/.test(navigator.userAgent) ||
        (typeof window.orientation !== 'undefined') ||
        ('ontouchstart' in window && navigator.maxTouchPoints > 0 && window.innerWidth < 1024)
    );
    const isLowMemory = isMobileOrWebView || (
        typeof navigator !== 'undefined' && (navigator as any).deviceMemory !== undefined && (navigator as any).deviceMemory < 4
    );

    // ─── CONFIGURATION ───
    const LERP_FACTOR = 0.14;          // Fast, silky smooth easing
    const MAX_CONCURRENT_LOADS = isLowMemory ? 2 : 4;
    const NEAR_WINDOW_BEHIND = isLowMemory ? 2 : 4;
    const NEAR_WINDOW_AHEAD = isLowMemory ? 6 : 18;
    const PATH_SAMPLES = isLowMemory ? 4 : 10;
    const MAX_RETAINED_FRAMES = isLowMemory ? 8 : 40;
    const MAX_DPR = isLowMemory ? 1.0 : 1.5;
    const PRELOAD_FRAMES = isLowMemory ? 10 : Infinity;
    const MAX_PREFETCHES = isLowMemory ? 2 : 6;
    const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = typeof navigator !== 'undefined' && navigator.connection?.saveData === true;
    const START_LOADING_MARGIN = '100% 0px'; // Start preloading 1 viewport height ahead
    // On mobile, only keep 1 hero active at a time (others show a poster frame)
    const MOBILE_SINGLE_HERO = isLowMemory;

    const abort = new AbortController();
    const listen = (target, type, fn, opts = {}) =>
        target.addEventListener(type, fn, { ...opts, signal: abort.signal });
    const cleanups = [];
    const sequences = [];

    // One 1920×1080 set (scripts/optimize-home-frames.cjs) for every screen.
    const FRAME_BASE = '/home-frames/1080p/';
    const FRAME_WIDTH = 1920;
    const FRAME_HEIGHT = 1080;

    // ─── SHARED FRAME LOADER ───
    let inflight = 0;

    function pumpLoader() {
        if (abort.signal.aborted || document.hidden) return;
        const deferred = new Set();
        while (inflight < MAX_CONCURRENT_LOADS) {
            let bestSeq = null;
            let highestPriority = -1;

            for (const seq of sequences) {
                if (deferred.has(seq) || !seq.loadingStarted || seq.allRequested || (!seq.isNear && !seq.isVisible)) continue;
                const priority = seq.loadPriority();
                if (priority > highestPriority) {
                    highestPriority = priority;
                    bestSeq = seq;
                }
            }

            if (!bestSeq) return;

            const index = bestSeq.nextFrameToLoad();
            if (index === -2) {
                deferred.add(bestSeq);
                continue;
            }
            if (index < 0) {
                bestSeq.allRequested = true;
                continue;
            }

            inflight++;
            bestSeq.loadFrame(index).finally(() => {
                inflight--;
                pumpLoader();
            });
        }
    }

    // ─── BACKGROUND PREFETCH ───
    // Downloads every film's compressed frames into the HTTP cache (frames are served
    // immutable), so the decode window above never waits on the network mid-scroll.
    // Nothing is decoded or kept in memory here.
    let prefetchInflight = 0;

    function prefetchOrder() {
        // The film on screen (or the next one below), then the films after it, then the ones above.
        let current = sequences.findIndex(seq => seq.isVisible);
        if (current < 0) {
            const scrollY = window.scrollY || 0;
            current = sequences.findIndex(seq => seq.containerTop + seq.containerHeight > scrollY);
            if (current < 0) current = sequences.length - 1;
        }
        return [...sequences.slice(current), ...sequences.slice(0, current).reverse()];
    }

    function nextPrefetch() {
        const order = prefetchOrder();
        for (const seq of order) {
            const start = seq === order[0] ? clamp(Math.round(seq.targetFrame), 0, seq.total - 1) : 0;
            const wanted = (i) => !seq.cached[i] && !seq.requested[i] && !seq.prefetching.has(i);
            for (let i = start; i < seq.total; i++) if (wanted(i)) return [seq, i];
            for (let i = start - 1; i >= 0; i--) if (wanted(i)) return [seq, i];
        }
        return null;
    }

    function pumpPrefetch() {
        // Skip aggressive prefetch entirely on mobile/WebView to save memory and bandwidth
        if (abort.signal.aborted || reducedMotion || saveData || isLowMemory) return;
        while (prefetchInflight < MAX_PREFETCHES) {
            const next = nextPrefetch();
            if (!next) return;
            const [seq, index] = next;
            prefetchInflight++;
            const done = fetch(seq.frameUrl(index), { signal: abort.signal, priority: window.__rkHeroReady ? 'low' : 'high' })
                .then(res => {
                    if (!res.ok) throw new Error(res.statusText);
                    return res.arrayBuffer();
                })
                .then(() => { seq.cached[index] = 1; }, () => { if (!abort.signal.aborted) seq.cached[index] = 2; })
                .finally(() => {
                    seq.prefetching.delete(index);
                    prefetchInflight--;
                    updateHeroReady();
                    pumpPrefetch();
                });
            seq.prefetching.set(index, done);
        }
    }

    /** The intro loader lifts once Hero 1 is painted and its opening frames are on the device. */
    function updateHeroReady() {
        const main = sequences.find(seq => seq.config.isMain);
        if (!main || window.__rkHeroReady) return;
        const target = reducedMotion || saveData ? 1 : Math.min(PRELOAD_FRAMES, main.total);
        let done = 0;
        for (let i = 0; i < target; i++) if (main.cached[i]) done++;
        window.__rkHeroProgress = done / target;
        if (main.drawnIndex >= 0 && done >= target) window.__rkHeroReady = true;
    }

    // ─── SCROLL SEQUENCE CLASS ───
    class ScrollSequence {
        constructor(config) {
            this.config = config;
            this.total = config.totalFrames;
            this.images = new Array(this.total);
            this.requested = new Uint8Array(this.total);
            this.cached = new Uint8Array(this.total);    // 1 = in the HTTP cache, 2 = failed
            this.prefetching = new Map();
            this.pending = new Map();
            this.loadingStarted = false;
            this.allRequested = false;

            this.targetFrame = 0;
            this.lerpedFrame = 0;
            this.drawnIndex = -1;
            this.lastTextFrame = -1;
            this.lastCounterNum = 0;
            this.direction = 1;
            this.isVisible = false;
            this.isNear = config.isMain;
            this.rafId = 0;
            this.lastTime = 0;

            // Cached geometry to avoid getBoundingClientRect layout thrashing
            this.containerTop = 0;
            this.containerHeight = 0;
            this.canvasWidth = 0;
            this.canvasHeight = 0;
            this.viewportHeight = 0;
            this.effectiveHeight = 0;

            this.canvas = document.getElementById(config.canvasId);
            this.section = document.getElementById(config.sectionId);
            if (!this.canvas || !this.section) return;

            this.container = this.section.querySelector('.hero-scroll-container');
            this.ctx = this.canvas.getContext('2d', { alpha: false });
            this.counterEl = this.section.querySelector('.hero-counter .counter-current');
            this.indicatorEl = config.isMain ? this.section.querySelector('.scroll-indicator') : null;
            this.overlays = this.buildOverlays();

            this.resizeCanvas = this.resizeCanvas.bind(this);
            this.onScroll = this.onScroll.bind(this);
            this.renderLoop = this.renderLoop.bind(this);

            this.measure();
            this.resizeCanvas();
            this.onScroll();
            this.updateHeroText(0);
            this.observeViewport();

            sequences.push(this);

            // All requests, including posters, share the two-slot loader.
            if (config.isMain) this.startLoading();
        }

        measure() {
            if (!this.container) return;
            const rect = this.container.getBoundingClientRect();
            const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
            this.containerTop = rect.top + scrollY;
            this.containerHeight = this.container.offsetHeight || rect.height;
            this.viewportHeight = window.innerHeight;
            this.effectiveHeight = (this.containerHeight - this.viewportHeight) * 0.98;
        }

        observeViewport() {
            const visibleObserver = new IntersectionObserver((entries) => {
                const entry = entries[0];
                this.isVisible = entry.isIntersecting;
                if (this.isVisible) {
                    // On mobile, when a new hero becomes visible, prune all other sequences
                    // to free memory — only one hero animates at a time
                    if (MOBILE_SINGLE_HERO) {
                        for (const seq of sequences) {
                            if (seq !== this && seq.isVisible) {
                                seq.isVisible = false;
                                if (seq.rafId) {
                                    cancelAnimationFrame(seq.rafId);
                                    seq.rafId = 0;
                                }
                                seq.pruneFrames(true); // Release all decoded frames
                            }
                        }
                    }
                    this.measure();
                    this.onScroll();
                    this.lerpedFrame = this.targetFrame;
                    this.drawFrame(this.lerpedFrame, true);
                    this.updateHeroText(this.lerpedFrame);
                    this.startRenderLoop();
                } else {
                    if (this.rafId) {
                        cancelAnimationFrame(this.rafId);
                        this.rafId = 0;
                    }
                    // On mobile, aggressively release ALL frames when off-screen
                    if (isLowMemory) {
                        this.pruneFrames(true);
                    }
                }
                this.pruneFrames();
                pumpLoader();
            }, { threshold: 0.01 });
            visibleObserver.observe(this.container);

            const nearObserver = new IntersectionObserver((entries) => {
                this.isNear = entries[0].isIntersecting;
                if (this.isNear) {
                    this.measure();
                    this.allRequested = false;
                    this.startLoading();
                }
                this.pruneFrames();
                pumpLoader();
            }, { rootMargin: START_LOADING_MARGIN });
            nearObserver.observe(this.container);

            cleanups.push(() => {
                visibleObserver.disconnect();
                nearObserver.disconnect();
                if (this.rafId) cancelAnimationFrame(this.rafId);
                for (const cancel of this.pending.values()) cancel();
                this.pruneFrames(true);
            });
        }

        startLoading() {
            if (this.loadingStarted) return;
            this.loadingStarted = true;
            pumpLoader();
        }

        loadPriority() {
            if (this.isVisible) return 3;
            if (this.isNear) return 2;
            return this.config.isMain ? 1 : 0;
        }

        resizeCanvas() {
            if (!this.canvas) return;
            this.measure();
            const width = window.innerWidth;
            const height = window.innerHeight;
            // Never allocate canvas pixels the frames cannot fill; that only adds blur and memory.
            const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR, FRAME_WIDTH / width, FRAME_HEIGHT / height);

            if (width === this.canvasWidth && height === this.canvasHeight) return;

            this.canvas.width = Math.round(width * dpr);
            this.canvas.height = Math.round(height * dpr);
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // Resizing resets context state; the default 'low' smoothing aliases when downscaling.
            this.ctx.imageSmoothingQuality = 'high';

            this.canvasWidth = width;
            this.canvasHeight = height;
            this.drawFrame(this.lerpedFrame, true);
        }

        frameWindow() {
            // Only the visible film loads motion frames. Nearby films need a poster.
            if (reducedMotion || !this.isVisible || document.hidden) return new Set([0]);
            const center = clamp(Math.round(this.targetFrame), 0, this.total - 1);
            const playing = clamp(Math.round(this.lerpedFrame), 0, this.total - 1);
            const frames = new Set([playing]);
            const gap = center - playing;
            const steps = Math.min(Math.abs(gap), PATH_SAMPLES);
            for (let i = 1; i < steps; i++) frames.add(Math.round(playing + gap * i / steps));
            frames.add(center);
            for (let d = 1; d <= NEAR_WINDOW_AHEAD; d++) {
                frames.add(clamp(center + d * this.direction, 0, this.total - 1));
            }
            for (let d = 1; d <= NEAR_WINDOW_BEHIND; d++) {
                frames.add(clamp(center - d * this.direction, 0, this.total - 1));
            }
            return frames;
        }

        pruneFrames(all = false) {
            const keep = all ? new Set() : this.frameWindow();
            if (!all) {
                keep.add(0);
                keep.add(this.drawnIndex);
                // A decoded frame can arrive just after the moving window passed it.
                // Keep recent nearby completions as drawable fallbacks instead of
                // discarding every result while the user scrolls quickly.
                // On mobile, skip this extra retention to save memory.
                if (this.isVisible && !document.hidden && !reducedMotion && !isLowMemory) {
                    const recent = this.images
                        .map((image, index) => image ? index : -1)
                        .filter(index => index >= 0 && !keep.has(index))
                        .sort((a, b) => Math.abs(a - this.lerpedFrame) - Math.abs(b - this.lerpedFrame));
                    for (const index of recent) {
                        if (keep.size >= MAX_RETAINED_FRAMES) break;
                        keep.add(index);
                    }
                }
            }
            for (let i = 0; i < this.total; i++) {
                if (!this.images[i] || keep.has(i)) continue;
                this.images[i].removeAttribute('src');
                this.images[i] = undefined;
                this.requested[i] = 0;
            }
        }

        nextFrameToLoad() {
            if (!this.requested[0]) return 0;
            for (const index of this.frameWindow()) {
                if (!this.requested[index]) return index;
            }
            // No bulk sweep and no eviction of a frame the loader still wants.
            return -2;
        }

        frameUrl(index) {
            // When using frame stepping (mobile), map the reduced index back to the
            // original frame number. e.g., index 0 → frame 001, index 1 → frame 006, etc.
            const step = this.config.frameStep || 1;
            const originalIndex = index * step;
            return FRAME_BASE + this.config.framePath + String(originalIndex + 1).padStart(3, '0') + this.config.frameExt;
        }

        loadFrame(index) {
            if (this.requested[index]) return Promise.resolve();
            this.requested[index] = 1;
            // Wait for a background download of the same file instead of fetching it twice.
            const prefetch = this.prefetching.get(index);
            if (!prefetch) return this.decodeFrame(index);
            return prefetch.then(() => {
                if (abort.signal.aborted || this.requested[index] !== 1) return;
                return this.decodeFrame(index);
            });
        }

        decodeFrame(index) {
            return new Promise((resolve) => {
                const img = new Image();
                img.decoding = 'async';
                const frameNum = String(index + 1).padStart(3, '0');
                const framePath = this.config.framePath + frameNum + this.config.frameExt;
                let usingOriginal = false;
                let finished = false;
                const finish = () => {
                    if (finished) return;
                    finished = true;
                    img.onload = img.onerror = null;
                    this.pending.delete(index);
                    resolve();
                };
                this.pending.set(index, () => {
                    img.removeAttribute('src');
                    finish();
                });
                img.onload = async () => {
                    try {
                        // Assets are already sized on disk; no runtime resizing or bitmap copy.
                        await img.decode();
                        if (finished) return;
                        if (abort.signal.aborted || (index !== 0 && (!this.isVisible || document.hidden))) {
                            img.removeAttribute('src');
                            this.requested[index] = 0;
                            return;
                        }
                        this.images[index] = img;
                        this.requested[index] = 2;
                        if (!usingOriginal) this.cached[index] = 1;
                        this.pruneFrames();
                        if (this.drawnIndex < 0) {
                            this.drawFrame(this.lerpedFrame, true);
                            if (this.config.isMain) updateHeroReady();
                        } else if (this.isVisible) {
                            this.startRenderLoop();
                        }
                    } catch {
                        this.requested[index] = 3;
                        this.cached[index] = 2;
                    } finally {
                        finish();
                    }
                };
                img.onerror = () => {
                    // Optimized assets may still be generating locally. The complete
                    // original sequence keeps playback moving instead of freezing.
                    if (!usingOriginal && !abort.signal.aborted) {
                        usingOriginal = true;
                        img.src = '/' + framePath;
                        return;
                    }
                    this.requested[index] = 3;
                    finish();
                };
                img.src = this.frameUrl(index);
            });
        }

        /**
         * Select the best loaded frame without ever jumping back and forth.
         * Enforces monotonic continuity matching the user's scroll direction.
         */
        getFrameToDraw(wanted) {
            if (this.images[wanted]) return wanted;

            if (this.config.isMain && this.drawnIndex >= 0 && this.images[this.drawnIndex]) {
                // Scroll direction can reverse before the eased playhead catches up.
                // Only use frames between the current image and that playhead;
                // looking beyond it can flash another shot, then jump back.
                const step = wanted >= this.drawnIndex ? -1 : 1;
                for (let i = wanted; i !== this.drawnIndex; i += step) {
                    if (this.images[i]) return i;
                }
                return this.drawnIndex;
            }

            if (this.direction >= 0) {
                // Scrolling forward: search backwards first (prefer already passed frames)
                for (let i = wanted - 1; i >= 0; i--) {
                    if (this.images[i]) return i;
                }
                // If nothing earlier, keep currently drawn frame
                if (this.drawnIndex >= 0 && this.images[this.drawnIndex]) {
                    return this.drawnIndex;
                }
                // Otherwise look forward
                for (let i = wanted + 1; i < this.total; i++) {
                    if (this.images[i]) return i;
                }
            } else {
                // Scrolling backward: search forwards first
                for (let i = wanted + 1; i < this.total; i++) {
                    if (this.images[i]) return i;
                }
                if (this.drawnIndex >= 0 && this.images[this.drawnIndex]) {
                    return this.drawnIndex;
                }
                for (let i = wanted - 1; i >= 0; i--) {
                    if (this.images[i]) return i;
                }
            }

            return -1;
        }

        drawFrame(frame, force = false) {
            const wanted = Math.max(0, Math.min(this.total - 1, Math.round(frame)));
            let idx = this.getFrameToDraw(wanted);
            if (!force && this.drawnIndex >= 0) {
                if (this.direction > 0 && wanted >= this.drawnIndex && idx < this.drawnIndex) idx = this.drawnIndex;
                if (this.direction < 0 && wanted <= this.drawnIndex && idx > this.drawnIndex) idx = this.drawnIndex;
            }
            if (idx < 0 || (!force && idx === this.drawnIndex)) return;

            const img = this.images[idx];
            if (!img || !img.naturalWidth) return;

            const cw = this.canvasWidth;
            const ch = this.canvasHeight;
            const iw = img.naturalWidth;
            const ih = img.naturalHeight;
            const scale = Math.max(cw / iw, ch / ih);
            const w = iw * scale;
            const h = ih * scale;

            this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
            this.drawnIndex = idx;
        }

        onScroll() {
            // Cheaply calculate progress using cached container geometry + window.scrollY
            const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
            const scrolled = scrollY - this.containerTop;
            const progress = this.effectiveHeight > 0 ? clamp(scrolled / this.effectiveHeight, 0, 1) : 0;

            const next = reducedMotion ? 0 : progress * (this.total - 1);
            if (Math.abs(next - this.targetFrame) > 0.001) {
                this.direction = next >= this.targetFrame ? 1 : -1;
                this.targetFrame = next;
                this.pruneFrames();
            }

            if (this.indicatorEl) {
                this.indicatorEl.classList.toggle('hidden', progress > 0.02);
            }
            this.updateHeroCounter(progress);

            if (this.isVisible) {
                this.allRequested = false;
                pumpLoader();
            }
        }

        startRenderLoop() {
            if (this.rafId || document.hidden) return;
            this.lastTime = performance.now();
            this.rafId = requestAnimationFrame(this.renderLoop);
        }

        renderLoop(now) {
            if (abort.signal.aborted || document.hidden || !this.isVisible) {
                this.rafId = 0;
                return;
            }

            this.onScroll();
            // The first callback's frame timestamp can precede the performance.now() taken when
            // the loop started; a negative step would push the playhead backwards a frame.
            const dt = clamp(now - (this.lastTime || now), 0, 64);
            this.lastTime = now;

            const diff = this.targetFrame - this.lerpedFrame;
            if (Math.abs(diff) > 0.04) {
                const t = 1 - Math.pow(1 - LERP_FACTOR, dt / 16.667);
                this.lerpedFrame += diff * Math.min(t, 1);
            } else {
                this.lerpedFrame = this.targetFrame;
            }

            this.drawFrame(this.lerpedFrame);

            if (Math.abs(this.lerpedFrame - this.lastTextFrame) > 0.01) {
                this.updateHeroText(this.lerpedFrame);
            }

            if (Math.abs(this.targetFrame - this.lerpedFrame) > 0.04) {
                this.rafId = requestAnimationFrame(this.renderLoop);
            } else {
                this.rafId = 0; // Settle cleanly when not scrolling
            }
        }

        buildOverlays() {
            const last = this.total - 1;
            return Array.from(this.section.querySelectorAll('.hero-text-overlay')).map((el) => {
                const isFirst = el.classList.contains('text-first') ||
                                (el.id && el.id.endsWith('-text-1')) ||
                                el.id === 'hero-text-1';
                const isLast = el.classList.contains('text-last') ||
                               (el.id && el.id.endsWith('-text-6')) ||
                               el.id === 'hero-text-6';

                let startFrame = 0;
                let endFrame = 0;
                let fadeInFrames = 3;
                let fadeOutFrames = 3;

                if (isFirst) {
                    startFrame = 0;
                    fadeInFrames = 0;
                    if (this.config.isMain) {
                        endFrame = 0.10 * last;
                        // Proportional fade-out frames so text starts at full 100% opacity on all devices
                        fadeOutFrames = Math.max(1, Math.min(endFrame * 0.4, 0.04 * last));
                    } else {
                        endFrame = 0.12 * last;
                        fadeOutFrames = Math.max(1, Math.min(endFrame * 0.4, 0.03 * last));
                    }
                } else if (isLast) {
                    startFrame = (this.config.isMain ? 0.86 : 0.80) * last;
                    endFrame = this.total + 10;
                    fadeOutFrames = 0;
                    fadeInFrames = Math.max(1, 0.03 * last);
                } else if (el.dataset.start && el.dataset.end) {
                    startFrame = parseFloat(el.dataset.start) * last;
                    endFrame = parseFloat(el.dataset.end) * last;
                    fadeInFrames = Math.max(1, 0.03 * last);
                    fadeOutFrames = Math.max(1, 0.03 * last);
                }

                return {
                    el, isFirst, isLast, startFrame, endFrame, fadeInFrames, fadeOutFrames,
                    hasLink: Boolean(el.querySelector('a')),
                    lastOpacity: -1,
                    lastTranslateY: -999,
                };
            });
        }

        updateHeroText(frame) {
            this.lastTextFrame = frame;

            for (const o of this.overlays) {
                let opacity = 0;
                let translateY = 30;
                let scale = 0.97;

                if (frame >= o.startFrame && frame <= o.endFrame) {
                    const fadeInEnd = o.startFrame + o.fadeInFrames;
                    const fadeOutStart = o.endFrame - o.fadeOutFrames;

                    if (o.fadeInFrames > 0 && frame < fadeInEnd) {
                        const t = easeOutCubic((frame - o.startFrame) / o.fadeInFrames);
                        opacity = t;
                        translateY = 30 * (1 - t);
                        scale = 0.97 + 0.03 * t;
                    } else if (frame <= fadeOutStart || o.fadeOutFrames === 0) {
                        opacity = 1; translateY = 0; scale = 1;
                    } else {
                        const t = easeOutCubic((frame - fadeOutStart) / o.fadeOutFrames);
                        opacity = 1 - t;
                        translateY = -20 * t;
                        scale = 1 + 0.02 * t;
                    }
                }

                // Avoid unnecessary DOM writes
                if (opacity === 0 && o.lastOpacity === 0) continue;
                if (Math.abs(opacity - o.lastOpacity) < 0.01 && Math.abs(translateY - o.lastTranslateY) < 0.5) continue;

                o.lastOpacity = opacity;
                o.lastTranslateY = translateY;

                const style = o.el.style;
                style.opacity = String(opacity);
                style.transform = `translateY(${translateY}px) scale(${scale})`;
                style.pointerEvents = (opacity > 0.1 && (o.isFirst || o.isLast || o.hasLink)) ? 'auto' : 'none';
            }
        }

        updateHeroCounter(progress) {
            if (!this.counterEl) return;

            let num = 1;
            if (this.config.isMain) {
                if (progress >= 0.86) num = 8;
                else if (progress >= 0.72) num = 7;
                else if (progress >= 0.60) num = 6;
                else if (progress >= 0.48) num = 5;
                else if (progress >= 0.36) num = 4;
                else if (progress >= 0.24) num = 3;
                else if (progress >= 0.12) num = 2;
            } else {
                if (progress >= 0.82) num = 6;
                else if (progress >= 0.60) num = 5;
                else if (progress >= 0.47) num = 4;
                else if (progress >= 0.30) num = 3;
                else if (progress >= 0.15) num = 2;
            }
            if (num === this.lastCounterNum) return;
            this.lastCounterNum = num;
            this.counterEl.textContent = '0' + num;
        }
    }

    // ─── INIT ───
    function init() {
        // On mobile, use reduced frame count (every 5th frame) to save memory
        const mobileFrameCount = isLowMemory ? 60 : 300;

        // Initialize the main hero sequence
        new ScrollSequence({
            canvasId: 'hero-canvas',
            sectionId: 'hero',
            totalFrames: mobileFrameCount,
            framePath: 'hero1-frames-full/ezgif-frame-',
            frameExt: '.webp',
            isMain: true,
            frameStep: isLowMemory ? 5 : 1, // Skip frames on mobile
        });

        // Initialize additional hero sequences
        if (document.getElementById('hero2')) {
            new ScrollSequence({
                canvasId: 'hero-canvas-2',
                sectionId: 'hero2',
                totalFrames: mobileFrameCount,
                framePath: 'hero2-frames-png/ezgif-frame-',
                frameExt: '.webp',
                isMain: false,
                frameStep: isLowMemory ? 5 : 1,
            });
        }
        if (document.getElementById('hero6')) {
            new ScrollSequence({
                canvasId: 'hero-canvas-6',
                sectionId: 'hero6',
                totalFrames: mobileFrameCount,
                framePath: 'hero6-frames-png/ezgif-frame-',
                frameExt: '.webp',
                isMain: false,
                frameStep: isLowMemory ? 5 : 1,
            });
        }
        if (document.getElementById('hero5')) {
            new ScrollSequence({
                canvasId: 'hero-canvas-5',
                sectionId: 'hero5',
                totalFrames: mobileFrameCount,
                framePath: 'hero5-frames-png/ezgif-frame-',
                frameExt: '.webp',
                isMain: false,
                frameStep: isLowMemory ? 5 : 1,
            });
        }

        cleanups.push(setupFrameAutoScroll(sequences));
        updateHeroReady();
        pumpPrefetch();

        listen(document, 'visibilitychange', () => {
            for (const seq of sequences) {
                if (document.hidden) {
                    if (seq.rafId) cancelAnimationFrame(seq.rafId);
                    seq.rafId = 0;
                    for (const cancel of seq.pending.values()) cancel();
                    for (let i = 0; i < seq.total; i++) {
                        if (seq.requested[i] === 1) seq.requested[i] = 0;
                    }
                    seq.pruneFrames();
                } else if (seq.isVisible) {
                    seq.onScroll();
                    seq.startRenderLoop();
                }
            }
            pumpLoader();
        });

        // Global resize handler
        const handleResize = debounce(() => {
            for (const seq of sequences) {
                seq.resizeCanvas();
            }
        }, 150);
        listen(window, 'resize', handleResize);

        // Global unified scroll listener (wakes visible sequences and throttles parallax)
        let scrollRaf = false;
        listen(window, 'scroll', () => {
            for (const seq of sequences) {
                if (seq.isVisible) seq.startRenderLoop();
            }
            if (!scrollRaf) {
                scrollRaf = true;
                requestAnimationFrame(() => {
                    updateParallaxEffects();
                    scrollRaf = false;
                });
            }
        }, { passive: true });

        setupRevealObserver();
        setupCategoryFilters();
        setupMarquee();
        setupQualityAnimation();
    }

    // ─── UNIFIED THROTTLED PARALLAX ───
    let arcWrapper = null;
    let arcCenter = null;
    let arcInnerLeft = null;
    let arcInnerRight = null;
    let arcOuterLeft = null;
    let arcOuterRight = null;
    let floaters = [];
    let introOverlay = null;

    function setupParallaxElements() {
        arcWrapper = document.getElementById('arc-wrapper');
        if (arcWrapper) {
            arcCenter = arcWrapper.querySelector('.arc-center');
            arcInnerLeft = arcWrapper.querySelector('.arc-inner-left');
            arcInnerRight = arcWrapper.querySelector('.arc-inner-right');
            arcOuterLeft = arcWrapper.querySelector('.arc-outer-left');
            arcOuterRight = arcWrapper.querySelector('.arc-outer-right');
        }
        floaters = Array.from(document.querySelectorAll('.hover-float-parent'));
        introOverlay = document.getElementById('intro-overlay');
    }

    function updateParallaxEffects() {
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;

        // Intro overlay corner
        if (introOverlay) {
            introOverlay.classList.toggle('is-scrolled', scrollY > 50);
        }

        // Arc gallery (desktop only)
        if (arcWrapper && window.innerWidth > 768) {
            const rect = arcWrapper.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const centerOffset = window.innerHeight / 2;
                const relativeScroll = (rect.top + rect.height / 2 - centerOffset) / centerOffset;
                const scrollVal = clamp(relativeScroll, -1, 1);

                if (arcCenter) arcCenter.style.transform = `translate3d(0, ${scrollVal * -15}px, 0)`;
                if (arcInnerLeft) arcInnerLeft.style.transform = `translate3d(-340px, ${40 + scrollVal * -25}px, -50px) rotate(${-5 + scrollVal * 2}deg)`;
                if (arcInnerRight) arcInnerRight.style.transform = `translate3d(340px, ${40 + scrollVal * -25}px, -50px) rotate(${5 - scrollVal * 2}deg)`;
                if (arcOuterLeft) arcOuterLeft.style.transform = `translate3d(-620px, ${100 + scrollVal * -40}px, -100px) rotate(${-10 + scrollVal * 4}deg)`;
                if (arcOuterRight) arcOuterRight.style.transform = `translate3d(620px, ${100 + scrollVal * -40}px, -100px) rotate(${10 - scrollVal * 4}deg)`;
            }
        }

        // Floaters parallax
        if (floaters.length > 0) {
            const vh = window.innerHeight;
            const viewportCenter = vh / 2;
            for (const el of floaters) {
                if (el.classList.contains('revealed') && !el.classList.contains('arc-center')) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top < vh && rect.bottom > 0) {
                        const elCenter = rect.top + rect.height / 2;
                        const distance = elCenter - viewportCenter;
                        const yOffset = distance * 0.02;
                        el.style.transform = `translate3d(0, ${yOffset}px, 0)`;
                    }
                }
            }
        }
    }

    // ─── SCROLL REVEAL ───
    function setupRevealObserver() {
        const revealElements = document.querySelectorAll('.reveal-element');
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '0px 0px -40px 0px', threshold: 0.1 });
            revealElements.forEach((el) => observer.observe(el));
            cleanups.push(() => observer.disconnect());
        } else {
            revealElements.forEach((el) => el.classList.add('revealed'));
        }
    }

    function clamp(val, min, max) {
        return Math.min(max, Math.max(min, val));
    }

    // ─── CATEGORY FILTERS ───
    function setupCategoryFilters() {
        const buttons = document.querySelectorAll('.cat-filter-btn');
        const cards = document.querySelectorAll('.category-card');

        buttons.forEach((btn) => {
            listen(btn, 'click', () => {
                buttons.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');

                const category = btn.dataset.category;

                cards.forEach((card) => {
                    if (category === 'all' || card.dataset.cat === category) {
                        card.classList.remove('hidden-card');
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        requestAnimationFrame(() => {
                            card.style.transition = 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        });
                    } else {
                        card.classList.add('hidden-card');
                    }
                });
            });
        });
    }

    // ─── MARQUEE SETUP ───
    function setupMarquee() {
        const track = document.getElementById('marquee-track');
        if (!track) return;

        const cards = Array.from(track.children);
        const clones = cards.map((card) => {
            const clone = card.cloneNode(true);
            track.appendChild(clone);
            return clone;
        });
        cleanups.push(() => clones.forEach((clone) => clone.remove()));
    }

    // ─── QUALITY CELEBRATION ───
    function setupQualityAnimation() {
        const qualitySection = document.getElementById('craftsmanship');
        const cards = [
            document.getElementById('quality-card-1'),
            document.getElementById('quality-card-2'),
            document.getElementById('quality-card-3')
        ];

        if (!qualitySection || !cards[0]) return;

        if ('IntersectionObserver' in window) {
            const timers = [];
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        cards.forEach(card => card?.classList?.add('play-quality-animation'));
                        timers.push(setTimeout(() => triggerQualityCelebration(cards[0]), 940));
                        timers.push(setTimeout(() => triggerQualityCelebration(cards[1]), 1340));
                        timers.push(setTimeout(() => triggerQualityCelebration(cards[2]), 1740));
                        observer.unobserve(qualitySection);
                    }
                });
            }, { rootMargin: '0px 0px -100px 0px', threshold: 0.2 });
            observer.observe(qualitySection);
            cleanups.push(() => {
                observer.disconnect();
                timers.forEach(clearTimeout);
            });
        } else {
            cards.forEach(card => card?.classList?.add('play-quality-animation'));
        }
    }

    function triggerQualityCelebration(card) {
        if (!card) return;
        const crack = card.querySelector('.impact-crack');
        if (crack) crack.classList.add('crack-animate');

        const numParticles = 4;
        const positions = [
            { x: '10%', y: '-20px', drift: '-25px', type: 'rectangle' },
            { x: '85%', y: '-10px', drift: '30px', type: 'diamond' },
            { x: '25%', y: '-25px', drift: '-15px', type: 'diamond' },
            { x: '70%', y: '-20px', drift: '20px', type: 'rectangle' }
        ];

        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = `celebration-particle ${positions[i].type}`;
            particle.style.left = positions[i].x;
            particle.style.top = positions[i].y;
            particle.style.setProperty('--drift-x', positions[i].drift);
            card.appendChild(particle);

            requestAnimationFrame(() => {
                particle.classList.add('particle-fall');
            });
            setTimeout(() => particle.remove(), 1600);
        }
    }

    // ─── UTILITIES ───
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function debounce(fn, delay) {
        let timer;
        cleanups.push(() => clearTimeout(timer));
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    window.__rkHeroReady = false;
    window.__rkHeroProgress = 0;

    // ─── BOOT ───
    if (document.readyState === 'loading') {
        listen(document, 'DOMContentLoaded', () => {
            setupParallaxElements();
            init();
        }, { once: true });
    } else {
        setupParallaxElements();
        init();
    }

    return () => {
        abort.abort();
        cleanups.forEach((fn) => fn());
        sequences.length = 0;
    };
}
