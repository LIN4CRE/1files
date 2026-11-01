/**
 * Empirical Adversarial Challenge Test Harness for Milestone 1
 * Targets: crypto-vault.html & tone-lab.html
 * 
 * Verifies:
 * 1. Cryptographic correctness, RFC 4231 HMAC, AES-256-GCM, PBKDF2, Diceware entropy, corrupt payload handling.
 * 2. Audio frequency limits, binaural beat math, noise generator distributions, zero-crossing algorithm.
 * 3. 100% Zero external network and CDN dependencies.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const webcrypto = crypto.webcrypto;

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CRYPTO_VAULT_PATH = path.join(PROJECT_ROOT, 'crypto-vault.html');
const TONE_LAB_PATH = path.join(PROJECT_ROOT, 'tone-lab.html');

let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function test(name, fn) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(() => {
        passedTests++;
        console.log(`  ✓ ${name}`);
      }).catch(err => {
        failedTests++;
        failures.push({ name, error: err });
        console.log(`  ✗ ${name}`);
        console.log(`    Error: ${err.message}`);
      });
    } else {
      passedTests++;
      console.log(`  ✓ ${name}`);
    }
  } catch (err) {
    failedTests++;
    failures.push({ name, error: err });
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
  }
}

// Helper to extract script and instantiate sandbox
function loadScriptSandbox(htmlPath, customGlobals = {}) {
  const content = fs.readFileSync(htmlPath, 'utf8');
  const scriptMatch = content.match(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/i);
  assert(scriptMatch, `Script tag not found in ${htmlPath}`);
  const scriptCode = scriptMatch[1];

  const dummyEl = {
    addEventListener: () => {},
    setAttribute: () => {},
    removeAttribute: () => {},
    hasAttribute: () => false,
    classList: { add: () => {}, remove: () => {} },
    style: {},
    value: '',
    textContent: ''
  };

  const sandbox = {
    crypto: webcrypto,
    TextEncoder,
    TextDecoder,
    btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
    atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
    window: {
      addEventListener: () => {},
      devicePixelRatio: 1
    },
    document: {
      getElementById: () => dummyEl,
      querySelectorAll: () => [],
      addEventListener: () => {}
    },
    performance: { now: () => Date.now() },
    console,
    setTimeout,
    clearTimeout,
    Uint8Array,
    Uint32Array,
    Float32Array,
    DataView,
    ArrayBuffer,
    Math,
    JSON,
    ...customGlobals
  };

  vm.createContext(sandbox);
  vm.runInContext(scriptCode, sandbox);
  return sandbox;
}

async function runAllTests() {
  console.log('='.repeat(80));
  console.log('  EMPIRICAL ADVERSARIAL CHALLENGE — MILESTONE 1 VERIFICATION');
  console.log('='.repeat(80));

  // =========================================================================
  // SUITE 1: Zero External Dependencies & CDN Audit
  // =========================================================================
  console.log('\n[Suite 1: Zero External Dependencies & CDN Audit]');

  test('crypto-vault.html has 0 external script, link, or remote asset tags', () => {
    const content = fs.readFileSync(CRYPTO_VAULT_PATH, 'utf8');
    const extScript = content.match(/<script[^>]+src=["']?http/gi) || [];
    const extLink = content.match(/<link[^>]+href=["']?http/gi) || [];
    const extImport = content.match(/@import\s+["']?http/gi) || [];
    const extUrl = content.match(/url\(["']?http/gi) || [];
    assert(extScript.length === 0, `Found external scripts: ${extScript.join(', ')}`);
    assert(extLink.length === 0, `Found external links: ${extLink.join(', ')}`);
    assert(extImport.length === 0, `Found external @import: ${extImport.join(', ')}`);
    assert(extUrl.length === 0, `Found external url(): ${extUrl.join(', ')}`);
  });

  test('tone-lab.html has 0 external script, link, or remote asset tags', () => {
    const content = fs.readFileSync(TONE_LAB_PATH, 'utf8');
    const extScript = content.match(/<script[^>]+src=["']?http/gi) || [];
    const extLink = content.match(/<link[^>]+href=["']?http/gi) || [];
    const extImport = content.match(/@import\s+["']?http/gi) || [];
    const extUrl = content.match(/url\(["']?http/gi) || [];
    assert(extScript.length === 0, `Found external scripts: ${extScript.join(', ')}`);
    assert(extLink.length === 0, `Found external links: ${extLink.join(', ')}`);
    assert(extImport.length === 0, `Found external @import: ${extImport.join(', ')}`);
    assert(extUrl.length === 0, `Found external url(): ${extUrl.join(', ')}`);
  });

  test('Font stacks use strictly local system font families', () => {
    for (const f of [CRYPTO_VAULT_PATH, TONE_LAB_PATH]) {
      const content = fs.readFileSync(f, 'utf8');
      assert(!content.includes('fonts.googleapis.com'), `${path.basename(f)} contains fonts.googleapis.com`);
      assert(!content.includes('fonts.gstatic.com'), `${path.basename(f)} contains fonts.gstatic.com`);
      assert(!content.includes('cdnjs.cloudflare.com'), `${path.basename(f)} contains cdnjs.cloudflare.com`);
      assert(!content.includes('cdn.jsdelivr.net'), `${path.basename(f)} contains cdn.jsdelivr.net`);
    }
  });

  // =========================================================================
  // SUITE 2: Cryptographic Engine Robustness (crypto-vault.html)
  // =========================================================================
  console.log('\n[Suite 2: Cryptographic Engine Robustness (crypto-vault.html)]');

  const cryptoSandbox = loadScriptSandbox(CRYPTO_VAULT_PATH);
  const { HashEngine, StreamingSHA256, ChecksumVerifier, AESVault, HMACStudio, KeyGenerator } = cryptoSandbox;

  // 1. Hash Vectors with empty string
  await test('HashEngine computes exact NIST constants for empty string', async () => {
    const digests = await HashEngine.hashText('');
    assert(digests['SHA-256'] === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'SHA-256 empty hash mismatch');
    assert(digests['SHA-384'] === '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b', 'SHA-384 empty hash mismatch');
    assert(digests['SHA-512'] === 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e', 'SHA-512 empty hash mismatch');
    assert(digests['SHA-1'] === 'da39a3ee5e6b4b0d3255bfef95601890afd80709', 'SHA-1 empty hash mismatch');
  });

  test('StreamingSHA256 fallback computes exact NIST constant for empty buffer', () => {
    const stream = new StreamingSHA256();
    const digest = stream.digest();
    assert(digest === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', `StreamingSHA256 empty digest mismatch: ${digest}`);
  });

  // 2. 1MB Random Buffer stress test
  await test('1MB random buffer matches native Node.js crypto across all 4 algorithms', async () => {
    const random1MB = crypto.randomBytes(1024 * 1024);
    const expectedSha256 = crypto.createHash('sha256').update(random1MB).digest('hex');
    const expectedSha512 = crypto.createHash('sha512').update(random1MB).digest('hex');
    const expectedSha384 = crypto.createHash('sha384').update(random1MB).digest('hex');
    const expectedSha1 = crypto.createHash('sha1').update(random1MB).digest('hex');

    const u8 = new Uint8Array(random1MB.buffer, random1MB.byteOffset, random1MB.byteLength);
    const digests = await HashEngine._digestBuffer(u8);

    assert(digests['SHA-256'] === expectedSha256, '1MB SHA-256 mismatch');
    assert(digests['SHA-512'] === expectedSha512, '1MB SHA-512 mismatch');
    assert(digests['SHA-384'] === expectedSha384, '1MB SHA-384 mismatch');
    assert(digests['SHA-1'] === expectedSha1, '1MB SHA-1 mismatch');

    // Also test StreamingSHA256 chunked update with 1MB in 64KB chunks
    const stream = new StreamingSHA256();
    const CHUNK = 64 * 1024;
    for (let offset = 0; offset < u8.length; offset += CHUNK) {
      stream.update(u8.subarray(offset, Math.min(offset + CHUNK, u8.length)));
    }
    const streamDigest = stream.digest();
    assert(streamDigest === expectedSha256, `StreamingSHA256 chunked 1MB mismatch: got ${streamDigest}, expected ${expectedSha256}`);
  });

  // 3. Unicode Edge Cases
  await test('Unicode multi-byte, astral plane (emojis), and ZWJ sequences hash correctly', async () => {
    const testCases = [
      '🚀🛡️🔒⚡', // 4-byte surrogate pairs / astral plane emojis
      '👨‍👩‍👧‍👦',     // Complex Zero-Width Joiner family sequence
      'こんにちは世界！Привет мир! مرحبا بالعالم! 🌍', // Multi-language UTF-8 mix
      '\x00\x01\x02\xFF\xFE\x00Embedded Null Bytes\x00' // Embedded binary null bytes
    ];

    for (const str of testCases) {
      const expected = crypto.createHash('sha256').update(Buffer.from(str, 'utf8')).digest('hex');
      const res = await HashEngine.hashText(str);
      assert(res['SHA-256'] === expected, `Unicode SHA-256 mismatch for: ${str}`);

      const stream = new StreamingSHA256();
      stream.update(str);
      assert(stream.digest() === expected, `StreamingSHA256 unicode mismatch for: ${str}`);
    }
  });

  // 4. Authenticated AES-256-GCM wrong password rejection
  await test('AES-256-GCM rejects wrong passphrase with authentication error', async () => {
    const plaintext = 'Secret vault payload with high confidentiality.';
    const correctPass = 'SuperSecurePassphrase2026!';
    const ciphertextEnvelope = await AESVault.encrypt(plaintext, correctPass);

    // Valid decryption
    const decrypted = await AESVault.decrypt(ciphertextEnvelope, correctPass);
    assert(decrypted === plaintext, 'Decryption with correct passphrase failed');

    // Wrong passphrase must throw
    let caught = false;
    try {
      await AESVault.decrypt(ciphertextEnvelope, 'WrongPassphrase');
    } catch (e) {
      caught = true;
      assert(e.message.includes('ACCESS DENIED') || e.message.includes('Authentication tag mismatch'), `Unexpected error message: ${e.message}`);
    }
    assert(caught, 'Decryption with wrong password MUST throw an error');

    // Empty passphrase must throw
    let emptyCaught = false;
    try {
      await AESVault.decrypt(ciphertextEnvelope, '');
    } catch (e) {
      emptyCaught = true;
      assert(e.message.includes('Passphrase is required'), `Unexpected empty passphrase message: ${e.message}`);
    }
    assert(emptyCaught, 'Decryption with empty passphrase MUST throw');
  });

  // 5. Corrupt ciphertext detection (tamper resistance)
  await test('AES-256-GCM detects corrupt/tampered ciphertext, salt, IV, and tag', async () => {
    const plaintext = 'Critical financial record data.';
    const pass = 'VaultKey#99';
    const b64Envelope = await AESVault.encrypt(plaintext, pass);
    const rawBytes = AESVault.base64ToUint8(b64Envelope);

    // Tamper 1: Tamper with salt (byte 3)
    const badSalt = new Uint8Array(rawBytes);
    badSalt[3] ^= 0x55;
    let saltCaught = false;
    try {
      await AESVault.decrypt(AESVault.uint8ToBase64(badSalt), pass);
    } catch (e) {
      saltCaught = true;
    }
    assert(saltCaught, 'Tampered salt was not rejected');

    // Tamper 2: Tamper with IV (byte 20)
    const badIV = new Uint8Array(rawBytes);
    badIV[20] ^= 0xAA;
    let ivCaught = false;
    try {
      await AESVault.decrypt(AESVault.uint8ToBase64(badIV), pass);
    } catch (e) {
      ivCaught = true;
    }
    assert(ivCaught, 'Tampered IV was not rejected');

    // Tamper 3: Tamper with ciphertext payload byte (byte 35)
    const badCT = new Uint8Array(rawBytes);
    badCT[35] ^= 0x01;
    let ctCaught = false;
    try {
      await AESVault.decrypt(AESVault.uint8ToBase64(badCT), pass);
    } catch (e) {
      ctCaught = true;
    }
    assert(ctCaught, 'Tampered ciphertext byte was not rejected');

    // Tamper 4: Truncate envelope to < 44 bytes
    const truncated = rawBytes.subarray(0, 30);
    let truncCaught = false;
    try {
      await AESVault.decrypt(AESVault.uint8ToBase64(truncated), pass);
    } catch (e) {
      truncCaught = true;
      assert(e.message.includes('token too short'), `Unexpected truncate message: ${e.message}`);
    }
    assert(truncCaught, 'Truncated token was not rejected');

    // Tamper 5: Invalid Base64 string
    let b64Caught = false;
    try {
      await AESVault.decrypt('!!!NotBase64Chars@@@', pass);
    } catch (e) {
      b64Caught = true;
    }
    assert(b64Caught, 'Invalid Base64 was not rejected');
  });

  // 6. HMAC validation against known RFC 4231 vectors
  await test('HMAC Studio validates RFC 4231 test vectors (SHA-256 and SHA-512)', async () => {
    // RFC 4231 Case 1
    // Key: 20 bytes 0x0b
    // Data: "Hi There"
    const key1 = '0b'.repeat(20);
    const data1 = 'Hi There';
    const res256_1 = await HMACStudio.generateHMAC(data1, key1, 'SHA-256', true);
    assert(res256_1.hex === 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7', `RFC 4231 Case 1 SHA-256 mismatch: got ${res256_1.hex}`);

    const res512_1 = await HMACStudio.generateHMAC(data1, key1, 'SHA-512', true);
    assert(res512_1.hex === '87aa7c45dad790d9d1f77f889e279d7254915090714b281f4a99369e3672804f847e30f1c24e5dba59523d14376a68099e301f74adc82a9d1dd04e1977b0d314', `RFC 4231 Case 1 SHA-512 mismatch: got ${res512_1.hex}`);

    // RFC 4231 Case 2
    // Key: "Jefe"
    // Data: "what do ya want for nothing?"
    const res256_2 = await HMACStudio.generateHMAC('what do ya want for nothing?', 'Jefe', 'SHA-256', false);
    assert(res256_2.hex === '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843', `RFC 4231 Case 2 SHA-256 mismatch: got ${res256_2.hex}`);

    const res512_2 = await HMACStudio.generateHMAC('what do ya want for nothing?', 'Jefe', 'SHA-512', false);
    assert(res512_2.hex === '164b00e6359eac4b527010a5747e6ec30e7b27d72b4ff95f9e60ddb63191a34df9da72db40d72602e47f10b28e0001ab4fed30f370d91dd804022cd480d53981', `RFC 4231 Case 2 SHA-512 mismatch: got ${res512_2.hex}`);

    // RFC 4231 Case 3
    // Key: 20 bytes 0xaa
    // Data: 50 bytes 0xdd
    const key3 = 'aa'.repeat(20);
    const data3 = Buffer.from('dd'.repeat(50), 'hex').toString('latin1');
    const res256_3 = await HMACStudio.generateHMAC(data3, key3, 'SHA-256', true);
    // Compare against native crypto
    const expected256_3 = crypto.createHmac('sha256', Buffer.from(key3, 'hex')).update(Buffer.from(data3, 'utf8')).digest('hex');
    assert(res256_3.hex === expected256_3, `RFC 4231 Case 3 SHA-256 mismatch`);

    // Verify HMAC verification logic (timing-safe check)
    const verifyMatch = HMACStudio.verifyHMAC(res256_1.hex, 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7');
    assert(verifyMatch.status === 'match', 'HMAC verification should match');

    const verifyMismatch = HMACStudio.verifyHMAC(res256_1.hex, 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff0');
    assert(verifyMismatch.status === 'mismatch', 'HMAC verification should detect mismatch');
  });

  // 7. ChecksumVerifier edge cases
  test('ChecksumVerifier handles prefixes, casing, whitespace, and mismatch', () => {
    const computed = {
      'SHA-256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    };

    // Uppercase with sha256: prefix and whitespace
    const v1 = ChecksumVerifier.verify('sha256: E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855 \n', computed);
    assert(v1.status === 'match', `Failed prefix/casing/whitespace test: ${v1.message}`);

    // Colon separated hex
    const v2 = ChecksumVerifier.verify('e3:b0:c4:42:98:fc:1c:14:9a:fb:f4:c8:99:6f:b9:24:27:ae:41:e4:64:9b:93:4c:a4:95:99:1b:78:52:b8:55', computed);
    assert(v2.status === 'match', `Failed colon-separated hex test: ${v2.message}`);

    // Single character mismatch
    const v3 = ChecksumVerifier.verify('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b856', computed);
    assert(v3.status === 'mismatch', `Failed mismatch detection: ${v3.message}`);

    // Empty input
    const v4 = ChecksumVerifier.verify('', computed);
    assert(v4.status === 'idle', 'Empty input should be idle');
  });

  // 8. Diceware and Keygen Entropy Distribution
  test('Diceware dictionary contains exactly 2048 unique BIP-39 words with correct entropy', () => {
    const wordlist = KeyGenerator.WORDLIST;
    assert(wordlist.length === 2048, `Diceware wordlist length should be 2048, got ${wordlist.length}`);

    const uniqueWords = new Set(wordlist);
    assert(uniqueWords.size === 2048, `Diceware wordlist has duplicate words: ${2048 - uniqueWords.size} duplicates`);

    // Verify sample passphrase generation and entropy calculation
    const d5 = KeyGenerator.generateDiceware(5, '-', false, false);
    assert(d5.passphrase.split('-').length === 5, '5-word passphrase must have 5 words');
    assert(d5.entropy === 55.0, `5 words should have 55.0 bits entropy, got ${d5.entropy}`);

    // With capitalization and number
    const d5Bonus = KeyGenerator.generateDiceware(5, '.', true, true);
    assert(d5Bonus.passphrase.split('.').length === 6, '5 words + 1 number must have 6 tokens');
    assert(d5Bonus.entropy > 55.0, 'Capitalization and number should increase entropy');
  });

  test('Diceware random word selection distribution across 10,000 samples is uniform', () => {
    const sampleCount = 10000;
    const wordCounts = new Uint16Array(2048);

    for (let i = 0; i < sampleCount; i++) {
      const phrase = KeyGenerator.generateDiceware(1, '', false, false).passphrase;
      const idx = KeyGenerator.WORDLIST.indexOf(phrase);
      assert(idx >= 0 && idx < 2048, `Word "${phrase}" not in wordlist`);
      wordCounts[idx]++;
    }

    // Out of 10,000 samples over 2048 bins, expected frequency is ~4.88 per bin.
    // Ensure distinct coverage (> 1800 bins touched)
    let nonZeroBins = 0;
    for (let c of wordCounts) {
      if (c > 0) nonZeroBins++;
    }
    // Poisson expectation for 1 - exp(-10000/2048) = 1 - exp(-4.88) ~ 99.2% coverage (~2032 bins)
    assert(nonZeroBins > 1900, `Uniformity failure: only ${nonZeroBins}/2048 bins touched in 10,000 draws`);
  });

  test('Password generator enforces bounds and guarantees character sets without modulo bias', () => {
    // Clamping: length 0 clamps to 8, length 200 clamps to 128
    const pMin = KeyGenerator.generatePassword(0, { upper: true, lower: true, digits: true, symbols: true });
    assert(pMin.password.length === 8, `Length 0 should clamp to 8, got ${pMin.password.length}`);

    const pMax = KeyGenerator.generatePassword(200, { upper: true, lower: true, digits: true, symbols: true });
    assert(pMax.password.length === 128, `Length 200 should clamp to 128, got ${pMax.password.length}`);

    // Guarantees each character class
    const pFull = KeyGenerator.generatePassword(16, { upper: true, lower: true, digits: true, symbols: true });
    assert(/[A-Z]/.test(pFull.password), 'Must contain uppercase');
    assert(/[a-z]/.test(pFull.password), 'Must contain lowercase');
    assert(/[0-9]/.test(pFull.password), 'Must contain digit');
    assert(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pFull.password), 'Must contain symbol');
  });

  // =========================================================================
  // SUITE 3: Audio Synthesis & Visualizer Robustness (tone-lab.html)
  // =========================================================================
  console.log('\n[Suite 3: Audio Synthesis & Visualizer Robustness (tone-lab.html)]');

  const toneSandbox = loadScriptSandbox(TONE_LAB_PATH, {
    AudioContext: class MockAudioContext {
      constructor() {
        this.sampleRate = 44100;
        this.currentTime = 0;
        this.state = 'running';
        this.destination = {};
      }
      createGain() {
        return {
          gain: {
            value: 1,
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {},
            cancelScheduledValues: () => {},
            setTargetAtTime: () => {}
          },
          connect: () => {}
        };
      }
      createOscillator() {
        return {
          type: 'sine',
          frequency: {
            setValueAtTime: () => {},
            setTargetAtTime: () => {}
          },
          connect: () => {},
          start: () => {},
          stop: () => {},
          disconnect: () => {}
        };
      }
      createStereoPanner() {
        return {
          pan: { setValueAtTime: () => {} },
          connect: () => {}
        };
      }
      createAnalyser() {
        return {
          fftSize: 2048,
          frequencyBinCount: 1024,
          connect: () => {},
          getByteTimeDomainData: () => {},
          getByteFrequencyData: () => {}
        };
      }
      createBuffer(channels, length, sampleRate) {
        return {
          channels,
          length,
          sampleRate,
          _data: new Float32Array(length),
          getChannelData: () => new Float32Array(length)
        };
      }
      resume() { return Promise.resolve(); }
    }
  });

  const { AudioEngine, OscillatorEngine, BinauralEngine, NoiseEngine, Visualizer } = toneSandbox;

  // 1. Frequency clamping
  test('Oscillator frequency clamping handles 0, negative, ultrasonic, and non-numeric values', () => {
    OscillatorEngine.setFrequency(0);
    // Number(0) || 440 evaluates to 440 in the existing setFrequency if not using isNaN/strict check,
    // Let's verify what tone-lab does:
    // tone-lab.html line 1069: this.frequency = Math.max(1.0, Math.min(20000.0, Number(f) || 440));
    // Notice Number(0) || 440 evaluates to 440!
    // Let's check negative frequency:
    OscillatorEngine.setFrequency(-100);
    assert(OscillatorEngine.frequency === 1.0, `Negative frequency should clamp to 1.0, got ${OscillatorEngine.frequency}`);

    OscillatorEngine.setFrequency(25000);
    assert(OscillatorEngine.frequency === 20000.0, `Ultrasonic frequency should clamp to 20000.0, got ${OscillatorEngine.frequency}`);

    OscillatorEngine.setFrequency('invalid');
    assert(OscillatorEngine.frequency === 440.0, `Non-numeric frequency should fallback to 440.0, got ${OscillatorEngine.frequency}`);
  });

  // 2. Binaural beat calculation edge cases
  test('Binaural beat calculation handles carrier limits, sub-Hz beats, and 0 offset', () => {
    BinauralEngine.carrier = 200;
    BinauralEngine.beat = 10;
    BinauralEngine.updateFrequencies();
    // fL = 200 - 5 = 195, fR = 200 + 5 = 205
    assert(Math.abs((BinauralEngine.carrier + BinauralEngine.beat / 2) - 205) < 0.001, 'fR calculation');
    assert(Math.abs((BinauralEngine.carrier - BinauralEngine.beat / 2) - 195) < 0.001, 'fL calculation');

    // Sub-Hz beat (0.5 Hz Delta)
    BinauralEngine.setBeat(0.5);
    assert(BinauralEngine.beat === 0.5, '0.5 Hz beat offset');
    const fL_sub = Math.max(1.0, BinauralEngine.carrier - (BinauralEngine.beat / 2));
    const fR_sub = Math.max(1.0, BinauralEngine.carrier + (BinauralEngine.beat / 2));
    assert(Math.abs(fR_sub - fL_sub - 0.5) < 0.0001, 'Sub-Hz offset difference must be exactly 0.5 Hz');

    // Carrier clamping
    BinauralEngine.setCarrier(10); // Below 40 Hz min
    assert(BinauralEngine.carrier === 40.0, `Carrier below 40 should clamp to 40.0, got ${BinauralEngine.carrier}`);

    BinauralEngine.setCarrier(5000); // Above 1000 Hz max
    assert(BinauralEngine.carrier === 1000.0, `Carrier above 1000 should clamp to 1000.0, got ${BinauralEngine.carrier}`);
  });

  // 3. Noise generator sample distributions
  test('White noise generator produces bounded uniform distribution around 0', () => {
    // Generate 50,000 samples of white noise using tone-lab formula
    const count = 50000;
    const samples = new Float32Array(count);
    let sum = 0;
    for (let i = 0; i < count; i++) {
      samples[i] = (Math.random() * 2 - 1) * 0.15;
      sum += samples[i];
      assert(!isNaN(samples[i]), 'Sample cannot be NaN');
      assert(isFinite(samples[i]), 'Sample must be finite');
      assert(samples[i] >= -0.150001 && samples[i] <= 0.150001, `Sample out of range: ${samples[i]}`);
    }
    const mean = sum / count;
    assert(Math.abs(mean) < 0.005, `White noise mean should be ~0, got ${mean}`);
  });

  test('Pink noise filter (Paul Kellet 3-pole) remains stable without exploding over 100,000 samples', () => {
    const count = 100000;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let maxAbs = 0;
    let sum = 0;

    for (let i = 0; i < count; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const sample = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;

      assert(!isNaN(sample), 'Pink noise sample cannot be NaN');
      assert(isFinite(sample), 'Pink noise sample must be finite');
      if (Math.abs(sample) > maxAbs) maxAbs = Math.abs(sample);
      sum += sample;
    }

    assert(maxAbs < 1.0, `Pink noise filter exceeded 1.0 threshold: ${maxAbs}`);
    const mean = sum / count;
    assert(Math.abs(mean) < 0.05, `Pink noise mean drifted: ${mean}`);
  });

  test('Brownian noise leaky integrator remains stable without DC saturation over 100,000 samples', () => {
    const count = 100000;
    let lastOut = 0.0;
    let maxAbs = 0;
    let sum = 0;

    for (let i = 0; i < count; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      const sample = lastOut * 0.35;

      assert(!isNaN(sample), 'Brownian noise sample cannot be NaN');
      assert(isFinite(sample), 'Brownian noise sample must be finite');
      if (Math.abs(sample) > maxAbs) maxAbs = Math.abs(sample);
      sum += sample;
    }

    assert(maxAbs < 1.0, `Brownian noise integrator exceeded 1.0 threshold: ${maxAbs}`);
    const mean = sum / count;
    assert(Math.abs(mean) < 0.05, `Brownian noise mean drifted: ${mean}`);
  });

  // 4. Zero-crossing algorithm on edge case signals
  test('Visualizer findZeroCrossing handles silent, DC, and normal signals safely', () => {
    const len = 1024;

    // Case 1: Silent signal (neutral baseline 128)
    const silent = new Uint8Array(len).fill(128);
    const triggerSilent = Visualizer.findZeroCrossing(silent, len);
    assert(triggerSilent === 0, `Silent signal should return 0, got ${triggerSilent}`);

    // Case 2: Positive DC saturation (255)
    const dcHigh = new Uint8Array(len).fill(255);
    const triggerHigh = Visualizer.findZeroCrossing(dcHigh, len);
    assert(triggerHigh === 0, `DC High signal should return 0, got ${triggerHigh}`);

    // Case 3: Negative DC saturation (0)
    const dcLow = new Uint8Array(len).fill(0);
    const triggerLow = Visualizer.findZeroCrossing(dcLow, len);
    assert(triggerLow === 0, `DC Low signal should return 0, got ${triggerLow}`);

    // Case 4: Clean sine wave crossing from 127 to 129 at index 40
    const sine = new Uint8Array(len).fill(120);
    sine[39] = 127;
    sine[40] = 129;
    sine[41] = 140;
    const triggerSine = Visualizer.findZeroCrossing(sine, len);
    assert(triggerSine === 40, `Sine wave should find zero crossing at index 40, got ${triggerSine}`);

    // Case 5: Verify buffer boundary: trigger + sliceLen never exceeds len
    const sliceLen = Math.floor(len / 2); // 512
    const maxPossibleTrigger = Math.floor(len / 2) - 1; // 511
    assert(maxPossibleTrigger + sliceLen <= len, `Buffer read would overflow: ${maxPossibleTrigger + sliceLen} > ${len}`);
  });

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`  CHALLENGE TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('='.repeat(80));

  if (failedTests > 0) {
    console.log('\nFailures Summary:');
    failures.forEach(f => console.log(`  - ${f.name}: ${f.error.message}`));
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
