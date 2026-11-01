/**
 * F06: Sandboxed Iframe Runner
 * Verifies least-privilege sandbox tokens and dynamic accessible title on modal runner iframe.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML, extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F06: Sandboxed Iframe Runner', () => {
  const getIndexData = () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
    return {
      dom: parseHTML(content),
      scripts: extractScripts(content).join('\n')
    };
  };

  test('F06-1: Modal iframe declares sandbox attribute', () => {
    const { dom } = getIndexData();
    const iframe = dom.getElementById('modalIframe') || dom.querySelector('iframe.modal-iframe');
    assert.ok(iframe, 'Modal iframe element must exist');
    assert.ok(iframe.hasAttribute('sandbox'), 'Modal iframe must have sandbox attribute declared');
  });

  test('F06-2: Sandbox attribute includes allow-scripts token', () => {
    const { dom } = getIndexData();
    const iframe = dom.getElementById('modalIframe') || dom.querySelector('iframe.modal-iframe');
    const sandbox = iframe.getAttribute('sandbox') || '';
    assert.ok(sandbox.includes('allow-scripts'), 'Sandbox must permit script execution via allow-scripts');
  });

  test('F06-3: Sandbox attribute includes allow-same-origin token', () => {
    const { dom } = getIndexData();
    const iframe = dom.getElementById('modalIframe') || dom.querySelector('iframe.modal-iframe');
    const sandbox = iframe.getAttribute('sandbox') || '';
    assert.ok(sandbox.includes('allow-same-origin'), 'Sandbox must include allow-same-origin for isolated application assets');
  });

  test('F06-4: Sandbox attribute includes allow-downloads and allow-forms tokens', () => {
    const { dom } = getIndexData();
    const iframe = dom.getElementById('modalIframe') || dom.querySelector('iframe.modal-iframe');
    const sandbox = iframe.getAttribute('sandbox') || '';
    assert.ok(sandbox.includes('allow-downloads'), 'Sandbox must include allow-downloads for file exports');
    assert.ok(sandbox.includes('allow-forms'), 'Sandbox must include allow-forms for user interactive inputs');
  });

  test('F06-5: Client script sets accessible title attribute on iframe during openPreview', () => {
    const { scripts } = getIndexData();
    assert.ok(/title\s*=\s*|setAttribute\s*\(\s*['"]title['"]/i.test(scripts),
      'openPreview script must update iframe title dynamically for screen readers');
  });
});

autoRunCLI();
