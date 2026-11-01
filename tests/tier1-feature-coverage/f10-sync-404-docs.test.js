/**
 * F10: Synchronize 404 & Docs
 * Verifies synchronization between index.html and 404.html, and documentation updates in README.md.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F10: Synchronize 404 & Docs', () => {
  test('F10-1: 404.html exists in project root for GitHub Pages fallback', () => {
    const filePath = path.join(PROJECT_ROOT, '404.html');
    assert.ok(fs.existsSync(filePath), '404.html must exist at repository root');
  });

  test('F10-2: 404.html matches index.html catalog structure and cards', () => {
    const indexPath = path.join(PROJECT_ROOT, 'index.html');
    const notFoundPath = path.join(PROJECT_ROOT, '404.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const notFoundContent = fs.readFileSync(notFoundPath, 'utf8');
    // They should either be byte-identical or functionally identical in terms of card count
    const indexCards = (indexContent.match(/class=["'][^"']*app-card[^"']*["']/g) || []).length;
    const notFoundCards = (notFoundContent.match(/class=["'][^"']*app-card[^"']*["']/g) || []).length;
    assert.equal(notFoundCards, indexCards, `404.html card count (${notFoundCards}) must match index.html (${indexCards})`);
  });

  test('F10-3: README.md exists and documents zero-dependency single-file philosophy', () => {
    const readmePath = path.join(PROJECT_ROOT, 'README.md');
    assert.ok(fs.existsSync(readmePath), 'README.md must exist');
    const content = fs.readFileSync(readmePath, 'utf8');
    assert.ok(/zero-dependency|single-file|offline/i.test(content),
      'README.md must document the zero-dependency single-file offline architecture');
  });

  test('F10-4: README.md catalogs the offline utility suite in software collection table', () => {
    const readmePath = path.join(PROJECT_ROOT, 'README.md');
    const content = fs.readFileSync(readmePath, 'utf8');
    assert.ok(/crypto-vault\.html|data-forge\.html|tone-lab\.html/i.test(content),
      'README.md must reference the new offline utility applications');
  });

  test('F10-5: README.md specifies air-gapped / offline operational instructions', () => {
    const readmePath = path.join(PROJECT_ROOT, 'README.md');
    const content = fs.readFileSync(readmePath, 'utf8');
    assert.ok(/offline|browser|download|air-gapped/i.test(content),
      'README.md must include instructions for offline browser execution');
  });
});

autoRunCLI();
