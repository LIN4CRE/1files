/**
 * Lightweight Zero-Dependency Test Harness for 1files E2E Suite.
 * Supports standalone file execution as well as centralized batch aggregation.
 */

const assert = require('node:assert/strict');

let activeSuite = null;
const globalResults = {
  suites: [],
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
  }

  addTest(name, fn, meta = {}) {
    this.tests.push({ name, fn, meta, status: 'pending', error: null, duration: 0 });
  }

  async run() {
    for (const t of this.tests) {
      const start = Date.now();
      try {
        if (t.meta.skip) {
          t.status = 'skipped';
        } else {
          await t.fn();
          t.status = 'passed';
        }
      } catch (err) {
        t.status = 'failed';
        t.error = err;
      }
      t.duration = Date.now() - start;
    }
  }
}

function describe(suiteName, fn) {
  const suite = new TestSuite(suiteName);
  const prevSuite = activeSuite;
  activeSuite = suite;
  globalResults.suites.push(suite);
  fn();
  activeSuite = prevSuite;
  return suite;
}

function test(testName, fn, meta = {}) {
  if (!activeSuite) {
    describe('Default Suite', () => {});
  }
  activeSuite.addTest(testName, fn, meta);
}

const it = test;

/**
 * Runs all registered suites and returns detailed report.
 */
async function runAllSuites() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    suites: []
  };

  for (const suite of globalResults.suites) {
    await suite.run();
    const suiteRes = {
      name: suite.name,
      tests: suite.tests.map(t => ({
        name: t.name,
        status: t.status,
        duration: t.duration,
        meta: t.meta,
        error: t.error ? { message: t.error.message, stack: t.error.stack } : null
      }))
    };
    results.suites.push(suiteRes);

    for (const t of suite.tests) {
      results.total++;
      if (t.status === 'passed') results.passed++;
      else if (t.status === 'failed') results.failed++;
      else if (t.status === 'skipped') results.skipped++;
    }
  }

  return results;
}

/**
 * Auto-run if executed directly via node CLI
 */
function autoRunCLI() {
  setImmediate(async () => {
    // Only auto-run if this is the main module being executed
    if (require.main && require.main.children.includes(module)) {
      const res = await runAllSuites();
      console.log(`\n=== Test Results: ${res.passed}/${res.total} Passed (${res.failed} Failed) ===\n`);
      for (const suite of res.suites) {
        console.log(`Suite: ${suite.name}`);
        for (const t of suite.tests) {
          const mark = t.status === 'passed' ? '✓' : t.status === 'skipped' ? '○' : '✗';
          console.log(`  ${mark} ${t.name} (${t.duration}ms)`);
          if (t.error) {
            console.error(`     Error: ${t.error.message}`);
          }
        }
      }
      process.exit(res.failed > 0 ? 1 : 0);
    }
  });
}

module.exports = {
  describe,
  test,
  it,
  assert,
  runAllSuites,
  globalResults,
  autoRunCLI
};
