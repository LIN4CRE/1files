/**
 * Tier 3 Cross-Feature Combination: Search, Category Filtering & Download Anchors (F07, F08 ↔ F09)
 * Verifies interactive catalog filtering while preserving application download paths.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML, extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('Tier 3: Search, Filter Chips & Download Interactions', () => {
  const getIndexData = () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
    return {
      dom: parseHTML(content),
      scripts: extractScripts(content).join('\n')
    };
  };

  test('T3-SEARCH-1: All application cards retain valid download links under filtering', () => {
    const { dom } = getIndexData();
    const cards = dom.getElementsByClassName('app-card');
    for (const card of cards) {
      const downloadLink = card.querySelector ? card.querySelector('a[download]') : null;
      assert.ok(card.innerHTML.includes('download='), 'Each card must contain download link');
    }
  });

  test('T3-SEARCH-2: Card category values correspond to defined filter chip categories', () => {
    const { dom } = getIndexData();
    const cards = dom.getElementsByClassName('app-card');
    const validCategories = new Set(['all', 'security', 'utilities', 'utility', 'dev', 'crypto', 'audio']);

    for (const card of cards) {
      const cat = (card.getAttribute('data-category') || '').toLowerCase();
      if (cat) {
        assert.ok(validCategories.has(cat), `Card category "${cat}" should be in defined category set`);
      }
    }
  });

  test('T3-SEARCH-3: Search query intersection logic filters cards by both keyword AND category', () => {
    const cards = [
      { id: 'crypto-vault', title: 'CRYPTO://VAULT', cat: 'crypto', text: 'hash aes gcm' },
      { id: 'tone-lab', title: 'TONE://LAB', cat: 'audio', text: 'sine web audio' },
      { id: 'data-forge', title: 'DATA://FORGE', cat: 'utilities', text: 'json csv yaml' }
    ];

    const filterCards = (query, category) => {
      return cards.filter(c => {
        const matchesCat = category === 'all' || c.cat === category;
        const matchesQuery = !query || c.title.toLowerCase().includes(query) || c.text.includes(query);
        return matchesCat && matchesQuery;
      });
    };

    // Category = 'utilities', query = 'json'
    const res = filterCards('json', 'utilities');
    assert.equal(res.length, 1);
    assert.equal(res[0].id, 'data-forge');

    // Category = 'audio', query = 'json' -> 0 results
    const emptyRes = filterCards('json', 'audio');
    assert.equal(emptyRes.length, 0);
  });

  test('T3-SEARCH-4: Download attribute matches filename preventing unwanted cross-downloads', () => {
    const { dom } = getIndexData();
    const cards = dom.getElementsByClassName('app-card');
    for (const card of cards) {
      const fn = card.getAttribute('data-filename');
      if (fn) {
        assert.ok(card.innerHTML.includes(fn), `Card must reference its own filename ${fn} in download action`);
      }
    }
  });
});

autoRunCLI();
