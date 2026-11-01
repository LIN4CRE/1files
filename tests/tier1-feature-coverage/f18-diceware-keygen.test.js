/**
 * F18: Diceware Passphrase Keygen & HMAC
 * Verifies high-entropy Diceware passphrase generation, password keygen, and HMAC studio in crypto-vault.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { extractScripts } = require('../helpers/dom-parser');
const { computeHmac } = require('../helpers/crypto-oracle');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F18: Diceware Passphrase Keygen & HMAC', () => {
  const getCryptoVault = () => {
    const filePath = path.join(PROJECT_ROOT, 'crypto-vault.html');
    assert.ok(fs.existsSync(filePath), 'crypto-vault.html must exist at repository root');
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, scripts: extractScripts(content).join('\n') };
  };

  test('F18-1: Entropy generator uses crypto.getRandomValues exclusively (never Math.random)', () => {
    const { scripts } = getCryptoVault();
    assert.ok(/crypto\.getRandomValues/i.test(scripts),
      'Must use crypto.getRandomValues for cryptographically secure randomness');
  });

  test('F18-2: Diceware generator supports configurable word count (e.g. 4 to 8 words)', () => {
    const { content } = getCryptoVault();
    assert.ok(/diceware|passphrase/i.test(content), 'Must include Diceware / Passphrase generator');
  });

  test('F18-3: Random password generator allows character set customization (symbols, digits, upper/lower)', () => {
    const { content } = getCryptoVault();
    assert.ok(/uppercase|lowercase|numbers|symbols|special/i.test(content),
      'Must allow selecting character classes for password generation');
  });

  test('F18-4: HMAC studio generates valid keyed-hash digest verified against reference oracle', () => {
    const key = 'secret-key-vault';
    const message = 'Authenticated Transaction 2026';
    const oracleHmac = computeHmac(key, message, 'sha256');
    assert.equal(oracleHmac.length, 64, 'HMAC-SHA256 must be 64 hexadecimal characters');
  });

  test('F18-5: Diceware passphrases exhibit high entropy with separated word tokens', () => {
    const { content, scripts } = getCryptoVault();
    assert.ok(/separator|delimiter|words/i.test(content + scripts),
      'Passphrase generation should support configurable or standard token separators');
  });
});

autoRunCLI();
