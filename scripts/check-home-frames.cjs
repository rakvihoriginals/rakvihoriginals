// Deterministic regressions for the actual frame loader, including slow/out-of-order decode.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
let source = fs.readFileSync('src/hooks/useScrollSequence.ts', 'utf8')
  .replace("import { setupFrameAutoScroll } from '@/lib/frameAutoScroll';", 'const setupFrameAutoScroll = () => () => {};')
  .replace('export function initScrollSequence(): () => void {', 'function initScrollSequence() {');
source = source.slice(0, source.indexOf('    // ─── BOOT')) + `
return { ScrollSequence, pumpLoader, sequences, dispose() { abort.abort(); cleanups.forEach(fn => fn()); } }; }
engine = initScrollSequence();`;
const tick = () => new Promise(resolve => setImmediate(resolve));
async function check(mobile = false, reduced = false, missingOptimized = false) {
  let active = 0, peakActive = 0, requests = 0, draws = 0;
  const pending = [];
  const container = { getBoundingClientRect: () => ({ top: 0, height: 10000 }), offsetHeight: 10000 };
  const canvas = { style: {}, getContext: () => ({ setTransform() {}, drawImage(img) { assert.ok(img.src); draws++; } }) };
  const section = { querySelector: selector => selector === '.hero-scroll-container' ? container : null, querySelectorAll: () => [] };
  const sandbox = {
    AbortController, performance, console,
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    IntersectionObserver: class { observe() {} disconnect() {} },
    Image: class {
      naturalWidth = mobile ? 720 : 1280; naturalHeight = mobile ? 405 : 720;
      set src(value) {
        this.url = value; requests++; active++; peakActive = Math.max(active, peakActive);
        pending.push(() => {
          if (missingOptimized && value.startsWith('/home-frames/')) {
            active--;
            if (this.onerror) this.onerror();
          } else if (this.onload) this.onload();
        });
      }
      get src() { return this.url; }
      removeAttribute() { this.url = ''; }
      async decode() { active--; }
    },
    document: { hidden: false, getElementById: id => id.includes('canvas') ? canvas : section, documentElement: { scrollTop: 0 } },
    window: { matchMedia: query => ({ matches: query.includes('reduced-motion') ? reduced : mobile }), innerWidth: 1440, innerHeight: 900, devicePixelRatio: 2, scrollY: 0 },
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  const engine = sandbox.engine;
  // A direction change can happen while the eased playhead is still moving
  // forward. Missing frames must not flash a later close-up and then jump back.
  const main = Object.create(engine.ScrollSequence.prototype);
  main.config = { isMain: true };
  main.total = 300;
  main.images = [];
  main.images[0] = main.images[130] = main.images[132] = {};
  main.drawnIndex = 130;
  main.direction = -1;
  assert.equal(main.getFrameToDraw(131), 130, 'hero holds the current shot instead of flashing a future shot');
  main.images[131] = {};
  assert.equal(main.getFrameToDraw(131), 131, 'hero advances when the intended frame finishes decoding');
  main.drawnIndex = 132;
  main.direction = 1;
  delete main.images[131];
  delete main.images[130];
  assert.equal(main.getFrameToDraw(131), 132, 'reverse playback does not flash the opening poster');
  main.images[131] = {};
  assert.equal(main.getFrameToDraw(131), 131, 'reverse playback resumes when its frame is ready');
  main.drawnIndex = 130;
  main.images[130] = {};
  assert.equal(main.getFrameToDraw(140), 132, 'a decoded intermediate frame still advances playback');
  const sequences = [300, 300, 300, 300].map((totalFrames, i) => new engine.ScrollSequence({ canvasId: 'canvas', sectionId: 'hero', totalFrames, framePath: 'film-', frameExt: '.webp', isMain: i === 0 }));
  async function drain() {
    let rounds = 0;
    while (pending.length) {
      assert.ok(++rounds < 100, 'loader must settle, not continually evict/reload');
      pending.pop()(); // Complete in reverse order to catch late-frame regressions.
      await tick();
    }
  }
  await drain();
  assert.equal(requests, missingOptimized ? 2 : 1, 'only main poster loads before visibility, with original fallback if needed');
  for (const seq of sequences) {
    seq.isNear = seq.isVisible = true;
    seq.startLoading();
    for (const target of [0, 60, 300, seq.total - 1, 200, 30, 0]) {
      seq.direction = target >= seq.targetFrame ? 1 : -1;
      seq.targetFrame = reduced ? 0 : Math.min(target, seq.total - 1);
      seq.lerpedFrame = Math.max(0, seq.targetFrame - 50);
      seq.pruneFrames();
      engine.pumpLoader();
      await drain();
      seq.lerpedFrame = seq.targetFrame;
      engine.pumpLoader();
      await drain();
      seq.drawFrame(seq.targetFrame);
      assert.equal(seq.drawnIndex, seq.targetFrame, 'target frame becomes available');
      assert.ok(seq.images.filter(Boolean).length <= 40, 'frame retention is bounded');
      assert.ok(seq.images.length <= seq.total, 'last frame is clamped');
    }
    const idleRequests = requests;
    engine.pumpLoader();
    await drain();
    assert.equal(requests, idleRequests, 'no requests when buffer is ready');
    seq.isNear = seq.isVisible = false;
    seq.pruneFrames();
    assert.ok(seq.images.filter(Boolean).length <= 2, 'offscreen frames released');
  }
  assert.ok(peakActive <= 4, 'decode concurrency is global and bounded');
  if (!reduced) {
    const seq = sequences[0];
    seq.isVisible = true;
    seq.direction = 1;
    seq.targetFrame = seq.lerpedFrame = 120;
    const loading = seq.loadFrame(120);
    // Manual scroll overtakes the request before it finishes decoding.
    seq.targetFrame = seq.lerpedFrame = 160;
    while (pending.length) { pending.shift()(); await tick(); }
    await loading;
    assert.ok(seq.images[120], 'late completion remains available after scrolling past its request window');
    seq.drawFrame(160);
    assert.equal(seq.drawnIndex, 120, 'late completion advances the canvas instead of freezing on the poster');
    seq.isVisible = false;
    seq.pruneFrames();
  }
  const beforeHidden = requests;
  sandbox.document.hidden = true;
  engine.pumpLoader();
  assert.equal(requests, beforeHidden, 'hidden tab cannot load more frames');
  if (!reduced) {
    sandbox.document.hidden = false;
    const seq = sequences[0];
    seq.isVisible = true;
    seq.targetFrame = 500;
    seq.lerpedFrame = 450;
    engine.pumpLoader();
    assert.ok(pending.length > 0, 'exercise disposal while requests are in flight');
  }
  const beforeDispose = draws;
  engine.dispose();
  await drain();
  assert.equal(draws, beforeDispose, 'no rendering after disposal');
  assert.ok(sequences.every(seq => seq.images.filter(Boolean).length === 0), 'unmount releases all images');
  console.log(`PASS ${mobile ? 'mobile' : 'desktop'}${reduced ? ' reduced motion' : ''}${missingOptimized ? ' missing optimized assets' : ''}: bounded memory/concurrency, forward/reverse/jumps, idle, hidden, cleanup`);
}
(async () => { await check(); await check(true); await check(false, true); await check(false, false, true); })().catch(error => { console.error(error); process.exitCode = 1; });
