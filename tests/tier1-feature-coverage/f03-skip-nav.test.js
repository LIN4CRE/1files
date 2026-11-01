/**
 * F03: Skip Navigation Link
 * Verifies accessible skip-to-content anchor in index.html targeting the main vault section.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML, extractStyles } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F03: Skip Navigation Link', () => {
  const getIndexData = () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
    return {
      dom: parseHTML(content),
      styles: extractStyles(content).join('\n')
    };
  };

  test('F03-1: index.html contains an accessible skip-link anchor element', () => {
    const { dom } = getIndexData();
    const skipLink = dom.querySelector('a.skip-link, a[href^="#"]');
    assert.ok(skipLink, 'index.html must contain a skip link');
  });

  test('F03-2: Skip link href targets the vault catalog anchor (#vault)', () => {
    const { dom } = getIndexData();
    const skipLinks = dom.querySelectorAll('a');
    const skip = skipLinks.find(a => (a.getAttribute('href') || '').startsWith('#') &&
      /skip/i.test(a.textContent || a.className));
    assert.ok(skip, 'Skip link with # target must be present');
    assert.equal(skip.getAttribute('href'), '#vault', 'Skip link target must be #vault');
  });

  test('F03-3: An element with id="vault" exists as the skip target in index.html', () => {
    const { dom } = getIndexData();
    const vaultEl = dom.getElementById('vault');
    assert.ok(vaultEl, 'Element with id="vault" must exist to receive skip-link focus');
  });

  test('F03-4: Skip link text conveys clear intent for assistive technologies', () => {
    const { dom } = getIndexData();
    const skip = dom.querySelector('a.skip-link, a[href="#vault"]');
    assert.ok(skip, 'Skip link must exist');
    assert.ok(/skip.*(?:content|vault|software)/i.test(skip.textContent),
      `Skip link text must be descriptive (got: "${skip.textContent}")`);
  });

  test('F03-5: CSS provides focus styling for the skip link when tabbed into', () => {
    const { styles } = getIndexData();
    assert.ok(/\.skip-link(?::focus|:focus-visible)?\s*\{[^}]*(?:position|top|left|clip|opacity)/i.test(styles),
      'CSS must define skip-link positioning and focus display rules');
  });
});

autoRunCLI();
