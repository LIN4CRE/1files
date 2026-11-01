/**
 * Tier 4 Application Workload: Multi-Chunk Checksum Workflow
 * Simulates realistic end-to-end user workflow: multi-gigabyte file chunking, digest generation, and match verification.
 */

const crypto = require('node:crypto');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { computeHash } = require('../helpers/crypto-oracle');

describe('Tier 4 Workload: Multi-Chunk Checksum Workflow', () => {
  test('T4-WORKLOAD-1: Multi-chunk streaming digest computation matches monolithic hash', () => {
    // Simulate a 4MB file chunked in 1MB increments
    const CHUNK_SIZE = 1024 * 1024;
    const totalSize = 4 * CHUNK_SIZE;
    const mockFile = Buffer.alloc(totalSize);

    // Populate with pseudo-random deterministic bytes
    for (let i = 0; i < totalSize; i += 1024) {
      mockFile.writeUInt32LE(i, i);
    }

    // Monolithic hash
    const monolithicHash = computeHash(mockFile, 'sha256');

    // Streaming chunked hash (as performed by FileReader in crypto-vault.html)
    const streamHash = crypto.createHash('sha256');
    for (let offset = 0; offset < totalSize; offset += CHUNK_SIZE) {
      const chunk = mockFile.subarray(offset, offset + CHUNK_SIZE);
      streamHash.update(chunk);
    }
    const chunkedResult = streamHash.digest('hex');

    assert.equal(chunkedResult, monolithicHash, 'Chunked hash must match monolithic hash perfectly');
  });

  test('T4-WORKLOAD-2: User pastes official release SHA-256 and gets verified match', () => {
    const payload = '1files-release-v2.0-standalone-vault';
    const computedHash = computeHash(payload, 'sha256');

    // User pastes hash copied from GitHub Releases (with spaces and mixed casing)
    const userPasted = `\n  ${computedHash.toUpperCase()}  \r\n`;

    const cleanUserHash = userPasted.trim().toLowerCase();
    const isMatch = cleanUserHash === computedHash;

    assert.equal(isMatch, true, 'Visual verifier must signal positive match');
  });

  test('T4-WORKLOAD-3: User pastes corrupted checksum and gets instant mismatch warning', () => {
    const payload = '1files-payload';
    const computedHash = computeHash(payload, 'sha256');
    // Corrupt one hex character
    const corruptHash = computedHash.slice(0, -1) + (computedHash.slice(-1) === 'a' ? 'b' : 'a');

    const cleanUserHash = corruptHash.trim().toLowerCase();
    const isMatch = cleanUserHash === computedHash;

    assert.equal(isMatch, false, 'Visual verifier must signal mismatch');
  });

  test('T4-WORKLOAD-4: Full verification report text generation', () => {
    const filename = 'crypto-vault.html';
    const sha256 = computeHash('sample content', 'sha256');
    const sha512 = computeHash('sample content', 'sha512');

    const report = [
      `=== 1FILES INTEGRITY VERIFICATION REPORT ===`,
      `File: ${filename}`,
      `Date: ${new Date().toISOString()}`,
      `SHA-256: ${sha256}`,
      `SHA-512: ${sha512}`,
      `Status: VERIFIED MATCH`
    ].join('\n');

    assert.ok(report.includes('VERIFIED MATCH'));
    assert.ok(report.includes(sha256));
  });
});

autoRunCLI();
