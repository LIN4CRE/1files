/**
 * F01: Zero-Dependency Font Stack
 * Verifies elimination of Google Fonts and use of native system monospace and sans-serif font stacks.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { auditFileContent } = require('../helpers/audit-offline');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F01: Zero-Dependency Font Stack', () => {
  test('F01-1: index.html contains zero external font links or CDN stylesheets', () => {
    const filePath = path.join(PROJECT_ROOT, 'index.html');
    assert.ok(fs.existsSync(filePath), 'index.html must exist');
    const content = fs.readFileSync(filePath, 'utf8');
    const audit = auditFileContent(content, 'index.html');
    const fontViolations = audit.violations.filter(v => v.rule.includes('Font') || v.rule.includes('stylesheet'));
    assert.equal(fontViolations.length, 0, `index.html must have 0 external font violations: ${JSON.stringify(fontViolations)}`);
  });

  test('F01-2: 404.html contains zero external font links or CDN stylesheets', () => {
    const filePath = path.join(PROJECT_ROOT, '404.html');
    assert.ok(fs.existsSync(filePath), '404.html must exist');
    const content = fs.readFileSync(filePath, 'utf8');
    const audit = auditFileContent(content, '404.html');
    const fontViolations = audit.violations.filter(v => v.rule.includes('Font') || v.rule.includes('stylesheet'));
    assert.equal(fontViolations.length, 0, `404.html must have 0 external font violations: ${JSON.stringify(fontViolations)}`);
  });

  test('F01-3: All vault application HTML files contain zero external @import font rules', () => {
    const htmlFiles = fs.readdirSync(PROJECT_ROOT).filter(f => f.endsWith('.html'));
    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
      assert.ok(!/@import\s+(?:url\(['"]?)?https?:\/\/(?:fonts\.googleapis|cdn)/i.test(content),
        `${file} must not contain @import referencing external font services`);
    }
  });

  test('F01-4: index.html defines robust system monospace font stack in CSS variables', () => {
    const filePath = path.join(PROJECT_ROOT, 'index.html');
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(/ui-monospace|Menlo|Consolas|monospace/i.test(content),
      'index.html CSS must include system monospace fallbacks (ui-monospace, Menlo, Consolas, monospace)');
  });

  test('F01-5: index.html defines robust system sans-serif font stack in CSS variables', () => {
    const filePath = path.join(PROJECT_ROOT, 'index.html');
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(/system-ui|-apple-system|sans-serif/i.test(content),
      'index.html CSS must include system sans-serif fallbacks (system-ui, -apple-system, sans-serif)');
  });
});

autoRunCLI();
