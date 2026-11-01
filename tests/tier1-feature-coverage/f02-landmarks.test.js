/**
 * F02: Semantic Landmarks & Headings
 * Verifies presence of <main>, <nav>, <section>, and WCAG compliant heading hierarchies in index.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F02: Semantic Landmarks & Headings', () => {
  const getIndexDOM = () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
    return parseHTML(content);
  };

  test('F02-1: index.html contains a semantic <main> landmark element', () => {
    const dom = getIndexDOM();
    const mains = dom.getElementsByTagName('main');
    const mainRole = dom.querySelectorAll('[role="main"]');
    assert.ok(mains.length > 0 || mainRole.length > 0, 'index.html must include <main> landmark');
  });

  test('F02-2: index.html contains a semantic <nav> navigation landmark element', () => {
    const dom = getIndexDOM();
    const navs = dom.getElementsByTagName('nav');
    const navRole = dom.querySelectorAll('[role="navigation"]');
    assert.ok(navs.length > 0 || navRole.length > 0, 'index.html must include <nav> landmark');
  });

  test('F02-3: index.html utilizes <section> semantic sections for structural partitioning', () => {
    const dom = getIndexDOM();
    const sections = dom.getElementsByTagName('section');
    assert.ok(sections.length >= 1, 'index.html must use <section> elements for content grouping');
  });

  test('F02-4: index.html has exactly one top-level <h1> heading', () => {
    const dom = getIndexDOM();
    const h1s = dom.getElementsByTagName('h1');
    assert.equal(h1s.length, 1, `index.html must contain exactly one <h1> heading (found ${h1s.length})`);
    assert.ok(h1s[0].textContent.length > 0, '<h1> heading must contain text');
  });

  test('F02-5: index.html contains structured <h2> subheadings for vault catalog sections', () => {
    const dom = getIndexDOM();
    const h2s = dom.getElementsByTagName('h2');
    assert.ok(h2s.length >= 1, 'index.html must contain <h2> headings for major sections');
  });
});

autoRunCLI();
