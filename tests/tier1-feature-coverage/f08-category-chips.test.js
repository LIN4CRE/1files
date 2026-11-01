/**
 * F08: Category Filter Chips
 * Verifies interactive category navigation chips (All, Security, Utilities, Crypto, Audio) and filtering logic.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML, extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F08: Category Filter Chips', () => {
  const getIndexData = () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
    return {
      dom: parseHTML(content),
      scripts: extractScripts(content).join('\n')
    };
  };

  test('F08-1: Category filter container exists with chip buttons', () => {
    const { dom } = getIndexData();
    const chipContainer = dom.querySelector('.filter-chips, .categories, .category-filters, nav.filters');
    assert.ok(chipContainer || dom.querySelectorAll('button[data-filter], button[data-category]').length > 0,
      'index.html must include category filter buttons');
  });

  test('F08-2: Category chips include default "All" filter button', () => {
    const { dom } = getIndexData();
    const buttons = dom.getElementsByTagName('button');
    const allChip = buttons.find(b => /all/i.test(b.textContent || b.getAttribute('data-filter') || ''));
    assert.ok(allChip, 'Category chips must include "All" filter button');
  });

  test('F08-3: Category chips include domain options (Security, Utilities, Crypto, Audio)', () => {
    const { dom } = getIndexData();
    const text = dom.elements.map(e => e.textContent).join(' ');
    assert.ok(/Security/i.test(text), 'Must include Security category');
    assert.ok(/Utilities|Utility|Dev/i.test(text), 'Must include Utilities category');
    assert.ok(/Crypto/i.test(text), 'Must include Crypto category');
    assert.ok(/Audio/i.test(text), 'Must include Audio category');
  });

  test('F08-4: Active chip indicates state via aria-pressed or active class', () => {
    const { dom } = getIndexData();
    const activeChip = dom.querySelector('.filter-chip.active, button[aria-pressed="true"], button.active');
    assert.ok(activeChip, 'Initial active category chip must be visually and semantically indicated');
  });

  test('F08-5: Script filters cards by category when chip is activated', () => {
    const { scripts } = getIndexData();
    assert.ok(/filterCategory|data-category|selectedCategory/i.test(scripts),
      'Script must implement category-based filtering logic');
  });
});

autoRunCLI();
