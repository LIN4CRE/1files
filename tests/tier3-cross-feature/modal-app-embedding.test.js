/**
 * Tier 3 Cross-Feature Combination: Modal Runner Embedding (F04, F05, F06 ↔ F11, F15, F17, F19)
 * Verifies sandboxed embedding contract between vault portal and standalone applications.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML, extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('Tier 3: Modal Runner Application Embedding', () => {
  const getIndexData = () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
    return {
      dom: parseHTML(content),
      scripts: extractScripts(content).join('\n')
    };
  };

  test('T3-EMBED-1: Modal runner iframe sandbox permits all application requirements', () => {
    const { dom } = getIndexData();
    const iframe = dom.getElementById('modalIframe') || dom.querySelector('iframe.modal-iframe');
    assert.ok(iframe, 'Modal iframe must exist');
    const sandbox = iframe.getAttribute('sandbox') || '';
    const requiredTokens = ['allow-scripts', 'allow-same-origin', 'allow-forms', 'allow-downloads'];
    for (const tok of requiredTokens) {
      assert.ok(sandbox.includes(tok), `Sandbox must include "${tok}" token for embedded apps`);
    }
  });

  test('T3-EMBED-2: openPreview sets iframe src and updates modalTitle dynamically', () => {
    const { scripts } = getIndexData();
    assert.ok(/openPreview\s*\(/i.test(scripts), 'openPreview function must be defined');
    assert.ok(/modalTitle/i.test(scripts), 'openPreview must update title element');
  });

  test('T3-EMBED-3: Modal teardown resets iframe src to prevent background execution', () => {
    const { scripts } = getIndexData();
    assert.ok(/closePreview\s*\(/i.test(scripts), 'closePreview function must be defined');
    assert.ok(/src\s*=\s*['"](?:about:blank)?['"]/i.test(scripts),
      'closePreview must reset iframe src to blank on dismissal');
  });

  test('T3-EMBED-4: Open Fullscreen direct link enables escape from iframe sandbox to native tab', () => {
    const { dom } = getIndexData();
    const link = dom.getElementById('modalDirectLink');
    assert.ok(link, 'modalDirectLink element must exist');
    assert.equal(link.getAttribute('target'), '_blank');
  });
});

autoRunCLI();
