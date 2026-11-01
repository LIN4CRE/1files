/**
 * F09: Dynamic App Card Schema
 * Verifies standardized card markup with data-* metadata attributes, launch buttons, and download anchors.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F09: Dynamic App Card Schema', () => {
  const getIndexDOM = () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
    return parseHTML(content);
  };

  test('F09-1: App cards use standardized .app-card class identifier', () => {
    const dom = getIndexDOM();
    const cards = dom.getElementsByClassName('app-card');
    assert.ok(cards.length >= 3, `Vault must contain at least 3 application cards (found ${cards.length})`);
  });

  test('F09-2: App cards declare data-app-id and data-category attributes', () => {
    const dom = getIndexDOM();
    const cards = dom.getElementsByClassName('app-card');
    for (const card of cards) {
      assert.ok(card.hasAttribute('data-app-id'), `Card must have data-app-id attribute: ${card.outerHTML.slice(0, 100)}`);
      assert.ok(card.hasAttribute('data-category'), `Card must have data-category attribute: ${card.outerHTML.slice(0, 100)}`);
    }
  });

  test('F09-3: App cards declare data-filename pointing to valid local .html files', () => {
    const dom = getIndexDOM();
    const cards = dom.getElementsByClassName('app-card');
    for (const card of cards) {
      const filename = card.getAttribute('data-filename');
      assert.ok(filename, `Card must declare data-filename attribute: ${card.outerHTML.slice(0, 80)}`);
      assert.ok(filename.endsWith('.html'), `Filename must end in .html: "${filename}"`);
    }
  });

  test('F09-4: Each app card contains a primary Launch App button calling openPreview', () => {
    const dom = getIndexDOM();
    const cards = dom.getElementsByClassName('app-card');
    for (const card of cards) {
      assert.ok(/openPreview\s*\(/i.test(card.innerHTML),
        `Card ${card.getAttribute('data-app-id')} must have a launch button invoking openPreview(...)`);
    }
  });

  test('F09-5: Each app card contains a direct download anchor with download attribute', () => {
    const dom = getIndexDOM();
    const cards = dom.getElementsByClassName('app-card');
    for (const card of cards) {
      assert.ok(/<a[^>]+download/i.test(card.innerHTML),
        `Card ${card.getAttribute('data-app-id')} must provide a direct download link (<a download="...">)`);
    }
  });
});

autoRunCLI();
