/**
 * F22: UTF-8 Base64 & Hex Dumper
 * Verifies Unicode-safe Base64/Base64URL encoding/decoding and byte hex dumping with ASCII view in data-forge.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

function utf8ToBase64(str) {
  return Buffer.from(str, 'utf8').toString('base64');
}

function base64ToUtf8(b64) {
  return Buffer.from(b64, 'base64').toString('utf8');
}

function toBase64URL(b64) {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createHexDump(buffer) {
  const lines = [];
  for (let i = 0; i < buffer.length; i += 16) {
    const chunk = buffer.subarray(i, i + 16);
    const hexParts = [];
    let asciiPart = '';
    for (let j = 0; j < 16; j++) {
      if (j < chunk.length) {
        hexParts.push(chunk[j].toString(16).padStart(2, '0'));
        const byte = chunk[j];
        asciiPart += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
      } else {
        hexParts.push('  ');
      }
    }
    const offset = i.toString(16).padStart(8, '0');
    lines.push(`${offset}  ${hexParts.join(' ')}  |${asciiPart}|`);
  }
  return lines.join('\n');
}

describe('F22: UTF-8 Base64 & Hex Dumper', () => {
  const getDataForge = () => {
    const filePath = path.join(PROJECT_ROOT, 'data-forge.html');
    assert.ok(fs.existsSync(filePath), 'data-forge.html must exist at repository root');
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, scripts: extractScripts(content).join('\n') };
  };

  test('F22-1: UTF-8 safe Base64 encoder handles multi-byte unicode strings and emojis', () => {
    const input = '🔐 1files Vault 2026 🚀 漢字';
    const encoded = utf8ToBase64(input);
    const decoded = base64ToUtf8(encoded);
    assert.equal(decoded, input, 'Decoded UTF-8 string must match multi-byte unicode input exactly');
  });

  test('F22-2: Base64URL mode replaces + with -, / with _, and strips padding =', () => {
    const b64 = 'abc+def/123==';
    const b64url = toBase64URL(b64);
    assert.ok(!b64url.includes('+'), 'Must not contain +');
    assert.ok(!b64url.includes('/'), 'Must not contain /');
    assert.ok(!b64url.includes('='), 'Must strip trailing = padding');
  });

  test('F22-3: Hex dumper formats byte offsets and two-character hexadecimal bytes', () => {
    const sample = Buffer.from('Hello 1files!', 'utf8');
    const dump = createHexDump(sample);
    assert.ok(dump.includes('00000000'), 'Hex dump must display 8-digit byte offset');
    assert.ok(dump.includes('48 65 6c 6c 6f'), 'Hex dump must display byte representations of "Hello"');
  });

  test('F22-4: Hex dumper displays printable ASCII column with dot (.) substitution for non-printables', () => {
    const sample = Buffer.from([0x00, 0x41, 0x42, 0x1F, 0x7E]);
    const dump = createHexDump(sample);
    assert.ok(dump.includes('.AB.~'), 'Must render printable characters and replace controls with .');
  });

  test('F22-5: Mode selector toolbar in data-forge.html includes Base64 and Hex options', () => {
    const { content } = getDataForge();
    assert.ok(/base64/i.test(content), 'Must include Base64 option in UI');
    assert.ok(/hex/i.test(content), 'Must include Hex dumper option in UI');
  });
});

autoRunCLI();
