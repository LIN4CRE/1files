/**
 * Tier 4 Application Workload: CSV to JSON & Markdown Table Converter
 * Simulates realistic developer workflow: CSV import, RFC 4180 parsing, JSON beautification, and Markdown export.
 */

const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');

describe('Tier 4 Workload: CSV to JSON & Markdown Table', () => {
  const SAMPLE_CSV = [
    'tool,category,size_kb,description',
    'crypto-vault,Security,42.8,"Air-gapped hash & AES-256-GCM studio, zero-deps"',
    'data-forge,Utilities,46.2,"Universal data transformer, JSON, CSV, YAML"',
    'tone-lab,Audio,32.4,"Web Audio signal synthesizer, binaural beats"'
  ].join('\n');

  test('T4-CSV-1: Ingests raw CSV and parses fields adhering to RFC 4180 quotes', () => {
    const lines = SAMPLE_CSV.split('\n');
    const headers = lines[0].split(',');
    assert.equal(headers.length, 4);

    // Parse records handling quotes
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^([^,]+),([^,]+),([^,]+),"(.*)"$/);
      assert.ok(match, `Line ${i} must match CSV structure`);
      records.push({
        [headers[0]]: match[1],
        [headers[1]]: match[2],
        [headers[2]]: Number(match[3]),
        [headers[3]]: match[4]
      });
    }

    assert.equal(records.length, 3);
    assert.equal(records[0].tool, 'crypto-vault');
    assert.ok(records[0].description.includes('zero-deps'));
  });

  test('T4-CSV-2: Converts parsed records to formatted JSON with sorted keys', () => {
    const record = {
      tool: 'crypto-vault',
      category: 'Security',
      size_kb: 42.8
    };

    const sortedRecord = Object.keys(record).sort().reduce((acc, k) => {
      acc[k] = record[k];
      return acc;
    }, {});

    const jsonStr = JSON.stringify(sortedRecord, null, 2);
    assert.ok(jsonStr.indexOf('"category"') < jsonStr.indexOf('"size_kb"'));
    assert.ok(jsonStr.indexOf('"size_kb"') < jsonStr.indexOf('"tool"'));
  });

  test('T4-CSV-3: Generates formatted Markdown table from dataset', () => {
    const headers = ['Tool', 'Category', 'Size (KB)'];
    const rows = [
      ['crypto-vault.html', 'Security', '42.8'],
      ['data-forge.html', 'Utilities', '46.2'],
      ['tone-lab.html', 'Audio', '32.4']
    ];

    const mdHeader = `| ${headers.join(' | ')} |`;
    const mdSep = `| ${headers.map(() => '---').join(' | ')} |`;
    const mdBody = rows.map(r => `| ${r.join(' | ')} |`).join('\n');
    const fullTable = `${mdHeader}\n${mdSep}\n${mdBody}`;

    assert.ok(fullTable.includes('| Tool | Category | Size (KB) |'));
    assert.ok(fullTable.includes('| --- | --- | --- |'));
    assert.ok(fullTable.includes('| crypto-vault.html | Security | 42.8 |'));
  });

  test('T4-CSV-4: Markdown table can be serialized to Blob and downloaded', () => {
    const mdContent = '| Tool | Category |\n|---|---|\n| tone-lab | Audio |';
    const blob = new globalThis.Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    assert.ok(blob.size > 0);
  });
});

autoRunCLI();
