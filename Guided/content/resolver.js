class DAPResolver {
  static resolve(fingerprint) {
    if (!fingerprint || typeof fingerprint !== 'object') return null;
    const q = selector => { try { const el = document.querySelector(selector); return el && this.isVisible(el) ? el : null; } catch (_) { return null; } };
    const attr = (name, value, tag = '') => value ? q(`${tag}[${name}="${CSS.escape(String(value))}"]`) : null;
    if (fingerprint.testId) for (const name of ['data-testid', 'data-qa', 'data-cy']) { const el = attr(name, fingerprint.testId); if (el) return el; }
    if (fingerprint.id) { const el = document.getElementById(fingerprint.id); if (el && this.isVisible(el)) return el; }
    if (fingerprint.labelText) {
      const label = Array.from(document.querySelectorAll('label')).find(el => this.text(el) === String(fingerprint.labelText).trim());
      if (label?.htmlFor) { const el = document.getElementById(label.htmlFor); if (el && this.isVisible(el)) return el; }
      const nested = label?.querySelector('input,select,textarea,button,[role]'); if (nested && this.isVisible(nested)) return nested;
    }
    if (fingerprint.role && fingerprint.ariaLabel) { const el = attr('aria-label', fingerprint.ariaLabel, `[role="${CSS.escape(fingerprint.role)}"]`); if (el) return el; }
    if (fingerprint.name) { const el = attr('name', fingerprint.name, fingerprint.tagName || ''); if (el) return el; }
    for (const [name, value] of [['aria-label', fingerprint.ariaLabel], ['placeholder', fingerprint.placeholder], ['title', fingerprint.title], ['alt', fingerprint.alt], ['value', fingerprint.value]]) { const el = attr(name, value); if (el) return el; }
    if (fingerprint.innerTextSnippet) { const tag = fingerprint.tagName || '*'; const match = Array.from(document.querySelectorAll(tag)).find(el => this.text(el).startsWith(String(fingerprint.innerTextSnippet).trim()) && this.isVisible(el)); if (match) return match; }
    return fingerprint.cssFallback ? q(fingerprint.cssFallback) : null;
  }
  static waitForElement(fingerprint, timeout = 7000) { return new Promise((resolve, reject) => { const immediate = this.resolve(fingerprint); if (immediate) return resolve(immediate); const observer = new MutationObserver(() => { const el = this.resolve(fingerprint); if (el) { observer.disconnect(); clearTimeout(timer); resolve(el); } }); observer.observe(document.body, { childList: true, subtree: true, attributes: true }); const timer = setTimeout(() => { observer.disconnect(); reject(new Error('Element not found')); }, timeout); }); }
  static text(el) { return String(el?.innerText || el?.textContent || '').replace(/\s+/g, ' ').trim(); }
  static isVisible(el) { const rect = el.getBoundingClientRect(); const style = getComputedStyle(el); return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0'; }
}
window.DAPResolver = DAPResolver;
