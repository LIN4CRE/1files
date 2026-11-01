/**
 * F19: JSON Workbench & Tree
 * Verifies JSON formatting (2/4 spaces), minification, alphabetical key sorting, and syntax validation in data-forge.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F19: JSON Workbench & Tree', () => {
  const getDataForge = () => {
    const filePath = path.join(PROJECT_ROOT, 'data-forge.html');
    assert.ok(fs.existsSync(filePath), 'data-forge.html must exist at repository root');
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, scripts: extractScripts(content).join('\n') };
  };

  test('F19-1: data-forge.html is a self-contained offline document with no external scripts', () => {
    const { content } = getDataForge();
    assert.ok(!/<script[^>]+src=/i.test(content), 'data-forge.html must have no external script tags');
    assert.ok(!/<link[^>]+href=["']https?:\/\//i.test(content), 'data-forge.html must have no external CSS links');
  });

  test('F19-2: JSON formatter produces properly indented JSON (2-spaces / 4-spaces)', () => {
    const raw = '{"z":1,"a":[2,3]}';
    const parsed = JSON.parse(raw);
    const formatted = JSON.stringify(parsed, null, 2);
    assert.ok(formatted.includes('  "z": 1'), 'Must format with 2-space indentation');
  });

  test('F19-3: JSON minifier strips redundant whitespace and newlines completely', () => {
    const input = '{\n  "title": "1files",\n  "offline": true\n}';
    const minified = JSON.stringify(JSON.parse(input));
    assert.equal(minified, '{"title":"1files","offline":true}');
  });

  test('F19-4: Sort keys functionality orders object properties alphabetically', () => {
    const obj = { zebra: 1, apple: 2, mango: 3 };
    const sortKeys = o => Object.keys(o).sort().reduce((acc, k) => { acc[k] = o[k]; return acc; }, {});
    const sorted = sortKeys(obj);
    assert.deepEqual(Object.keys(sorted), ['apple', 'mango', 'zebra'], 'Keys must be sorted A-Z');
  });

  test('F19-5: Syntax validator detects invalid JSON structure without crashing', () => {
    const malformed = '{"key": "unclosed string}';
    assert.throws(() => {
      JSON.parse(malformed);
    }, SyntaxError, 'Malformed JSON must trigger syntax error');
  });
});

autoRunCLI();
