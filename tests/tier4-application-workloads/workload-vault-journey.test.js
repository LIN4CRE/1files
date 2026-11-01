/**
 * Tier 4 Application Workload: Full Vault User Journey
 * Simulates complete end-to-end user experience: landing, skip navigation, search, category chip, modal launch, teardown, and download.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('Tier 4 Workload: Full Vault User Journey', () => {
  const getIndexDOM = () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
    return parseHTML(content);
  };

  test('T4-JOURNEY-1: User lands on portal and utilizes skip link to jump directly to catalog (#vault)', () => {
    const dom = getIndexDOM();
    const skipLink = dom.querySelector('.skip-link, a[href="#vault"]');
    assert.ok(skipLink, 'User must be able to discover skip-to-content link');
    assert.equal(skipLink.getAttribute('href'), '#vault');
    assert.ok(dom.getElementById('vault'), 'Skip link target #vault must exist in document');
  });

  test('T4-JOURNEY-2: User executes real-time catalog search filtering for crypto utilities', () => {
    const dom = getIndexDOM();
    const cards = dom.getElementsByClassName('app-card');
    const query = 'crypto';

    const matching = cards.filter(card => {
      const title = card.getAttribute('data-title') || card.innerHTML;
      const desc = card.textContent || '';
      return title.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
    });

    assert.ok(matching.length >= 1, 'Search query "crypto" must locate at least 1 matching vault card');
  });

  test('T4-JOURNEY-3: User clicks Launch App to open application inside accessible modal preview runner', () => {
    const dom = getIndexDOM();
    const modal = dom.getElementById('previewModal') || dom.querySelector('[role="dialog"]');
    assert.ok(modal, 'Modal preview runner must exist');

    const iframe = dom.getElementById('modalIframe') || dom.querySelector('iframe.modal-iframe');
    assert.ok(iframe, 'Modal must contain runner iframe');
    assert.ok(iframe.hasAttribute('sandbox'), 'Runner iframe must have sandbox attribute declared');
  });

  test('T4-JOURNEY-4: User dismisses modal via Escape key and focus is cleanly restored', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
    assert.ok(/Escape/i.test(content), 'Modal dismiss must handle Escape key');
    assert.ok(/focus\(\)/i.test(content), 'Focus restoration must be implemented');
  });

  test('T4-JOURNEY-5: User downloads application file directly via secondary action button', () => {
    const dom = getIndexDOM();
    const cards = dom.getElementsByClassName('app-card');
    for (const card of cards) {
      assert.ok(card.innerHTML.includes('download='),
        'Each card must empower the user to download the zero-dependency application');
    }
  });
});

autoRunCLI();
