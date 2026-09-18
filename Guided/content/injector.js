class DAPInjector {
  static resolveValue(value, variables = {}) { return typeof value === 'string' ? value.replace(/\$\{(.*?)\}/g, (_, key) => variables[key.trim()] ?? _) : value; }
  static applyInput(element, value) {
    if (!element) throw new Error('Cannot inject into a missing element.');
    const stringValue = value == null ? '' : String(value);
    const tag = String(element.tagName || '').toLowerCase();
    if (tag === 'input' && ['checkbox', 'radio'].includes(String(element.type || '').toLowerCase())) {
      element.checked = ['true', '1', 'yes', 'on'].includes(stringValue.toLowerCase());
    } else if (tag === 'select') {
      const setter = this.findSetter(element, 'value');
      if (setter) setter.call(element, stringValue); else element.value = stringValue;
    } else if (element.isContentEditable || element.getAttribute?.('contenteditable') === 'true') {
      element.textContent = stringValue;
    } else {
      const setter = this.findSetter(element, 'value');
      if (setter) setter.call(element, stringValue); else element.value = stringValue;
    }
    for (const type of ['input', 'change', 'blur']) element.dispatchEvent(new Event(type, { bubbles: true }));
  }
  static findSetter(element, property) { let prototype = element; while (prototype) { const descriptor = Object.getOwnPropertyDescriptor(prototype, property); if (descriptor?.set) return descriptor.set; prototype = Object.getPrototypeOf(prototype); } return null; }
}
window.DAPInjector = DAPInjector;
