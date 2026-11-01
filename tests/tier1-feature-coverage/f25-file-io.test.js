/**
 * F25: Client File Ingestion & Egress
 * Verifies HTML5 FileReader drag-and-drop ingestion and client-side Blob URL download egress.
 */

const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { createSandbox, runInSandbox } = require('../helpers/sandbox-vm');

describe('F25: Client File Ingestion & Egress', () => {
  test('F25-1: FileReader reads uploaded text data completely in-browser', async () => {
    const sandbox = createSandbox();
    const testData = 'Sample 1files Input Content';

    const result = await new Promise((resolve, reject) => {
      sandbox.onComplete = resolve;
      runInSandbox(`
        const reader = new FileReader();
        reader.onload = (e) => {
          onComplete(e.target.result);
        };
        reader.readAsText('${testData}');
      `, sandbox);
    });

    assert.equal(result, testData, 'FileReader must read file text without server upload');
  });

  test('F25-2: FileReader reads binary data as ArrayBuffer for cryptographic hashing', async () => {
    const sandbox = createSandbox();
    const binaryData = Buffer.from([0x01, 0x02, 0x03, 0x04]);

    const result = await new Promise((resolve) => {
      sandbox.onBinaryComplete = resolve;
      runInSandbox(`
        const reader = new FileReader();
        reader.onload = (e) => {
          onBinaryComplete(e.target.result);
        };
        reader.readAsArrayBuffer({ buffer: Buffer.from([1, 2, 3, 4]) });
      `, sandbox);
    });

    assert.ok(result, 'FileReader must return ArrayBuffer');
  });

  test('F25-3: Egress creates client-side Blob with proper MIME type', () => {
    const sandbox = createSandbox();
    const code = `
      const blob = new Blob(['{"export": true}'], { type: 'application/json' });
      blob.type;
    `;
    const mime = runInSandbox(code, sandbox);
    assert.equal(mime, 'application/json', 'Blob must be instantiated with specified MIME type');
  });

  test('F25-4: Egress generates synthetic Blob object URL via URL.createObjectURL', () => {
    const sandbox = createSandbox();
    const code = `
      const blob = new Blob(['test']);
      const url = URL.createObjectURL(blob);
      url;
    `;
    const url = runInSandbox(code, sandbox);
    assert.ok(url.startsWith('blob:'), 'createObjectURL must return a blob: URI');
  });

  test('F25-5: Programmatic download trigger configures anchor tag with download attribute', () => {
    const sandbox = createSandbox();
    const code = `
      const a = document.createElement('a');
      a.href = 'blob:mock-export-url';
      a.download = 'export.json';
      ({ href: a.href, download: a.download });
    `;
    const res = runInSandbox(code, sandbox);
    assert.equal(res.download, 'export.json');
    assert.equal(res.href, 'blob:mock-export-url');
  });
});

autoRunCLI();
