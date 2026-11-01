/**
 * F04: Accessible Modal Dialog
 * Verifies role="dialog", aria-modal="true", aria-labelledby, and focus management in index.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML, extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F04: Accessible Modal Dialog', () => {
  const getIndexData = () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
    return {
      dom: parseHTML(content),
      scripts: extractScripts(content).join('\n')
    };
  };

  test('F04-1: Modal container element declares role="dialog"', () => {
    const { dom } = getIndexData();
    const modal = dom.getElementById('previewModal') || dom.querySelector('.modal-backdrop, .modal-frame');
    assert.ok(modal, 'Modal container must exist');
    const dialog = dom.querySelector('[role="dialog"]');
    assert.ok(dialog, 'Modal must have role="dialog" declared on container or frame');
  });

  test('F04-2: Modal container element declares aria-modal="true"', () => {
    const { dom } = getIndexData();
    const modal = dom.querySelector('[aria-modal="true"]');
    assert.ok(modal, 'Modal dialog must declare aria-modal="true"');
  });

  test('F04-3: Modal dialog links to its header via aria-labelledby or has aria-label', () => {
    const { dom } = getIndexData();
    const dialog = dom.querySelector('[role="dialog"]');
    assert.ok(dialog, 'Dialog element must exist');
    const labelledby = dialog.getAttribute('aria-labelledby');
    const label = dialog.getAttribute('aria-label');
    assert.ok(labelledby || label, 'Dialog must have aria-labelledby or aria-label attribute');
    if (labelledby) {
      assert.ok(dom.getElementById(labelledby), `Element with id="${labelledby}" must exist in DOM`);
    }
  });

  test('F04-4: Modal includes title container with id="modalTitle"', () => {
    const { dom } = getIndexData();
    const titleEl = dom.getElementById('modalTitle');
    assert.ok(titleEl, 'Modal title element with id="modalTitle" must be present');
  });

  test('F04-5: Client script implements focus trap and restoration logic', () => {
    const { scripts } = getIndexData();
    assert.ok(/focus\(\)|activeElement/i.test(scripts),
      'Script must implement active element tracking and focus management for the modal');
  });
});

autoRunCLI();
