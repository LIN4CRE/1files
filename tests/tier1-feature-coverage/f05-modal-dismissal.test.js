/**
 * F05: Modal Dismissal Controls
 * Verifies close button aria-label, backdrop click-to-close, and Escape key dismissal logic.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML, extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F05: Modal Dismissal Controls', () => {
  const getIndexData = () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
    return {
      dom: parseHTML(content),
      scripts: extractScripts(content).join('\n')
    };
  };

  test('F05-1: Modal close button declares aria-label="Close application preview"', () => {
    const { dom } = getIndexData();
    const closeBtn = dom.querySelector('.modal-close, button[onclick*="closePreview"]');
    assert.ok(closeBtn, 'Modal close button must exist');
    const label = closeBtn.getAttribute('aria-label');
    assert.ok(label && /close/i.test(label), `Close button must declare aria-label with "close" (got: "${label}")`);
  });

  test('F05-2: Modal close button has explicit type="button"', () => {
    const { dom } = getIndexData();
    const closeBtn = dom.querySelector('.modal-close, button[onclick*="closePreview"]');
    assert.ok(closeBtn, 'Modal close button must exist');
    assert.equal(closeBtn.getAttribute('type'), 'button', 'Close button must have type="button" to prevent form submission side-effects');
  });

  test('F05-3: Client script handles backdrop click to close preview modal', () => {
    const { scripts } = getIndexData();
    assert.ok(/addEventListener\s*\(\s*['"]click['"]|e\.target\s*===?\s*(?:modal|previewModal|backdrop|this)/i.test(scripts),
      'Script must contain click listener on backdrop to dismiss modal');
  });

  test('F05-4: Client script handles Escape keydown event to dismiss modal', () => {
    const { scripts } = getIndexData();
    assert.ok(/Escape|key\s*===?\s*['"]Escape['"]|keyCode\s*===?\s*27/i.test(scripts),
      'Script must register Escape key listener to close modal');
  });

  test('F05-5: Closing modal tears down iframe src immediately to stop background audio/execution', () => {
    const { scripts } = getIndexData();
    assert.ok(/src\s*=\s*['"]['"]|src\s*=\s*['"]about:blank['"]/i.test(scripts),
      'closePreview function must reset iframe src to empty string or about:blank to halt execution');
  });
});

autoRunCLI();
