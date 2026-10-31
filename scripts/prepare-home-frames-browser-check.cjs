// Temporary, local-only browser fixture using the actual frame engine and assets.
// Run this, start the site, then open /__home-frames-check.html. Remove the
// generated HTML before publishing. This does not alter the production page.
const fs = require('node:fs');
let engine = fs.readFileSync('src/hooks/useScrollSequence.ts', 'utf8')
  .replace("import { setupFrameAutoScroll } from '@/lib/frameAutoScroll';", 'const setupFrameAutoScroll = () => () => {};')
  .replace('export function initScrollSequence(): () => void {', 'function initScrollSequence() {')
  .replace('    // ─── BOOT', `
    window.readFrameStats = () => ({
      images: sequences.reduce((sum, seq) => sum + seq.images.filter(Boolean).length, 0),
      bytes: sequences.reduce((sum, seq) => sum + seq.images.reduce((n, img) => n + (img ? img.naturalWidth * img.naturalHeight * 4 : 0), 0), 0),
      pending: inflight,
      errors: sequences.reduce((sum, seq) => sum + seq.requested.filter(value => value === 3).length, 0),
      indices: sequences.map(seq => seq.drawnIndex),
    });
    // ─── BOOT`);
const sections = [['hero', 'hero-canvas'], ['hero2', 'hero-canvas-2'], ['hero6', 'hero-canvas-6'], ['hero5', 'hero-canvas-5']];
const html = `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><title>Home frames browser check</title>
<style>html{scroll-behavior:auto}body{margin:0;background:#111;color:white;font:14px system-ui}.hero-scroll-container{height:600vh}.sticky{position:sticky;top:0;height:100vh;overflow:hidden}canvas{width:100%;height:100%}header{position:fixed;z-index:5;top:12px;left:12px;background:#111e;padding:12px;border-radius:8px}pre{white-space:pre-wrap;max-width:90vw}button{padding:10px;cursor:pointer}</style>
<header><button id="run">Run forward/reverse check</button><pre id="report">Ready. Uses real images and real canvas rendering.</pre></header>
${sections.map(([id, canvas]) => `<section id="${id}"><div class="hero-scroll-container"><div class="sticky"><canvas id="${canvas}"></canvas></div></div></section>`).join('')}
<script>${engine}
const dispose = initScrollSequence();
const report = document.getElementById('report');
document.getElementById('run').onclick = async () => {
  document.getElementById('run').disabled = true;
  const intervals = []; let peakImages = 0, peakBytes = 0, peakPending = 0, errors = 0, updates = 0, previous = [];
  let previousTime = 0;
  const sample = now => {
    if (previousTime) intervals.push(now - previousTime);
    previousTime = now;
    const stats = window.readFrameStats();
    peakImages = Math.max(peakImages, stats.images); peakBytes = Math.max(peakBytes, stats.bytes); peakPending = Math.max(peakPending, stats.pending); errors = Math.max(errors, stats.errors);
    stats.indices.forEach((value, i) => { if (value !== previous[i] && value >= 0) updates++; }); previous = stats.indices;
  };
  const sweep = (from, to, duration) => new Promise(resolve => {
    const start = performance.now(); previousTime = 0;
    function step(now) {
      sample(now);
      const progress = Math.min(1, (now - start) / duration);
      window.scrollTo(0, from + (to - from) * progress);
      if (progress < 1) requestAnimationFrame(step); else resolve();
    }
    requestAnimationFrame(step);
  });
  for (const section of document.querySelectorAll('section')) {
    const from = section.offsetTop, to = from + section.offsetHeight - innerHeight;
    report.textContent = 'Testing ' + section.id + ': forward then reverse...';
    await sweep(from, to, 2500); await sweep(to, from, 1500);
  }
  intervals.sort((a,b) => a-b);
  report.textContent = JSON.stringify({
    viewport: innerWidth + 'x' + innerHeight,
    samples: intervals.length, p95FrameIntervalMs: +intervals[Math.floor(intervals.length * .95)].toFixed(1),
    framesOver50ms: intervals.filter(ms => ms > 50).length,
    peakRetainedImages: peakImages, peakDecodedImageMiB: +(peakBytes / 1048576).toFixed(1), peakConcurrentLoads: peakPending, failedFrames: errors, drawnFrameChanges: updates,
    note: 'Decoded image estimate excludes browser caches, canvas and other process memory.'
  }, null, 2);
  document.getElementById('run').disabled = false;
};
</script>`;
fs.writeFileSync('public/__home-frames-check.html', html);
console.log('Ready: /__home-frames-check.html (remove generated fixture before publishing)');
