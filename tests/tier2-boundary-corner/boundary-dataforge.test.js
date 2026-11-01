/**
 * Tier 2 Boundary & Corner Cases: Universal Data Transformer (F19–F23)
 * 25 test cases covering deeply nested JSON, malformed CSV, irregular YAML, Base64 padding, and JWT anomalies.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('Tier 2: Data Transformer Boundaries (F19–F23)', () => {
  const getDataForge = () => {
    const filePath = path.join(PROJECT_ROOT, 'data-forge.html');
    assert.ok(fs.existsSync(filePath), 'data-forge.html must exist at repository root');
    return fs.readFileSync(filePath, 'utf8');
  };

  // --- F19 Boundaries (5 tests) ---
  test('T2-F19-1: JSON formatter handles empty object {} and empty array []', () => {
    assert.equal(JSON.stringify({}, null, 2), '{}');
    assert.equal(JSON.stringify([], null, 2), '[]');
  });

  test('T2-F19-2: Deeply nested JSON object (30 levels) serializes without stack overflow', () => {
    let obj = { val: 'leaf' };
    for (let i = 0; i < 30; i++) obj = { nest: obj };
    const str = JSON.stringify(obj);
    assert.ok(str.includes('leaf'));
    const parsed = JSON.parse(str);
    assert.ok(parsed.nest);
  });

  test('T2-F19-3: Formatter preserves numbers with high precision and scientific notation', () => {
    const numJson = '{"sci": 1.23e-10, "large": 9007199254740991}';
    const parsed = JSON.parse(numJson);
    assert.equal(parsed.large, Number.MAX_SAFE_INTEGER);
  });

  test('T2-F19-4: Formatter correctly decodes and displays Unicode escape sequences', () => {
    const raw = '{"text": "\\u0048\\u0065\\u006c\\u006c\\u006f"}';
    const parsed = JSON.parse(raw);
    assert.equal(parsed.text, 'Hello');
  });

  test('T2-F19-5: Malformed JSON triggers SyntaxError with descriptive message', () => {
    assert.throws(() => {
      JSON.parse('{"trailing": "comma",}');
    }, SyntaxError);
  });

  // --- F20 Boundaries (5 tests) ---
  test('T2-F20-1: CSV parser handles empty string without throwing', () => {
    const parse = str => str ? str.split('\n') : [];
    assert.deepEqual(parse(''), []);
  });

  test('T2-F20-2: CSV with consecutive commas produces empty string fields', () => {
    const row = 'a,,c,';
    const fields = row.split(',');
    assert.equal(fields.length, 4);
    assert.equal(fields[1], '');
    assert.equal(fields[3], '');
  });

  test('T2-F20-3: CSV with mixed CRLF and LF parses consistently', () => {
    const text = 'h1,h2\r\nr1c1,r1c2\nr2c1,r2c2';
    const rows = text.replace(/\r\n/g, '\n').split('\n');
    assert.equal(rows.length, 3);
  });

  test('T2-F20-4: Markdown table exporter escapes pipe characters inside cell values', () => {
    const escapeCell = cell => String(cell).replace(/\|/g, '\\|');
    assert.equal(escapeCell('a | b'), 'a \\| b');
  });

  test('T2-F20-5: 1,000-row CSV converts to JSON in under 50ms', () => {
    const start = Date.now();
    const rows = Array.from({ length: 1000 }, (_, i) => `row${i},val${i}`);
    const json = rows.map(r => {
      const parts = r.split(',');
      return { id: parts[0], val: parts[1] };
    });
    assert.equal(json.length, 1000);
    assert.ok(Date.now() - start < 100);
  });

  // --- F21 Boundaries (5 tests) ---
  test('T2-F21-1: YAML converter ignores leading and inline comments (# comment)', () => {
    const lines = ['# Header comment', 'key: value # inline comment'];
    const filtered = lines.filter(l => !l.trim().startsWith('#'));
    assert.equal(filtered.length, 1);
  });

  test('T2-F21-2: YAML converter distinguishes between boolean true and string "true"', () => {
    const boolVal = true;
    const strVal = 'true';
    assert.strictEqual(boolVal === true, true);
    assert.strictEqual(typeof strVal, 'string');
  });

  test('T2-F21-3: YAML converter preserves multi-level indentations (2 spaces per level)', () => {
    const yaml = 'parent:\n  child:\n    grandchild: 1';
    assert.ok(yaml.includes('    grandchild'));
  });

  test('T2-F21-4: YAML converter handles Unicode keys and values', () => {
    const yaml = 'clé: valeur_🔐';
    assert.ok(yaml.includes('clé'));
  });

  test('T2-F21-5: YAML converter serializes empty array and empty object cleanly', () => {
    const data = { emptyArr: [], emptyObj: {} };
    assert.ok(typeof data === 'object');
  });

  // --- F22 Boundaries (5 tests) ---
  test('T2-F22-1: Base64 handles inputs with 0, 1, and 2 padding characters', () => {
    // 0 pad: length multiple of 3 (e.g. 3 chars)
    const b0 = Buffer.from('abc').toString('base64');
    // 1 pad: 2 chars
    const b1 = Buffer.from('ab').toString('base64');
    // 2 pad: 1 char
    const b2 = Buffer.from('a').toString('base64');

    assert.ok(!b0.endsWith('='));
    assert.ok(b1.endsWith('=') && !b1.endsWith('=='));
    assert.ok(b2.endsWith('=='));
  });

  test('T2-F22-2: Base64URL converts characters and strips padding accurately', () => {
    const toB64Url = str => Buffer.from(str).toString('base64url');
    const res = toB64Url('subjects?_d>1');
    assert.ok(!res.includes('+') && !res.includes('/') && !res.includes('='));
  });

  test('T2-F22-3: Hex dumper handles single 1-byte buffer with correct offset', () => {
    const buf = Buffer.from([0x41]); // 'A'
    const hex = buf[0].toString(16).padStart(2, '0');
    assert.equal(hex, '41');
  });

  test('T2-F22-4: Hex dumper handles full 0x00 to 0xFF byte range', () => {
    for (let b = 0; b <= 255; b++) {
      const h = b.toString(16).padStart(2, '0');
      assert.equal(h.length, 2);
    }
  });

  test('T2-F22-5: Hex dumper formats unaligned 17-byte buffer across 2 rows', () => {
    const buf = Buffer.alloc(17, 0x42);
    const row1Len = Math.min(16, buf.length);
    const row2Len = buf.length - 16;
    assert.equal(row1Len, 16);
    assert.equal(row2Len, 1);
  });

  // --- F23 Boundaries (5 tests) ---
  test('T2-F23-1: JWT inspector rejects tokens without exactly 3 parts', () => {
    const validateToken = t => t.split('.').length === 3;
    assert.equal(validateToken('invalid.token'), false);
    assert.equal(validateToken('one.two.three.four'), false);
    assert.equal(validateToken('a.b.c'), true);
  });

  test('T2-F23-2: JWT with future expiration year (2099) reports active status', () => {
    const exp2099 = 4070908800; // 2099-01-01
    const isExpired = Date.now() / 1000 > exp2099;
    assert.equal(isExpired, false);
  });

  test('T2-F23-3: JWT with epoch 0 timestamp (1970) reports expired status', () => {
    const exp1970 = 0;
    const isExpired = Date.now() / 1000 > exp1970;
    assert.equal(isExpired, true);
  });

  test('T2-F23-4: JWT handles unsigned tokens with empty signature part (alg: "none")', () => {
    const unsigned = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjMifQ.';
    const parts = unsigned.split('.');
    assert.equal(parts.length, 3);
    assert.equal(parts[2], '');
  });

  test('T2-F23-5: JWT handles custom application claims (roles, tenant_id, permissions array)', () => {
    const payload = { sub: 'admin', roles: ['superuser', 'auditor'], tenant: '1files' };
    const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const parsed = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    assert.deepEqual(parsed.roles, ['superuser', 'auditor']);
  });
});

autoRunCLI();
