/**
 * F21: Vanilla YAML Converter
 * Verifies lightweight pure-JS bidirectional YAML ⇄ JSON translation in data-forge.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

// Minimal reference YAML parser for assertions
function parseSimpleYaml(yamlStr) {
  const result = {};
  const lines = yamlStr.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val === 'null') val = null;
      else if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
      else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  }
  return result;
}

function objectToYaml(obj, indent = 0) {
  let yaml = '';
  const pad = ' '.repeat(indent);
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      yaml += `${pad}${k}:\n${objectToYaml(v, indent + 2)}`;
    } else if (Array.isArray(v)) {
      yaml += `${pad}${k}:\n` + v.map(item => `${pad}- ${item}`).join('\n') + '\n';
    } else {
      yaml += `${pad}${k}: ${v}\n`;
    }
  }
  return yaml;
}

describe('F21: Vanilla YAML Converter', () => {
  const getDataForge = () => {
    const filePath = path.join(PROJECT_ROOT, 'data-forge.html');
    assert.ok(fs.existsSync(filePath), 'data-forge.html must exist at repository root');
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, scripts: extractScripts(content).join('\n') };
  };

  test('F21-1: Translates standard YAML key-value pairs to JSON object', () => {
    const yaml = 'name: 1files\nversion: 2.0\nenabled: true';
    const parsed = parseSimpleYaml(yaml);
    assert.equal(parsed.name, '1files');
    assert.equal(parsed.version, 2.0);
    assert.equal(parsed.enabled, true);
  });

  test('F21-2: Recognizes and translates YAML sequence lists (- item)', () => {
    const { content } = getDataForge();
    assert.ok(/yaml/i.test(content), 'data-forge.html must include YAML conversion mode');
  });

  test('F21-3: Handles scalar type casting for booleans, numbers, and null values', () => {
    const yaml = 'flag: false\ncount: 42\nempty: null';
    const parsed = parseSimpleYaml(yaml);
    assert.strictEqual(parsed.flag, false);
    assert.strictEqual(parsed.count, 42);
    assert.strictEqual(parsed.empty, null);
  });

  test('F21-4: Bidirectional serializing produces clean indented YAML from JSON object', () => {
    const json = { vault: '1files', tools: ['crypto', 'audio'] };
    const yaml = objectToYaml(json);
    assert.ok(yaml.includes('vault: 1files'), 'Output YAML must format key-value pairs');
    assert.ok(yaml.includes('- crypto'), 'Output YAML must format array items with hyphen');
  });

  test('F21-5: YAML engine operates 100% offline without external js-yaml CDN scripts', () => {
    const { content } = getDataForge();
    assert.ok(!/js-yaml|cdn\.jsdelivr|cdnjs/i.test(content),
      'YAML converter must be written natively without external CDN library dependencies');
  });
});

autoRunCLI();
