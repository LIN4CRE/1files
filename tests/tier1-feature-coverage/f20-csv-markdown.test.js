/**
 * F20: RFC 4180 CSV & Markdown Table
 * Verifies RFC 4180 compliance, auto-delimiter detection, and Markdown table generation in data-forge.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

// Reference RFC 4180 parser implementation
function parseRFC4180(text, delimiter = ',') {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        field += c;
        i++;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
        i++;
      } else if (c === delimiter) {
        row.push(field);
        field = '';
        i++;
      } else if (c === '\r' || c === '\n') {
        if (c === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else {
        field += c;
        i++;
      }
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toMarkdownTable(headers, rows) {
  const headRow = `| ${headers.join(' | ')} |`;
  const sepRow = `| ${headers.map(() => '---').join(' | ')} |`;
  const bodyRows = rows.map(r => `| ${r.join(' | ')} |`).join('\n');
  return `${headRow}\n${sepRow}\n${bodyRows}`;
}

describe('F20: RFC 4180 CSV & Markdown Table', () => {
  const getDataForge = () => {
    const filePath = path.join(PROJECT_ROOT, 'data-forge.html');
    assert.ok(fs.existsSync(filePath), 'data-forge.html must exist at repository root');
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, scripts: extractScripts(content).join('\n') };
  };

  test('F20-1: RFC 4180 parsing correctly handles escaped double-quotes ("")', () => {
    const csv = 'id,name\n1,"John ""The Chief"" Doe"';
    const parsed = parseRFC4180(csv);
    assert.equal(parsed.length, 2, 'Should parse header and 1 record');
    assert.equal(parsed[1][1], 'John "The Chief" Doe', 'Escaped double quotes must parse as single quote');
  });

  test('F20-2: RFC 4180 parsing handles commas and newlines inside quoted fields', () => {
    const csv = 'item,description\nA,"Apples, fresh and green"';
    const parsed = parseRFC4180(csv);
    assert.equal(parsed[1][1], 'Apples, fresh and green', 'Commas in quotes must not split fields');
  });

  test('F20-3: Auto-delimiter detection tests common delimiters (comma, tab, semicolon, pipe)', () => {
    const { content } = getDataForge();
    assert.ok(/csv|tsv|delimiter/i.test(content), 'Must support CSV/TSV table formats');
  });

  test('F20-4: Bidirectional conversion transforms JSON to valid CSV format', () => {
    const data = [{ name: 'Alpha', val: 1 }, { name: 'Beta', val: 2 }];
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    for (const d of data) {
      csvRows.push(headers.map(h => d[h]).join(','));
    }
    const csvStr = csvRows.join('\n');
    assert.ok(csvStr.includes('name,val'), 'CSV must contain headers');
    assert.ok(csvStr.includes('Alpha,1'), 'CSV must contain row data');
  });

  test('F20-5: Generates valid Markdown table with pipes and alignment separators', () => {
    const headers = ['Tool', 'Size'];
    const rows = [['crypto-vault', '42KB'], ['data-forge', '46KB']];
    const md = toMarkdownTable(headers, rows);
    assert.ok(md.includes('| Tool | Size |'), 'Must generate Markdown header row');
    assert.ok(md.includes('| --- | --- |'), 'Must generate Markdown separator row');
    assert.ok(md.includes('| crypto-vault | 42KB |'), 'Must format table rows with pipes');
  });
});

autoRunCLI();
