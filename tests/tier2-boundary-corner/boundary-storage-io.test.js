/**
 * Tier 2 Boundary & Corner Cases: Defensive Storage & File I/O (F24–F25)
 * 10 test cases covering storage quota exceptions, in-memory recovery, 0-byte files, and Blob egress.
 */

const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { createSandbox, runInSandbox } = require('../helpers/sandbox-vm');

describe('Tier 2: Defensive Storage & File I/O Boundaries (F24–F25)', () => {
  const DEFENSIVE_STORAGE_IMPL = `
    const Storage = {
      _mem: {},
      get(k) { try { return localStorage.getItem(k); } catch(e) { return this._mem[k] ?? null; } },
      set(k, v) { try { localStorage.setItem(k, v); } catch(e) { this._mem[k] = String(v); } },
      remove(k) { try { localStorage.removeItem(k); } catch(e) { delete this._mem[k]; } }
    };
  `;

  // --- F24 Boundaries (5 tests) ---
  test('T2-F24-1: Handles QuotaExceededError by safely falling back to in-memory store', () => {
    const sandbox = createSandbox({ blockStorage: false });
    // Simulate QuotaExceededError
    sandbox.localStorage.setItem = () => {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    };
    sandbox.localStorage.getItem = () => {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    };
    runInSandbox(DEFENSIVE_STORAGE_IMPL, sandbox);

    assert.doesNotThrow(() => {
      runInSandbox(`Storage.set('largeKey', 'val');`, sandbox);
    });
    const retrieved = runInSandbox(`Storage.get('largeKey');`, sandbox);
    assert.equal(retrieved, 'val');
  });

  test('T2-F24-2: Handles empty string key gracefully', () => {
    const sandbox = createSandbox({ blockStorage: true });
    runInSandbox(DEFENSIVE_STORAGE_IMPL, sandbox);

    runInSandbox(`Storage.set('', 'empty_key_val');`, sandbox);
    const val = runInSandbox(`Storage.get('');`, sandbox);
    assert.equal(val, 'empty_key_val');
  });

  test('T2-F24-3: Removes non-existent key without error in in-memory fallback', () => {
    const sandbox = createSandbox({ blockStorage: true });
    runInSandbox(DEFENSIVE_STORAGE_IMPL, sandbox);

    assert.doesNotThrow(() => {
      runInSandbox(`Storage.remove('never_set');`, sandbox);
    });
  });

  test('T2-F24-4: Converts non-string values (numbers, booleans, objects) to strings', () => {
    const sandbox = createSandbox({ blockStorage: true });
    runInSandbox(DEFENSIVE_STORAGE_IMPL, sandbox);

    runInSandbox(`Storage.set('num', 123); Storage.set('bool', false);`, sandbox);
    assert.equal(runInSandbox(`Storage.get('num');`, sandbox), '123');
    assert.equal(runInSandbox(`Storage.get('bool');`, sandbox), 'false');
  });

  test('T2-F24-5: Multiple consecutive writes overwrite previous value', () => {
    const sandbox = createSandbox({ blockStorage: true });
    runInSandbox(DEFENSIVE_STORAGE_IMPL, sandbox);

    runInSandbox(`Storage.set('state', 'v1'); Storage.set('state', 'v2');`, sandbox);
    assert.equal(runInSandbox(`Storage.get('state');`, sandbox), 'v2');
  });

  // --- F25 Boundaries (5 tests) ---
  test('T2-F25-1: FileReader reads empty 0-byte file resulting in empty string', async () => {
    const sandbox = createSandbox();
    const result = await new Promise((resolve) => {
      sandbox.done = resolve;
      runInSandbox(`
        const reader = new FileReader();
        reader.onload = e => done(e.target.result);
        reader.readAsText('');
      `, sandbox);
    });
    assert.equal(result, '');
  });

  test('T2-F25-2: Blob handles empty array argument ([]), reporting size 0', () => {
    const sandbox = createSandbox();
    const size = runInSandbox(`new Blob([]).size;`, sandbox);
    assert.equal(size, 0);
  });

  test('T2-F25-3: Blob with custom MIME type retains type property', () => {
    const sandbox = createSandbox();
    const type = runInSandbox(`new Blob(['test'], { type: 'text/markdown;charset=utf-8' }).type;`, sandbox);
    assert.ok(type.includes('text/markdown'));
  });

  test('T2-F25-4: URL.revokeObjectURL executes without throwing to release memory', () => {
    const sandbox = createSandbox();
    assert.doesNotThrow(() => {
      runInSandbox(`
        const url = URL.createObjectURL(new Blob(['a']));
        URL.revokeObjectURL(url);
      `, sandbox);
    });
  });

  test('T2-F25-5: Download filename sanitizes dangerous path characters (/, \\, :)', () => {
    const sanitizeFilename = name => name.replace(/[/\\?%*:|"<>]/g, '_');
    const safeName = sanitizeFilename('export/2026:01.json');
    assert.equal(safeName, 'export_2026_01.json');
  });
});

autoRunCLI();
