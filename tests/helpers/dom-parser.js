/**
 * Zero-dependency HTML Parser & DOM Inspector for 1files E2E Tests.
 * Extracts elements, attributes, text, and provides querySelector/querySelectorAll functionality.
 */

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

class DOMElement {
  constructor(tag, attributes = {}, innerHTML = '', outerHTML = '') {
    this.tagName = tag.toUpperCase();
    this.attributes = attributes;
    this.innerHTML = innerHTML;
    this.outerHTML = outerHTML;
    this.id = attributes.id || '';
    this.className = attributes.class || '';
    this.classList = new Set((attributes.class || '').split(/\s+/).filter(Boolean));
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name);
  }

  get textContent() {
    return this.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  matches(selector) {
    selector = selector.trim();
    if (!selector) return false;

    // Multiple selectors separated by comma
    if (selector.includes(',')) {
      const parts = selector.split(',').map(s => s.trim());
      return parts.some(p => this.matches(p));
    }

    // ID selector
    if (selector.startsWith('#')) {
      return this.id === selector.slice(1);
    }

    // Class selector
    if (selector.startsWith('.')) {
      return this.classList.has(selector.slice(1));
    }

    // Attribute selector [attr] or [attr="val"] or [attr*="val"]
    const attrMatch = selector.match(/^\[([a-zA-Z0-9_\-]+)(?:([*~^$]?=)(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]$/);
    if (attrMatch) {
      const attrName = attrMatch[1];
      const op = attrMatch[2];
      const expectedVal = attrMatch[3] ?? attrMatch[4] ?? attrMatch[5];
      if (!this.hasAttribute(attrName)) return false;
      if (expectedVal !== undefined) {
        const actualVal = this.getAttribute(attrName) || '';
        if (op === '*=') return actualVal.includes(expectedVal);
        if (op === '^=') return actualVal.startsWith(expectedVal);
        if (op === '$=') return actualVal.endsWith(expectedVal);
        return actualVal === expectedVal;
      }
      return true;
    }

    // Compound: tag[attr] or tag.class or tag#id
    const compoundMatch = selector.match(/^([a-zA-Z0-9\-]+)(.*)$/);
    if (compoundMatch) {
      const tag = compoundMatch[1].toUpperCase();
      const rest = compoundMatch[2];
      if (this.tagName !== tag) return false;
      if (!rest) return true;
      if (rest.startsWith('.')) return this.classList.has(rest.slice(1));
      if (rest.startsWith('#')) return this.id === rest.slice(1);

      const subAttr = rest.match(/^\[([a-zA-Z0-9_\-]+)(?:([*~^$]?=)(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]$/);
      if (subAttr) {
        const attrName = subAttr[1];
        const op = subAttr[2];
        const expectedVal = subAttr[3] ?? subAttr[4] ?? subAttr[5];
        if (!this.hasAttribute(attrName)) return false;
        if (expectedVal !== undefined) {
          const actualVal = this.getAttribute(attrName) || '';
          if (op === '*=') return actualVal.includes(expectedVal);
          if (op === '^=') return actualVal.startsWith(expectedVal);
          if (op === '$=') return actualVal.endsWith(expectedVal);
          return actualVal === expectedVal;
        }
        return true;
      }
    }

    return this.tagName === selector.toUpperCase();
  }

  querySelector(selector) {
    const subDOM = parseHTML(this.innerHTML);
    return subDOM.querySelector(selector);
  }

  querySelectorAll(selector) {
    const subDOM = parseHTML(this.innerHTML);
    return subDOM.querySelectorAll(selector);
  }
}

/**
 * Parses raw HTML string into array of DOMElement objects.
 */
function parseHTML(html) {
  const elements = [];
  const tagRegex = /<([a-zA-Z0-9\-]+)((?:\s+[^>]*?)?)(\/?>)/gi;
  let m;

  while ((m = tagRegex.exec(html)) !== null) {
    const tag = m[1];
    const rawAttrs = m[2] || '';
    const isSelfClosing = m[3] === '/>' || VOID_TAGS.has(tag.toLowerCase());
    const openStart = m.index;
    const openEnd = m.index + m[0].length;

    let innerHTML = '';
    let outerHTML = m[0];

    if (!isSelfClosing) {
      const lowerTag = tag.toLowerCase();
      let depth = 1;
      const searchRegex = new RegExp('<(/?' + tag + ')(?:\\s+[^>]*)?>', 'gi');
      searchRegex.lastIndex = openEnd;
      let sm;
      while ((sm = searchRegex.exec(html)) !== null) {
        if (sm[1].startsWith('/')) {
          depth--;
          if (depth === 0) {
            innerHTML = html.slice(openEnd, sm.index);
            outerHTML = html.slice(openStart, sm.index + sm[0].length);
            break;
          }
        } else if (!VOID_TAGS.has(lowerTag)) {
          depth++;
        }
      }
    }

    const attributes = parseAttributes(rawAttrs);
    elements.push(new DOMElement(tag, attributes, innerHTML, outerHTML));
  }

  return {
    elements,
    querySelectorAll(selector) {
      return elements.filter(el => el.matches(selector));
    },
    querySelector(selector) {
      return elements.find(el => el.matches(selector)) || null;
    },
    getElementById(id) {
      return elements.find(el => el.id === id) || null;
    },
    getElementsByTagName(tag) {
      const upper = tag.toUpperCase();
      return elements.filter(el => el.tagName === upper);
    },
    getElementsByClassName(className) {
      return elements.filter(el => el.classList.has(className));
    }
  };
}

/**
 * Parses HTML tag attribute string into key-value map.
 */
function parseAttributes(attrString) {
  const attributes = {};
  if (!attrString) return attributes;

  // Regex handles key="val", key='val', key=val, and boolean attributes
  const attrRegex = /([a-zA-Z0-9_\-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while ((m = attrRegex.exec(attrString)) !== null) {
    const key = m[1].toLowerCase();
    const val = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : '';
    attributes[key] = val;
  }
  return attributes;
}

/**
 * Extracts all inline scripts from HTML.
 */
function extractScripts(html) {
  const scripts = [];
  const regex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  return scripts;
}

/**
 * Extracts all inline styles from HTML.
 */
function extractStyles(html) {
  const styles = [];
  const regex = /<style(?:\s+[^>]*)?>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    styles.push(match[1]);
  }
  return styles;
}

module.exports = {
  parseHTML,
  parseAttributes,
  extractScripts,
  extractStyles,
  DOMElement
};
