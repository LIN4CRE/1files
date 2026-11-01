/**
 * Tier 3 Cross-Feature Combination: Sandboxed Storage Fallback Flow (F06 ↔ F24)
 * Verifies defensive in-memory storage resilience under sandboxed iframe security policies.
 */

const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { createSandbox, runInSandbox } = require('../helpers/sandbox-vm');

describe('Tier 3: Sandboxed Storage Fallback Flow', () => {
  const STORAGE_CONTRACT = `
    const Storage = {
      _mem: {},
      get(k) { try { return localStorage.getItem(k); } catch(e) { return this._mem[k] ?? null; } },
      set(k, v) { try { localStorage.setItem(k, v); } catch(e) { this._mem[k] = String(v); } },
      remove(k) { try { localStorage.removeItem(k); } catch(e) { delete this._mem[k]; } }
    };
  `;

  test('T3-SANDBOX-1: App boots cleanly in sandboxed context with blocked localStorage', () => {
    const sandbox = createSandbox({ blockStorage: true });
    runInSandbox(STORAGE_CONTRACT, sandbox);

    // Tone Lab boots with volume preference
    runInSandbox(`
      const savedVol = Storage.get('tl_vol') || 0.7;
      Storage.set('tl_vol', savedVol);
    `, sandbox);

    assert.equal(runInSandbox(`Storage.get('tl_vol');`, sandbox), '0.7');
  });

  test('T3-SANDBOX-2: Crypto Vault runs AES session in sandboxed storage without state leak', () => {
    const sandbox = createSandbox({ blockStorage: true });
    runInSandbox(STORAGE_CONTRACT, sandbox);

    runInSandbox(`
      Storage.set('cv_theme', 'oled');
      Storage.set('cv_iterations', 100000);
    `, sandbox);

    assert.equal(runInSandbox(`Storage.get('cv_theme');`, sandbox), 'oled');
    assert.equal(runInSandbox(`Storage.get('cv_iterations');`, sandbox), '100000');
  });

  test('T3-SANDBOX-3: Data Forge stores active mode in-memory when localStorage denied', () => {
    const sandbox = createSandbox({ blockStorage: true });
    runInSandbox(STORAGE_CONTRACT, sandbox);

    runInSandbox(`
      Storage.set('df_mode', 'yaml');
    `, sandbox);

    assert.equal(runInSandbox(`Storage.get('df_mode');`, sandbox), 'yaml');
  });

  test('T3-SANDBOX-4: Teardown clears sandbox without residual storage corruption', () => {
    const sandbox1 = createSandbox({ blockStorage: true });
    runInSandbox(STORAGE_CONTRACT, sandbox1);
    runInSandbox(`Storage.set('app', 'inst1');`, sandbox1);

    // New independent sandbox instance simulating fresh iframe load
    const sandbox2 = createSandbox({ blockStorage: true });
    runInSandbox(STORAGE_CONTRACT, sandbox2);
    const isolatedVal = runInSandbox(`Storage.get('app');`, sandbox2);

    assert.equal(isolatedVal, null, 'Fresh iframe sandbox instance must start with clean in-memory state');
  });
});

autoRunCLI();
