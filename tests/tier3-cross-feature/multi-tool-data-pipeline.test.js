/**
 * Tier 3 Cross-Feature Combination: Multi-Tool Data Pipeline
 * Verifies end-to-end data pipeline across Data Forge, Crypto Vault, and File I/O.
 */

const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { computeHash, encryptAESGCM, decryptAESGCM } = require('../helpers/crypto-oracle');

describe('Tier 3: Multi-Tool Data Pipeline', () => {
  test('T3-PIPE-1: Pipeline step 1: CSV -> JSON -> SHA-256 Checksum generation', () => {
    // 1. Raw CSV input
    const csvData = 'id,tool,offline\n1,crypto-vault,true\n2,data-forge,true\n3,tone-lab,true';
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    const jsonRecords = lines.slice(1).map(line => {
      const parts = line.split(',');
      return { [headers[0]]: parts[0], [headers[1]]: parts[1], [headers[2]]: parts[2] === 'true' };
    });

    const jsonStr = JSON.stringify(jsonRecords, null, 2);
    assert.ok(jsonStr.includes('crypto-vault'));

    // 2. Hash using Crypto Vault SHA-256
    const hash = computeHash(jsonStr, 'sha256');
    assert.equal(hash.length, 64);
  });

  test('T3-PIPE-2: Pipeline step 2: Encrypt data with AES-256-GCM using generated key', () => {
    const payload = JSON.stringify({ vault: '1files', status: 'secure' });
    const passphrase = 'correct-horse-battery-staple-vault';

    const enc = encryptAESGCM(payload, passphrase);
    assert.ok(enc.envelopeHex.length > 0);

    const dec = decryptAESGCM(Buffer.from(enc.envelopeHex, 'hex'), passphrase);
    assert.equal(dec, payload);
  });

  test('T3-PIPE-3: Pipeline step 3: Base64URL encode cipher envelope, decode and decrypt', () => {
    const secret = 'Encrypted Infiltration Notes 2026';
    const pwd = 'MasterPassword#1';
    const enc = encryptAESGCM(secret, pwd);

    // Transform envelope to Base64URL
    const b64url = Buffer.from(enc.envelopeHex, 'hex').toString('base64url');
    assert.ok(!b64url.includes('+') && !b64url.includes('/'));

    // Decode from Base64URL and decrypt
    const recoveredBuf = Buffer.from(b64url, 'base64url');
    const decrypted = decryptAESGCM(recoveredBuf, pwd);
    assert.equal(decrypted, secret);
  });

  test('T3-PIPE-4: Pipeline step 4: Export transformed data to Blob URL for download', () => {
    const exportedData = JSON.stringify({ verified: true, timestamp: Date.now() });
    const blob = new globalThis.Blob([exportedData], { type: 'application/json' });
    assert.equal(blob.type, 'application/json');
    assert.ok(blob.size > 0);
  });
});

autoRunCLI();
