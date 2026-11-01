/**
 * Authoritative Cryptographic Reference Oracle for 1files E2E Tests.
 * Uses Node.js native crypto module (FIPS/NIST validated) as the mathematical ground truth.
 */

const crypto = require('node:crypto');

/**
 * Computes hash digest of string or Buffer.
 * Algorithm: 'sha256', 'sha512', 'sha384', 'sha1'
 */
function computeHash(data, algorithm = 'sha256') {
  const hash = crypto.createHash(algorithm);
  hash.update(typeof data === 'string' ? Buffer.from(data, 'utf8') : data);
  return hash.digest('hex').toLowerCase();
}

/**
 * Computes HMAC digest.
 */
function computeHmac(key, data, algorithm = 'sha256') {
  const hmac = crypto.createHmac(algorithm, typeof key === 'string' ? Buffer.from(key, 'utf8') : key);
  hmac.update(typeof data === 'string' ? Buffer.from(data, 'utf8') : data);
  return hmac.digest('hex').toLowerCase();
}

/**
 * Derives 256-bit AES-GCM key using PBKDF2 with SHA-256.
 */
function deriveKeyPBKDF2(passphrase, salt, iterations = 100000, keyLen = 32) {
  const saltBuf = Buffer.isBuffer(salt) ? salt : Buffer.from(salt);
  return crypto.pbkdf2Sync(passphrase, saltBuf, iterations, keyLen, 'sha256');
}

/**
 * Encrypts plaintext using AES-256-GCM adhering to WebCrypto standard envelope:
 * Salt (16 bytes) + IV (12 bytes) + Ciphertext + AuthTag (16 bytes).
 */
function encryptAESGCM(plaintext, passphrase, options = {}) {
  const salt = options.salt || crypto.randomBytes(16);
  const iv = options.iv || crypto.randomBytes(12);
  const iterations = options.iterations || 100000;

  const key = deriveKeyPBKDF2(passphrase, salt, iterations, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const plainBuf = Buffer.from(plaintext, 'utf8');
  const enc = Buffer.concat([cipher.update(plainBuf), cipher.final()]);
  const tag = cipher.getAuthTag();

  // WebCrypto format: salt (16) + iv (12) + enc + tag (16)
  const envelope = Buffer.concat([salt, iv, enc, tag]);
  return {
    envelopeHex: envelope.toString('hex'),
    envelopeBase64: envelope.toString('base64'),
    saltHex: salt.toString('hex'),
    ivHex: iv.toString('hex'),
    ciphertextHex: enc.toString('hex'),
    tagHex: tag.toString('hex')
  };
}

/**
 * Decrypts AES-256-GCM envelope (salt + iv + ciphertext + tag) with passphrase.
 */
function decryptAESGCM(envelopeBuffer, passphrase, iterations = 100000) {
  if (envelopeBuffer.length < 16 + 12 + 16) {
    throw new Error('Ciphertext envelope too short');
  }

  const salt = envelopeBuffer.subarray(0, 16);
  const iv = envelopeBuffer.subarray(16, 28);
  const tag = envelopeBuffer.subarray(envelopeBuffer.length - 16);
  const enc = envelopeBuffer.subarray(28, envelopeBuffer.length - 16);

  const key = deriveKeyPBKDF2(passphrase, salt, iterations, 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}

module.exports = {
  computeHash,
  computeHmac,
  deriveKeyPBKDF2,
  encryptAESGCM,
  decryptAESGCM
};
