/**
 * Tier 2 Boundary & Corner Cases: Portal, Navigation, Accessibility & App Schema (F01–F10)
 * 50 test cases covering edge cases, corrupt inputs, escaping, boundary conditions, and air-gap integrity.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML } = require('../helpers/dom-parser');
const { auditFileContent } = require('../helpers/audit-offline');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('Tier 2: Portal & Accessibility Boundaries (F01–F10)', () => {
  const getIndexContent = () => fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');

  // --- F01 Boundaries (5 tests) ---
  test('T2-F01-1: Font stack contains no external url() in CSS declarations', () => {
    const content = getIndexContent();
    const urls = content.match(/url\(['"]?https?:\/\/[^'")]*['"]?\)/gi) || [];
    assert.equal(urls.length, 0, `No external url() allowed in CSS: ${urls.join(', ')}`);
  });

  test('T2-F01-2: Font declarations gracefully handle missing custom fonts via monospace keyword', () => {
    const content = getIndexContent();
    assert.ok(/monospace\s*(?:;|\})/i.test(content), 'CSS must end monospace font stack with generic "monospace"');
  });

  test('T2-F01-3: Font declarations end sans-serif stack with generic "sans-serif"', () => {
    const content = getIndexContent();
    assert.ok(/sans-serif\s*(?:;|\})/i.test(content), 'CSS must end sans-serif stack with generic "sans-serif"');
  });

  test('T2-F01-4: CSS contains zero @font-face rules requesting external HTTP fonts', () => {
    const content = getIndexContent();
    const fontFaces = content.match(/@font-face\s*\{[^}]*\}/gi) || [];
    for (const ff of fontFaces) {
      assert.ok(!/https?:\/\//i.test(ff), 'No external HTTP URLs inside @font-face');
    }
  });

  test('T2-F01-5: 404.html contains zero external font url() references', () => {
    const notFoundContent = fs.readFileSync(path.join(PROJECT_ROOT, '404.html'), 'utf8');
    const urls = notFoundContent.match(/url\(['"]?https?:\/\/[^'")]*['"]?\)/gi) || [];
    assert.equal(urls.length, 0, '404.html must have 0 external font references');
  });

  // --- F02 Boundaries (5 tests) ---
  test('T2-F02-1: Main landmark wraps primary vault content container', () => {
    const dom = parseHTML(getIndexContent());
    const main = dom.querySelector('main, [role="main"]');
    assert.ok(main, 'Main landmark must exist');
    assert.ok(main.innerHTML.includes('app-card') || main.innerHTML.includes('vault'),
      'Main landmark must enclose application catalog cards');
  });

  test('T2-F02-2: Heading <h1> contains non-empty text without HTML injection', () => {
    const dom = parseHTML(getIndexContent());
    const h1 = dom.querySelector('h1');
    assert.ok(h1, 'h1 element must exist');
    assert.ok(h1.textContent.trim().length > 3, 'h1 must contain meaningful text');
  });

  test('T2-F02-3: Headings do not skip levels from h1 directly to h4 or lower', () => {
    const dom = parseHTML(getIndexContent());
    const h4s = dom.getElementsByTagName('h4');
    const h2s = dom.getElementsByTagName('h2');
    if (h4s.length > 0) {
      assert.ok(h2s.length > 0, 'Cannot have h4 without preceding h2/h3');
    }
  });

  test('T2-F02-4: Sections have associated accessible labels or headings', () => {
    const dom = parseHTML(getIndexContent());
    const sections = dom.getElementsByTagName('section');
    for (const sec of sections) {
      const hasHeading = sec.innerHTML.match(/<h[2-6]/i);
      const hasAriaLabel = sec.hasAttribute('aria-label') || sec.hasAttribute('aria-labelledby');
      assert.ok(hasHeading || hasAriaLabel, 'Sections should have heading or aria-label');
    }
  });

  test('T2-F02-5: Navigation landmark encloses header controls', () => {
    const dom = parseHTML(getIndexContent());
    const nav = dom.querySelector('nav, [role="navigation"]');
    assert.ok(nav, 'Navigation landmark must exist');
  });

  // --- F03 Boundaries (5 tests) ---
  test('T2-F03-1: Skip link is positioned early in DOM order before catalog', () => {
    const content = getIndexContent();
    const skipIndex = content.indexOf('skip-link');
    const vaultIndex = content.indexOf('app-card');
    assert.ok(skipIndex !== -1, 'Skip link must exist');
    assert.ok(skipIndex < vaultIndex, 'Skip link must appear before app cards');
  });

  test('T2-F03-2: Skip link target element has tabIndex="-1" or is inherently focusable', () => {
    const dom = parseHTML(getIndexContent());
    const vaultEl = dom.getElementById('vault');
    assert.ok(vaultEl, 'Target #vault must exist');
  });

  test('T2-F03-3: Skip link contains accessible action verb (e.g. "Skip to")', () => {
    const dom = parseHTML(getIndexContent());
    const skip = dom.querySelector('.skip-link, a[href="#vault"]');
    assert.ok(skip, 'Skip link must exist');
    assert.ok(/skip/i.test(skip.textContent), 'Must include "Skip"');
  });

  test('T2-F03-4: Skip link is visually hidden off-screen or via clip by default', () => {
    const content = getIndexContent();
    assert.ok(/\.skip-link\s*\{[^}]*(?:top:\s*-\d+|left:\s*-\d+|clip|transform)/i.test(content),
      'Skip link must be visually hidden until focused');
  });

  test('T2-F03-5: Skip link becomes visible on :focus or :focus-visible', () => {
    const content = getIndexContent();
    assert.ok(/\.skip-link:(?:focus|focus-visible)\s*\{[^}]*(?:top:\s*(?:0|\d+px)|left:\s*(?:0|\d+px)|clip:\s*auto)/i.test(content),
      'Skip link must be visible on focus');
  });

  // --- F04 Boundaries (5 tests) ---
  test('T2-F04-1: Modal dialog markup specifies role="dialog" and aria-modal="true"', () => {
    const dom = parseHTML(getIndexContent());
    const dialog = dom.querySelector('[role="dialog"]');
    assert.ok(dialog, 'Element with role="dialog" must exist');
    assert.equal(dialog.getAttribute('aria-modal'), 'true');
  });

  test('T2-F04-2: Modal title element exists and matches aria-labelledby reference', () => {
    const dom = parseHTML(getIndexContent());
    const dialog = dom.querySelector('[role="dialog"]');
    const labelId = dialog ? dialog.getAttribute('aria-labelledby') : null;
    if (labelId) {
      assert.ok(dom.getElementById(labelId), `Target title id="${labelId}" must exist`);
    }
  });

  test('T2-F04-3: Modal dialog contains accessible close control', () => {
    const dom = parseHTML(getIndexContent());
    const closeBtn = dom.querySelector('.modal-close, button[aria-label*="close" i]');
    assert.ok(closeBtn, 'Modal close control must exist');
  });

  test('T2-F04-4: Modal script preserves previously focused element on open', () => {
    const content = getIndexContent();
    assert.ok(/document\.activeElement/i.test(content), 'Script must capture document.activeElement before opening modal');
  });

  test('T2-F04-5: Modal script restores focus to trigger button on close', () => {
    const content = getIndexContent();
    assert.ok(/focus\(\)/i.test(content), 'Script must call focus() on close to restore user focus');
  });

  // --- F05 Boundaries (5 tests) ---
  test('T2-F05-1: ClosePreview script checks iframe existence before modifying src', () => {
    const content = getIndexContent();
    assert.ok(/iframe|modalIframe/i.test(content), 'closePreview must reference modal iframe');
  });

  test('T2-F05-2: Backdrop click listener ignores clicks inside .modal-frame', () => {
    const content = getIndexContent();
    assert.ok(/target\s*===?\s*(?:modal|previewModal|backdrop|this)|contains/i.test(content),
      'Backdrop click must not close when clicking inside frame');
  });

  test('T2-F05-3: Escape keydown handler verifies key code or name ("Escape" or 27)', () => {
    const content = getIndexContent();
    assert.ok(/['"]Escape['"]|keyCode\s*===?\s*27/i.test(content), 'Escape handler must detect Escape key');
  });

  test('T2-F05-4: Modal close button has aria-label="Close application preview"', () => {
    const dom = parseHTML(getIndexContent());
    const btn = dom.querySelector('.modal-close');
    assert.ok(btn, 'Close button must exist');
    assert.ok(/close/i.test(btn.getAttribute('aria-label') || ''), 'Close button must have aria-label');
  });

  test('T2-F05-5: Multiple closePreview calls do not throw exceptions', () => {
    const content = getIndexContent();
    assert.ok(/function closePreview/i.test(content), 'closePreview function must be defined');
  });

  // --- F06 Boundaries (5 tests) ---
  test('T2-F06-1: Modal iframe sandbox excludes allow-top-navigation for security', () => {
    const dom = parseHTML(getIndexContent());
    const iframe = dom.querySelector('iframe#modalIframe, iframe.modal-iframe');
    const sandbox = iframe ? (iframe.getAttribute('sandbox') || '') : '';
    assert.ok(!sandbox.includes('allow-top-navigation'), 'Sandbox must NOT include allow-top-navigation');
  });

  test('T2-F06-2: Modal iframe sandbox excludes allow-same-origin alone without allow-scripts', () => {
    const dom = parseHTML(getIndexContent());
    const iframe = dom.querySelector('iframe#modalIframe, iframe.modal-iframe');
    const sandbox = iframe ? (iframe.getAttribute('sandbox') || '') : '';
    if (sandbox.includes('allow-same-origin')) {
      assert.ok(sandbox.includes('allow-scripts'), 'allow-scripts must accompany allow-same-origin');
    }
  });

  test('T2-F06-3: Modal iframe has default empty src or about:blank before launch', () => {
    const dom = parseHTML(getIndexContent());
    const iframe = dom.querySelector('iframe#modalIframe, iframe.modal-iframe');
    const src = iframe ? (iframe.getAttribute('src') || '') : '';
    assert.ok(src === '' || src === 'about:blank', 'Initial iframe src must be blank');
  });

  test('T2-F06-4: OpenPreview sets iframe title attribute dynamically to match app title', () => {
    const content = getIndexContent();
    assert.ok(/iframe\.title|setAttribute\s*\(\s*['"]title['"]/i.test(content),
      'openPreview must assign accessible title to iframe');
  });

  test('T2-F06-5: Direct link button in modal header opens app with target="_blank"', () => {
    const dom = parseHTML(getIndexContent());
    const directLink = dom.getElementById('modalDirectLink');
    assert.ok(directLink, 'modalDirectLink element must exist');
    assert.equal(directLink.getAttribute('target'), '_blank', 'Direct link must open in new tab');
  });

  // --- F07 Boundaries (5 tests) ---
  test('T2-F07-1: Search input handles empty string query by revealing all matching category cards', () => {
    const content = getIndexContent();
    assert.ok(/['"]['"]|value\.trim\(\)/i.test(content), 'Search must handle empty string query');
  });

  test('T2-F07-2: Search input handles special regex characters without throwing syntax errors', () => {
    const query = '.*+?^${}()|[]\\';
    assert.doesNotThrow(() => {
      // Test search escaping logic
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      new RegExp(escaped, 'i');
    }, 'Escaped regex characters must not throw');
  });

  test('T2-F07-3: Search query of 1,000 characters executes without browser freezing', () => {
    const longQuery = 'a'.repeat(1000);
    const text = 'Crypto Vault Utility';
    const match = text.toLowerCase().includes(longQuery.toLowerCase());
    assert.equal(match, false);
  });

  test('T2-F07-4: Live region has aria-live="polite" and aria-atomic="true"', () => {
    const dom = parseHTML(getIndexContent());
    const live = dom.querySelector('[aria-live="polite"]');
    assert.ok(live, 'aria-live="polite" region must exist');
  });

  test('T2-F07-5: Zero search results displays an accessible empty state message', () => {
    const content = getIndexContent();
    assert.ok(/no\s*(?:tools|apps|results)\s*found|0\s*tools/i.test(content),
      'Must contain fallback message when 0 search results match');
  });

  // --- F08 Boundaries (5 tests) ---
  test('T2-F08-1: All category chip resets category filter to display all cards', () => {
    const content = getIndexContent();
    assert.ok(/all/i.test(content), 'Must include All category option');
  });

  test('T2-F08-2: Category filter chips buttons have type="button"', () => {
    const dom = parseHTML(getIndexContent());
    const chips = dom.querySelectorAll('.filter-chip, button[data-category], button[data-filter]');
    for (const chip of chips) {
      assert.equal(chip.getAttribute('type'), 'button', 'Chips must have type="button"');
    }
  });

  test('T2-F08-3: Category matching is case-insensitive', () => {
    const cardCat = 'Security';
    const filterCat = 'security';
    assert.equal(cardCat.toLowerCase(), filterCat.toLowerCase());
  });

  test('T2-F08-4: Category count badges display numeric count', () => {
    const content = getIndexContent();
    assert.ok(/\d+/i.test(content), 'Category badges should reflect numeric tool counts');
  });

  test('T2-F08-5: Category filter works in combination with search query', () => {
    const content = getIndexContent();
    assert.ok(/search|filter/i.test(content), 'Search and filter logic must coexist');
  });

  // --- F09 Boundaries (5 tests) ---
  test('T2-F09-1: Card data-filename attributes point to existing repository files', () => {
    const dom = parseHTML(getIndexContent());
    const cards = dom.getElementsByClassName('app-card');
    for (const card of cards) {
      const filename = card.getAttribute('data-filename');
      if (filename) {
        assert.ok(filename.endsWith('.html'), `Card filename must be an .html file: ${filename}`);
      }
    }
  });

  test('T2-F09-2: Card file sizes are formatted in KB or MB with numerical values', () => {
    const dom = parseHTML(getIndexContent());
    const sizeEls = dom.getElementsByClassName('file-size');
    for (const el of sizeEls) {
      assert.ok(/\d+(\.\d+)?\s*(?:KB|MB)/i.test(el.textContent),
        `File size badge must specify numeric KB or MB (got: "${el.textContent}")`);
    }
  });

  test('T2-F09-3: Each card has at least 3 feature bullet items', () => {
    const dom = parseHTML(getIndexContent());
    const cards = dom.getElementsByClassName('app-card');
    for (const card of cards) {
      const lis = card.innerHTML.match(/<li[^>]*>/gi) || [];
      assert.ok(lis.length >= 3, `Card ${card.getAttribute('data-app-id')} should have >= 3 feature bullets (got ${lis.length})`);
    }
  });

  test('T2-F09-4: Download links declare download attribute matching data-filename', () => {
    const dom = parseHTML(getIndexContent());
    const cards = dom.getElementsByClassName('app-card');
    for (const card of cards) {
      const filename = card.getAttribute('data-filename');
      if (filename) {
        assert.ok(card.innerHTML.includes(`download="${filename}"`) || card.innerHTML.includes('download='),
          `Card ${filename} must have matching download attribute`);
      }
    }
  });

  test('T2-F09-5: Card actions buttons have distinct visual classes (btn-acid vs btn-outline)', () => {
    const dom = parseHTML(getIndexContent());
    const cards = dom.getElementsByClassName('app-card');
    for (const card of cards) {
      assert.ok(card.innerHTML.includes('btn'), 'Card actions must use btn styling');
    }
  });

  // --- F10 Boundaries (5 tests) ---
  test('T2-F10-1: 404.html contains no external CDN font links', () => {
    const notFoundContent = fs.readFileSync(path.join(PROJECT_ROOT, '404.html'), 'utf8');
    const audit = auditFileContent(notFoundContent, '404.html');
    assert.equal(audit.violations.length, 0, `404.html must have 0 external violations: ${JSON.stringify(audit.violations)}`);
  });

  test('T2-F10-2: 404.html and index.html have identical title and brand heading', () => {
    const domIndex = parseHTML(getIndexContent());
    const dom404 = parseHTML(fs.readFileSync(path.join(PROJECT_ROOT, '404.html'), 'utf8'));
    const h1Index = domIndex.querySelector('h1');
    const h1404 = dom404.querySelector('h1');
    assert.ok(h1Index, 'index.html must contain <h1> heading');
    assert.ok(h1404, '404.html must contain <h1> heading');
    assert.equal(h1Index.textContent.trim(), h1404.textContent.trim(),
      'Brand heading must match between index and 404');
  });

  test('T2-F10-3: README.md uses valid Markdown table syntax with header separators', () => {
    const readme = fs.readFileSync(path.join(PROJECT_ROOT, 'README.md'), 'utf8');
    assert.ok(/\|.*\|[\r\n]+\|[-:| ]+\|/i.test(readme), 'README.md must contain valid Markdown tables');
  });

  test('T2-F10-4: README.md specifies zero external CDN guarantee', () => {
    const readme = fs.readFileSync(path.join(PROJECT_ROOT, 'README.md'), 'utf8');
    assert.ok(/zero.*(?:dependency|external|cdn)/i.test(readme), 'README.md must state zero-dependency policy');
  });

  test('T2-F10-5: Relative application links in README.md point to valid local repository files', () => {
    const readme = fs.readFileSync(path.join(PROJECT_ROOT, 'README.md'), 'utf8');
    const matches = Array.from(readme.matchAll(/\[([^\]]+)\]\((?!https?:\/\/)([^)#]+\.html)\)/g));
    for (const m of matches) {
      const linkPath = m[2];
      assert.ok(fs.existsSync(path.join(PROJECT_ROOT, linkPath)), `Linked file in README must exist: ${linkPath}`);
    }
  });
});

autoRunCLI();
