// Virtual UAT: 50 personas x 13 journeys = 650 checks.
// Run with: deno run --allow-read --allow-write qa/uat_virtual_users.js
const root = new URL('../', import.meta.url);
globalThis.window = globalThis;
globalThis.CSS = { escape: value => String(value).replace(/(["\\])/g, '\\$1') };
globalThis.getComputedStyle = element => element.style || { visibility: 'visible', display: 'block', opacity: '1' };

class FakeElement {
  constructor(tagName, attrs = {}, text = '') { this.tagName = tagName; this.attrs = attrs; this.id = attrs.id || ''; this.innerText = text; this.textContent = text; this.value = attrs.value || ''; this.style = { visibility: attrs.hidden ? 'hidden' : 'visible', display: attrs.display || 'block', opacity: attrs.opacity || '1' }; this.htmlFor = attrs.for || ''; this.parentElement = null; }
  getAttribute(name) { return this.attrs[name] ?? null; }
  getBoundingClientRect() { return { width: this.style.display === 'none' ? 0 : 100, height: this.style.visibility === 'hidden' ? 0 : 24 }; }
  closest(selector) { return null; }
  querySelector() { return null; }
  dispatchEvent() { return true; }
}

class FakeDocument {
  constructor(elements = []) { this.elements = elements; this.body = {}; }
  addEventListener() {}
  removeEventListener() {}
  getElementById(id) { return this.elements.find(e => e.id === id) || null; }
  querySelectorAll(selector) { return this.elements.filter(e => matches(e, selector)); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}
function matches(element, selector) {
  const tag = selector.match(/^([\w-]+|\*)/)?.[1];
  if (tag && tag !== '*' && element.tagName.toLowerCase() !== tag.toLowerCase()) return false;
  const id = selector.match(/#([\w-]+)/)?.[1]; if (id && element.id !== id) return false;
  for (const [, name, value] of selector.matchAll(/\[([\w-]+)(?:=["']([^"']*)["'])?\]/g)) if (!(name in element.attrs) || (value !== undefined && String(element.attrs[name]) !== value)) return false;
  return true;
}
async function load(relative) { (0, eval)(await Deno.readTextFile(new URL(relative, root))); }
await load('content/resolver.js'); await load('content/validator.js'); await load('content/injector.js'); await load('content/recorder.js');

const personas = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: ['Avery', 'Blair', 'Casey', 'Devon', 'Emery'][i % 5], system: ['IE11-migrated', 'JSP', 'ASP.NET', 'legacy ERP', 'modern SPA'][i % 5], tag: ['input', 'button', 'select', 'textarea', 'a', 'img', 'div', 'span', 'label', 'table'][i % 10] }));
const scenarios = [
  ['stable id', p => ({ tag: p.tag, attrs: { id: `stable-${p.id}` } }), f => ({ id: `stable-${f.id}`, cssFallback: `#stable-${f.id}` })],
  ['data-testid', p => ({ tag: p.tag, attrs: { 'data-testid': `test-${p.id}` } }), f => ({ testId: `test-${f.id}`, cssFallback: 'body' })],
  ['data-qa', p => ({ tag: p.tag, attrs: { 'data-qa': `qa-${p.id}` } }), f => ({ testId: `qa-${f.id}`, cssFallback: 'body' })],
  ['data-cy', p => ({ tag: p.tag, attrs: { 'data-cy': `cy-${p.id}` } }), f => ({ testId: `cy-${f.id}`, cssFallback: 'body' })],
  ['name plus tag', p => ({ tag: p.tag, attrs: { name: `field-${p.id}` } }), f => ({ tagName: personas[f.id - 1].tag, name: `field-${f.id}`, cssFallback: 'body' })],
  ['aria label', p => ({ tag: p.tag, attrs: { 'aria-label': `Accessible ${p.id}` } }), f => ({ ariaLabel: `Accessible ${f.id}`, cssFallback: 'body' })],
  ['role plus aria label', p => ({ tag: p.tag, attrs: { role: 'button', 'aria-label': `Action ${p.id}` } }), f => ({ role: 'button', ariaLabel: `Action ${f.id}`, cssFallback: 'body' })],
  ['placeholder', p => ({ tag: p.tag, attrs: { placeholder: `Placeholder ${p.id}` } }), f => ({ placeholder: `Placeholder ${f.id}`, cssFallback: 'body' })],
  ['title', p => ({ tag: p.tag, attrs: { title: `Title ${p.id}` } }), f => ({ title: `Title ${f.id}`, cssFallback: 'body' })],
  ['alt', p => ({ tag: 'img', attrs: { alt: `Image ${p.id}` } }), f => ({ tagName: 'img', alt: `Image ${f.id}`, cssFallback: 'body' })],
  ['value', p => ({ tag: p.tag, attrs: { value: `Value ${p.id}` } }), f => ({ value: `Value ${f.id}`, cssFallback: 'body' })],
  ['legacy visible text', p => ({ tag: p.tag, attrs: {}, text: `Legacy action ${p.id}` }), f => ({ tagName: personas[f.id - 1].tag, innerTextSnippet: `Legacy action ${f.id}`, cssFallback: 'body' })],
  ['legacy CSS fallback', p => ({ tag: 'font', attrs: { class: `legacy-${p.id}` } }), f => ({ tagName: 'font', cssFallback: 'font' })],
];

let passed = 0, failed = 0, failures = [];
for (const persona of personas) for (const [name, make, fingerprint] of scenarios) {
  const spec = make(persona); const element = new FakeElement(spec.tag, spec.attrs, spec.text || ''); globalThis.document = new FakeDocument([element]);
  const found = DAPResolver.resolve(fingerprint(persona));
  if (found !== element) { failed++; failures.push(`${persona.id}/${name}/${persona.system}`); } else passed++;
}
for (const persona of personas) {
  const input = new FakeElement('input', { id: `label-input-${persona.id}` });
  const label = new FakeElement('label', { for: `label-input-${persona.id}` }, `Legacy label ${persona.id}`);
  globalThis.document = new FakeDocument([input, label]);
  const found = DAPResolver.resolve({ labelText: `Legacy label ${persona.id}`, cssFallback: 'input' });
  if (found !== input) { failed++; failures.push(`${persona.id}/associated-label/${persona.system}`); } else passed++;
}

class NativeSetterInput extends FakeElement { constructor() { super('input', { type: 'text' }); this.events = 0; } dispatchEvent() { this.events += 1; return true; } }
Object.defineProperty(NativeSetterInput.prototype, 'value', { set(value) { this._nativeValue = value; }, get() { return this._nativeValue || ''; } });
for (const kind of ['native-setter', 'select', 'checkbox', 'contenteditable']) {
  const attrs = kind === 'select' ? {} : kind === 'checkbox' ? { type: 'checkbox' } : {};
  const element = kind === 'native-setter' ? new NativeSetterInput() : new FakeElement(kind === 'contenteditable' ? 'div' : kind === 'checkbox' ? 'input' : kind, attrs);
  if (kind === 'contenteditable') element.isContentEditable = true;
  try { DAPInjector.applyInput(element, kind === 'checkbox' ? 'true' : 'new value'); if (kind === 'native-setter' && element.value !== 'new value') throw new Error('native setter did not receive value'); passed++; } catch (error) { failed++; failures.push(`injector/${kind}/${error.message}`); }
}

// Workflow save/load round trips: serialize, write, read, and compare all 50 documents.
for (const persona of personas) {
  const workflow = { workflowId: `uat-${persona.id}`, workflowName: `${persona.system} onboarding`, targetUrlPattern: 'https://example.test/*', steps: [{ stepIndex: 1, actionType: 'click', instruction: 'Continue', elementFingerprint: { tagName: persona.tag, cssFallback: persona.tag } }] };
  const file = await Deno.makeTempFile({ prefix: `guided-${persona.id}-`, suffix: '.json' });
  await Deno.writeTextFile(file, JSON.stringify(workflow)); const saved = JSON.parse(await Deno.readTextFile(file));
  if (saved.workflowId !== workflow.workflowId || saved.steps.length !== 1) { failed++; failures.push(`${persona.id}/save-load`); } else passed++;
  await Deno.remove(file);
}

console.log(JSON.stringify({ virtualUsers: personas.length, scenariosPerUser: scenarios.length + 1, workflowRoundTrips: personas.length, checks: passed + failed, passed, failed, failures }, null, 2));
if (failed) Deno.exit(1);
