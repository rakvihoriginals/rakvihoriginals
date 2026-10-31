const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
class Element extends EventTarget {
  constructor(direction) { super(); this.dataset = { frameAutoDirection: String(direction) }; this.attributes = {}; }
  setAttribute(name, value) { this.attributes[name] = value; }
  closest() { return this.control ? this : null; }
}
const windowMock = new EventTarget();
windowMock.scrollY = 200;
windowMock.scrollTo = ({ top, behavior }) => { assert.equal(behavior, 'instant'); windowMock.scrollY = top; };
const documentMock = new EventTarget();
documentMock.hidden = false;
let now = 0, nextId = 0;
const callbacks = new Map();
const sandbox = { exports: {}, AbortController, Element, document: documentMock, window: windowMock,
  performance: { now: () => now },
  requestAnimationFrame(fn) { callbacks.set(++nextId, fn); return nextId; },
  cancelAnimationFrame(id) { callbacks.delete(id); },
};
vm.createContext(sandbox);
vm.runInContext(ts.transpileModule(fs.readFileSync('src/lib/frameAutoScroll.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, sandbox);
function fixture() {
  const buttons = [-1, 1].map(direction => { const button = new Element(direction); button.control = true; return button; });
  const status = { textContent: 'Paused' };
  const root = { dataset: {}, style: { setProperty() {} }, querySelector: () => status, querySelectorAll: () => buttons };
  return { buttons, status, sequence: { section: { querySelector: () => root }, containerTop: 0, effectiveHeight: 1000, total: 101, measure() {} } };
}
const first = fixture(), second = fixture();
const dispose = sandbox.exports.setupFrameAutoScroll([first.sequence, second.sequence]);
const click = button => button.dispatchEvent(new Event('click'));
const advance = () => { now += 16; const batch = [...callbacks.values()]; callbacks.clear(); batch.forEach(fn => fn(now)); };
click(first.buttons[1]);
assert.equal(callbacks.size, 1);
advance();
assert.ok(windowMock.scrollY > 200, 'forward scroll advances');
assert.equal(first.buttons[1].attributes['aria-pressed'], 'true');
click(first.buttons[1]);
assert.equal(callbacks.size, 0, 'same button toggles off');
const stopped = windowMock.scrollY;
advance(); assert.equal(windowMock.scrollY, stopped);
click(first.buttons[1]); click(first.buttons[0]);
assert.equal(callbacks.size, 1, 'changing direction cannot leave two loops');
advance(); assert.ok(windowMock.scrollY < stopped, 'reverse scroll goes backward');
click(second.buttons[1]);
assert.equal(first.buttons[0].attributes['aria-pressed'], 'false', 'old section is switched off');
assert.equal(callbacks.size, 1);
windowMock.dispatchEvent(new Event('wheel'));
assert.equal(callbacks.size, 0, 'manual wheel cancels');
click(first.buttons[1]);
documentMock.hidden = true; documentMock.dispatchEvent(new Event('visibilitychange'));
assert.equal(callbacks.size, 0, 'hidden tab cancels');
documentMock.hidden = false;
assert.equal(callbacks.size, 0, 'returning does not resume unexpectedly');
click(first.buttons[1]); windowMock.scrollY += 25; advance();
assert.equal(callbacks.size, 0, 'external scrollbar movement cancels');
windowMock.scrollY = 999; click(first.buttons[1]); advance();
assert.equal(windowMock.scrollY, 1000); assert.equal(callbacks.size, 0, 'forward stops at section end');
windowMock.scrollY = 1; click(first.buttons[0]); advance();
assert.equal(windowMock.scrollY, 0); assert.equal(callbacks.size, 0, 'back stops at section start');
click(first.buttons[0]); assert.equal(callbacks.size, 0, 'cannot run beyond boundary');
click(first.buttons[1]); dispose();
assert.equal(callbacks.size, 0, 'cleanup cancels animation');
click(first.buttons[1]); assert.equal(callbacks.size, 0, 'cleanup removes click listeners');
console.log('PASS: forward/back, on/off, direction changes, one loop, manual interruption, visibility, boundaries, cleanup');
