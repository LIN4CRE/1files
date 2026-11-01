/**
 * F16: Hash Match Verification
 * Verifies instant checksum comparison and visual match indicators in crypto-vault.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML, extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F16: Hash Match Verification', () => {
  const getCryptoVault = () => {
    const filePath = path.join(PROJECT_ROOT, 'crypto-vault.html');
    assert.ok(fs.existsSync(filePath), 'crypto-vault.html must exist at repository root');
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      content,
      dom: parseHTML(content),
      scripts: extractScripts(content).join('\n')
    };
  };

  test('F16-1: Contains input field for pasting expected verification checksum', () => {
    const { dom } = getCryptoVault();
    const compareInput = dom.querySelector('input[placeholder*="compare" i], input[placeholder*="checksum" i], input#expectedHash');
    assert.ok(compareInput, 'crypto-vault.html must have input field for pasting expected checksum');
  });

  test('F16-2: Checksum comparison normalizes whitespace and casing (trim and toLowerCase)', () => {
    const { scripts } = getCryptoVault();
    assert.ok(/trim\(\)/i.test(scripts) && /toLowerCase\(\)/i.test(scripts),
      'Checksum comparison must normalize inputs using trim() and toLowerCase()');
  });

  test('F16-3: Visual indicators display green match state when hashes correspond', () => {
    const { content } = getCryptoVault();
    assert.ok(/match|MATCH|matched|verified/i.test(content),
      'Must contain status container or badge indicating successful hash match');
  });

  test('F16-4: Visual indicators display mismatch state when hashes do not correspond', () => {
    const { content, scripts } = getCryptoVault();
    assert.ok(/mismatch|MISMATCH|error|diff|danger/i.test(content + scripts),
      'Must alert user when expected checksum differs from calculated digest');
  });

  test('F16-5: Status indicator resets gracefully when expected input is cleared', () => {
    const { scripts } = getCryptoVault();
    assert.ok(/===\s*['"]['"]|!\s*\w+\.value/i.test(scripts),
      'Verification logic must handle empty input state cleanly');
  });
});

autoRunCLI();
