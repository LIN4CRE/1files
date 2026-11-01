/**
 * F24: Defensive Storage Layer
 * Verifies try/catch wrapped localStorage with in-memory fallback contract across applications.
 */

const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { createSandbox, runInSandbox } = require('../helpers/sandbox-vm');

describe('F24: Defensive Storage Layer', () => {
  const DEFENSIVE_STORAGE_IMPL = `
    const Storage = {
      _mem: {},
      get(k) { try { return localStorage.getItem(k); } catch(e) { return this._mem[k] ?? null; } },
      set(k, v) { try { localStorage.setItem(k, v); } catch(e) { this._mem[k] = String(v); } },
      remove(k) { try { localStorage.removeItem(k); } catch(e) { delete this._mem[k]; } }
    };
  `;

  test('F24-1: Defensive Storage persists and retrieves data in normal localStorage environment', () => {
    const sandbox = createSandbox({ blockStorage: false });
    runInSandbox(DEFENSIVE_STORAGE_IMPL, sandbox);

    runInSandbox(`Storage.set('theme', 'cyber');`, sandbox);
    const retrieved = runInSandbox(`Storage.get('theme');`, sandbox);
    assert.equal(retrieved, 'cyber', 'Should store and retrieve from standard localStorage');
  });

  test('F24-2: Defensive Storage switches to in-memory fallback when localStorage throws SecurityError', () => {
    const sandbox = createSandbox({ blockStorage: true }); // triggers SecurityError on any call
    runInSandbox(DEFENSIVE_STORAGE_IMPL, sandbox);

    assert.doesNotThrow(() => {
      runInSandbox(`Storage.set('activeMode', 'json');`, sandbox);
    }, 'Storage.set must not throw when localStorage is blocked');

    const value = runInSandbox(`Storage.get('activeMode');`, sandbox);
    assert.equal(value, 'json', 'Must retrieve stored value from in-memory fallback');
  });

  test('F24-3: Fallback stores data in _mem dictionary', () => {
    const sandbox = createSandbox({ blockStorage: true });
    runInSandbox(DEFENSIVE_STORAGE_IMPL, sandbox);

    runInSandbox(`Storage.set('volume', 0.8);`, sandbox);
    const memVal = runInSandbox(`Storage._mem['volume'];`, sandbox);
    assert.equal(memVal, '0.8', '_mem must contain the stringified value');
  });

  test('F24-4: Storage.remove properly purges items in in-memory fallback', () => {
    const sandbox = createSandbox({ blockStorage: true });
    runInSandbox(DEFENSIVE_STORAGE_IMPL, sandbox);

    runInSandbox(`Storage.set('temp', '123'); Storage.remove('temp');`, sandbox);
    const retrieved = runInSandbox(`Storage.get('temp');`, sandbox);
    assert.equal(retrieved, null, 'Purged key must return null');
  });

  test('F24-5: Storage.get returns null for non-existent keys in fallback mode', () => {
    const sandbox = createSandbox({ blockStorage: true });
    runInSandbox(DEFENSIVE_STORAGE_IMPL, sandbox);

    const missing = runInSandbox(`Storage.get('non_existent_key');`, sandbox);
    assert.equal(missing, null, 'Non-existent key should return null');
  });
});

autoRunCLI();
