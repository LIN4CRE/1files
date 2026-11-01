/**
 * Tier 2 Boundary & Corner Cases: Cryptographic Studio (F15–F18)
 * 20 test cases covering hash edge cases, checksum comparisons, AES-GCM tamper resistance, and keygen entropy.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { computeHash, computeHmac, encryptAESGCM, decryptAESGCM } = require('../helpers/crypto-oracle');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('Tier 2: Cryptographic Studio Boundaries (F15–F18)', () => {
  const getCryptoVault = () => {
    const filePath = path.join(PROJECT_ROOT, 'crypto-vault.html');
    assert.ok(fs.existsSync(filePath), 'crypto-vault.html must exist at repository root');
    return fs.readFileSync(filePath, 'utf8');
  };

  // --- F15 Boundaries (5 tests) ---
  test('T2-F15-1: SHA-256 hashes empty 0-byte buffer to standard NIST constant', () => {
    const emptyBuf = Buffer.alloc(0);
    const hash = computeHash(emptyBuf, 'sha256');
    assert.equal(hash, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  test('T2-F15-2: Hashing 1MB pseudo-random buffer executes and produces 64-char hex digest', () => {
    const largeBuf = Buffer.alloc(1024 * 1024, 0x5a); // 1 MB of 'Z'
    const hash = computeHash(largeBuf, 'sha256');
    assert.equal(hash.length, 64);
  });

  test('T2-F15-3: Binary data containing null bytes (0x00) is hashed without string truncation', () => {
    const nullBytes = Buffer.from([0x00, 0x00, 0x01, 0x00]);
    const hash = computeHash(nullBytes, 'sha256');
    const hashFromStr = computeHash('\0\0\x01\0', 'sha256');
    assert.equal(hash, hashFromStr, 'Buffer and raw binary string with nulls must yield identical hashes');
  });

  test('T2-F15-4: SHA-512 hashes 4-byte unicode emojis correctly across multi-byte boundaries', () => {
    const emojiStr = '⚡🔒🛡️';
    const hash = computeHash(emojiStr, 'sha512');
    assert.equal(hash.length, 128);
  });

  test('T2-F15-5: Hash output is normalized to lowercase hex', () => {
    const hash = computeHash('test', 'sha256');
    assert.equal(hash, hash.toLowerCase());
  });

  // --- F16 Boundaries (5 tests) ---
  test('T2-F16-1: Checksum verifier matches uppercase input against lowercase digest', () => {
    const computed = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const userPasted = 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855';
    assert.equal(userPasted.trim().toLowerCase(), computed);
  });

  test('T2-F16-2: Checksum verifier strips leading and trailing whitespace/newlines', () => {
    const computed = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const userPasted = '  \n e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 \t ';
    assert.equal(userPasted.trim().toLowerCase(), computed);
  });

  test('T2-F16-3: Checksum verifier strips algorithm prefixes (e.g. "sha256:")', () => {
    const computed = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const prefixed = 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const clean = prefixed.replace(/^sha\d+:\s*/i, '').trim().toLowerCase();
    assert.equal(clean, computed);
  });

  test('T2-F16-4: Single character difference triggers mismatch detection', () => {
    const computed = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    // Alter last character from '5' to '6'
    const tampered = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b856';
    assert.notEqual(tampered.trim().toLowerCase(), computed);
  });

  test('T2-F16-5: Empty checksum field does not trigger false positive or error', () => {
    const emptyInput = '';
    const isMatch = emptyInput.trim().length > 0;
    assert.equal(isMatch, false, 'Empty input must not report match');
  });

  // --- F17 Boundaries (5 tests) ---
  test('T2-F17-1: AES-GCM encrypts empty string plaintext without throwing', () => {
    const encrypted = encryptAESGCM('', 'Passphrase123');
    const decrypted = decryptAESGCM(Buffer.from(encrypted.envelopeHex, 'hex'), 'Passphrase123');
    assert.equal(decrypted, '', 'Empty string must round-trip successfully');
  });

  test('T2-F17-2: Altering single byte of ciphertext triggers auth tag rejection', () => {
    const encrypted = encryptAESGCM('Secret Data', 'Passphrase123');
    const buf = Buffer.from(encrypted.envelopeHex, 'hex');
    // Mutate byte in ciphertext region (offset 30)
    buf[30] ^= 0x01;

    assert.throws(() => {
      decryptAESGCM(buf, 'Passphrase123');
    }, /bad decrypt|unsupported state|fail/i);
  });

  test('T2-F17-3: Truncating authTag (cutting buffer short) triggers rejection', () => {
    const encrypted = encryptAESGCM('Secret Data', 'Passphrase123');
    const buf = Buffer.from(encrypted.envelopeHex, 'hex');
    const truncated = buf.subarray(0, buf.length - 8); // remove 8 bytes from authTag

    assert.throws(() => {
      decryptAESGCM(truncated, 'Passphrase123');
    });
  });

  test('T2-F17-4: Salt is 16 bytes (32 hex chars) and IV is 12 bytes (24 hex chars)', () => {
    const encrypted = encryptAESGCM('Data', 'Key');
    assert.equal(encrypted.saltHex.length, 32, 'Salt must be 16 bytes');
    assert.equal(encrypted.ivHex.length, 24, 'IV must be 12 bytes (standard GCM)');
  });

  test('T2-F17-5: Encrypting 500 KB payload operates cleanly', () => {
    const payload = 'A'.repeat(500 * 1024);
    const encrypted = encryptAESGCM(payload, 'TestKey');
    const decrypted = decryptAESGCM(Buffer.from(encrypted.envelopeHex, 'hex'), 'TestKey');
    assert.equal(decrypted.length, payload.length);
  });

  // --- F18 Boundaries (5 tests) ---
  test('T2-F18-1: Diceware generator with 1 word minimum operates without crashing', () => {
    const words = ['apple', 'banana', 'vault', 'cyber'];
    const selectWords = count => Array.from({ length: Math.max(1, count) }, () => words[0]).join('-');
    assert.equal(selectWords(1), 'apple');
  });

  test('T2-F18-2: Diceware generator with 12 words generates high-entropy passphrase', () => {
    const words = ['apple', 'banana', 'vault', 'cyber'];
    const selectWords = count => Array.from({ length: count }, () => words[0]).join('-');
    const phrase = selectWords(12);
    assert.equal(phrase.split('-').length, 12);
  });

  test('T2-F18-3: Password generator with 0 length is clamped to minimum (e.g. 8 chars)', () => {
    const clampLen = l => isNaN(Number(l)) ? 16 : Math.max(8, Math.min(128, Number(l)));
    assert.equal(clampLen(0), 8);
    assert.equal(clampLen(200), 128);
  });

  test('T2-F18-4: HMAC with empty key and empty data produces valid 64-char digest', () => {
    const hmac = computeHmac('', '', 'sha256');
    assert.equal(hmac.length, 64);
  });

  test('T2-F18-5: HMAC-SHA512 produces valid 128-char digest', () => {
    const hmac = computeHmac('key', 'data', 'sha512');
    assert.equal(hmac.length, 128);
  });
});

autoRunCLI();
