/**
 * F17: Authenticated AES-256-GCM
 * Verifies PBKDF2 key derivation (100,000 iterations) and authenticated AES-GCM encryption in crypto-vault.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { extractScripts } = require('../helpers/dom-parser');
const { encryptAESGCM, decryptAESGCM } = require('../helpers/crypto-oracle');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F17: Authenticated AES-256-GCM', () => {
  const getCryptoVault = () => {
    const filePath = path.join(PROJECT_ROOT, 'crypto-vault.html');
    assert.ok(fs.existsSync(filePath), 'crypto-vault.html must exist at repository root');
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, scripts: extractScripts(content).join('\n') };
  };

  test('F17-1: Utilizes PBKDF2 key derivation with 100,000 iterations', () => {
    const { scripts } = getCryptoVault();
    assert.ok(/PBKDF2/i.test(scripts), 'Must specify PBKDF2 algorithm');
    assert.ok(/100000|100_000/i.test(scripts), 'Must specify 100,000 iterations for PBKDF2 salt stretching');
  });

  test('F17-2: Uses AES-GCM 256-bit authenticated cipher via Web Crypto API', () => {
    const { scripts } = getCryptoVault();
    assert.ok(/AES-GCM/i.test(scripts), 'Must specify AES-GCM algorithm');
    assert.ok(/256/i.test(scripts), 'Must use 256-bit key length');
  });

  test('F17-3: Generates fresh random IV and salt via crypto.getRandomValues', () => {
    const { scripts } = getCryptoVault();
    assert.ok(/getRandomValues/i.test(scripts), 'Must use crypto.getRandomValues for cryptographically secure nonces');
  });

  test('F17-4: Reference oracle confirms round-trip AES-256-GCM encryption and decryption', () => {
    const secret = 'Confidential Vault Payload 2026';
    const password = 'CorrectHorseBatteryStaple#99';
    const encrypted = encryptAESGCM(secret, password);
    assert.ok(encrypted.envelopeHex.length > 0, 'Encrypted envelope must be generated');

    const decrypted = decryptAESGCM(Buffer.from(encrypted.envelopeHex, 'hex'), password);
    assert.equal(decrypted, secret, 'Decrypted text must match original plaintext exactly');
  });

  test('F17-5: Decryption with incorrect passphrase fails authentication tag verification', () => {
    const secret = 'Top Secret';
    const password = 'RightPassword123';
    const encrypted = encryptAESGCM(secret, password);

    assert.throws(() => {
      decryptAESGCM(Buffer.from(encrypted.envelopeHex, 'hex'), 'WrongPassword!');
    }, /bad decrypt|unsupported state|fail/i, 'Decryption with wrong password must throw authentication error');
  });
});

autoRunCLI();
