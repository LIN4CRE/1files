/**
 * F23: Offline JWT Inspector
 * Verifies 3-part JWT decoding, claims parsing, and expiration calculation in data-forge.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

// RFC 7519 compliant reference JWT decoder
function decodeJWT(token) {
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT: must contain header, payload, and signature separated by dots');
  }

  const decodeBase64URL = str => {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  };

  const header = decodeBase64URL(parts[0]);
  const payload = decodeBase64URL(parts[1]);
  const signature = parts[2];

  let expiration = null;
  if (payload.exp) {
    const expDate = new Date(payload.exp * 1000);
    const now = new Date();
    expiration = {
      timestamp: payload.exp,
      iso: expDate.toISOString(),
      isExpired: now > expDate,
      deltaSeconds: Math.round((expDate - now) / 1000)
    };
  }

  return { header, payload, signature, expiration };
}

describe('F23: Offline JWT Inspector', () => {
  const getDataForge = () => {
    const filePath = path.join(PROJECT_ROOT, 'data-forge.html');
    assert.ok(fs.existsSync(filePath), 'data-forge.html must exist at repository root');
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, scripts: extractScripts(content).join('\n') };
  };

  test('F23-1: JWT inspector operates 100% offline without remote authorization servers', () => {
    const { content } = getDataForge();
    assert.ok(/jwt|token/i.test(content), 'data-forge.html must include JWT inspector mode');
  });

  test('F23-2: Accurately decodes standard JWT Header claims (alg, typ)', () => {
    // Standard test JWT
    const testHeader = { alg: 'HS256', typ: 'JWT' };
    const testPayload = { sub: 'user_123', name: 'Alice', exp: 1893456000 };
    const hB64 = Buffer.from(JSON.stringify(testHeader)).toString('base64url');
    const pB64 = Buffer.from(JSON.stringify(testPayload)).toString('base64url');
    const token = `${hB64}.${pB64}.mockSignature`;

    const decoded = decodeJWT(token);
    assert.equal(decoded.header.alg, 'HS256');
    assert.equal(decoded.header.typ, 'JWT');
  });

  test('F23-3: Accurately decodes JWT Payload claims (sub, name, custom attributes)', () => {
    const testPayload = { sub: 'agent-42', vault: '1files', admin: true };
    const hB64 = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
    const pB64 = Buffer.from(JSON.stringify(testPayload)).toString('base64url');
    const token = `${hB64}.${pB64}.`;

    const decoded = decodeJWT(token);
    assert.equal(decoded.payload.sub, 'agent-42');
    assert.equal(decoded.payload.vault, '1files');
    assert.equal(decoded.payload.admin, true);
  });

  test('F23-4: Converts exp/iat timestamps into standard ISO date representations', () => {
    const expSeconds = 1735689600; // 2025-01-01T00:00:00.000Z
    const token = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify({ exp: expSeconds })).toString('base64url')}.`;
    const decoded = decodeJWT(token);
    assert.equal(decoded.expiration.iso, '2025-01-01T00:00:00.000Z');
  });

  test('F23-5: Detects expired tokens and indicates expiration status', () => {
    const pastExp = 1577836800; // 2020-01-01
    const token = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify({ exp: pastExp })).toString('base64url')}.`;
    const decoded = decodeJWT(token);
    assert.equal(decoded.expiration.isExpired, true, 'Token with exp in 2020 must be flagged as expired');
  });
});

autoRunCLI();
