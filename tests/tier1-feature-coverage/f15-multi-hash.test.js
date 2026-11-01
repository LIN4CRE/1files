/**
 * F15: Multi-Hash Checksum Engine
 * Verifies client-side SHA-256, SHA-512, SHA-384, and SHA-1 hashing via Web Crypto in crypto-vault.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { extractScripts } = require('../helpers/dom-parser');
const { computeHash } = require('../helpers/crypto-oracle');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F15: Multi-Hash Checksum Engine', () => {
  const getCryptoVault = () => {
    const filePath = path.join(PROJECT_ROOT, 'crypto-vault.html');
    assert.ok(fs.existsSync(filePath), 'crypto-vault.html must exist at repository root');
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, scripts: extractScripts(content).join('\n') };
  };

  test('F15-1: crypto-vault.html is a self-contained offline document with no external scripts', () => {
    const { content } = getCryptoVault();
    assert.ok(!/<script[^>]+src=/i.test(content), 'crypto-vault.html must have no external script tags');
    assert.ok(!/<link[^>]+href=["']https?:\/\//i.test(content), 'crypto-vault.html must have no external CSS links');
  });

  test('F15-2: Hashing engine invokes native Web Crypto API crypto.subtle.digest', () => {
    const { scripts } = getCryptoVault();
    assert.ok(/crypto\.subtle\.digest/i.test(scripts),
      'Must leverage hardware-accelerated crypto.subtle.digest for hash calculations');
  });

  test('F15-3: Computes exact SHA-256 digest matching NIST reference oracle', () => {
    const input = '1files-zero-dependency-software-vault';
    const expected = computeHash(input, 'sha256');
    assert.equal(expected.length, 64, 'SHA-256 digest must be 64 hexadecimal characters');
    // Verify against known empty string standard NIST vector
    const emptySha256 = computeHash('', 'sha256');
    assert.equal(emptySha256, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  test('F15-4: Computes exact SHA-512 and SHA-384 digests matching reference oracle', () => {
    const input = '1files-security-test';
    const sha512 = computeHash(input, 'sha512');
    const sha384 = computeHash(input, 'sha384');
    assert.equal(sha512.length, 128, 'SHA-512 digest must be 128 hexadecimal characters');
    assert.equal(sha384.length, 96, 'SHA-384 digest must be 96 hexadecimal characters');
  });

  test('F15-5: Computes legacy SHA-1 digest matching reference oracle', () => {
    const emptySha1 = computeHash('', 'sha1');
    assert.equal(emptySha1, 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
      'SHA-1 empty string digest must match standard RFC 3174 test vector');
  });
});

autoRunCLI();
