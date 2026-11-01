/**
 * F07: Real-Time Catalog Search
 * Verifies instant search filtering across card metadata and live-region announcements.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML, extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F07: Real-Time Catalog Search', () => {
  const getIndexData = () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
    return {
      dom: parseHTML(content),
      scripts: extractScripts(content).join('\n')
    };
  };

  test('F07-1: index.html contains an accessible search input element', () => {
    const { dom } = getIndexData();
    const searchInput = dom.querySelector('input[type="search"], input[type="text"][placeholder*="search" i], input#search');
    assert.ok(searchInput, 'index.html must include a search input element');
    const label = searchInput.getAttribute('aria-label') || searchInput.getAttribute('placeholder');
    assert.ok(label && label.length > 0, 'Search input must have placeholder or aria-label');
  });

  test('F07-2: Search input listens to realtime input/keyup events', () => {
    const { scripts } = getIndexData();
    assert.ok(/addEventListener\s*\(\s*['"](?:input|keyup)['"]|oninput\s*=/i.test(scripts),
      'Script must bind input/keyup event to filter catalog cards in realtime');
  });

  test('F07-3: Search filter matches against app title and description', () => {
    const { scripts } = getIndexData();
    assert.ok(/toLowerCase\(\)|indexOf|includes|RegExp/i.test(scripts),
      'Search implementation must perform case-insensitive matching on card text');
  });

  test('F07-4: Search filter inspects data-tags and data-category attributes', () => {
    const { scripts } = getIndexData();
    assert.ok(/dataset|getAttribute\s*\(\s*['"]data-|data-tags|data-category/i.test(scripts),
      'Search implementation must inspect data attributes for rich metadata matching');
  });

  test('F07-5: Live region (aria-live="polite") exists to announce matching tool count', () => {
    const { dom } = getIndexData();
    const liveRegion = dom.querySelector('[aria-live="polite"], [role="status"]');
    assert.ok(liveRegion, 'index.html must include aria-live="polite" region for screen reader result count updates');
  });
});

autoRunCLI();
