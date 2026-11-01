/**
 * Automated E2E Test Suite Runner for 1files Software Vault.
 * Discovers and executes all test suites across Tiers 1-4 with detailed diagnostics.
 *
 * Usage:
 *   node tests/run-all.js             # Run all tiers
 *   node tests/run-all.js --tier=1    # Run only Tier 1
 *   node tests/run-all.js --tier=2    # Run only Tier 2
 *   node tests/run-all.js --tier=3    # Run only Tier 3
 *   node tests/run-all.js --tier=4    # Run only Tier 4
 *   node tests/run-all.js --feature=F15
 */

const fs = require('node:fs');
const path = require('node:path');
const { globalResults, runAllSuites } = require('./helpers/test-harness');

const TESTS_ROOT = __dirname;
const PROJECT_ROOT = path.resolve(__dirname, '../');

const TIERS = [
  { id: 1, name: 'Tier 1: Feature Coverage (F01–F25)', dir: 'tier1-feature-coverage' },
  { id: 2, name: 'Tier 2: Boundary & Corner Cases', dir: 'tier2-boundary-corner' },
  { id: 3, name: 'Tier 3: Cross-Feature Combinations', dir: 'tier3-cross-feature' },
  { id: 4, name: 'Tier 4: Real-World Application Workloads', dir: 'tier4-application-workloads' }
];

// Parse CLI arguments
const args = process.argv.slice(2);
let tierFilter = null;
let featureFilter = null;
let jsonOutput = false;

for (const arg of args) {
  if (arg.startsWith('--tier=')) tierFilter = parseInt(arg.split('=')[1], 10);
  if (arg.startsWith('--feature=')) featureFilter = arg.split('=')[1].toUpperCase();
  if (arg === '--json') jsonOutput = true;
}

// Discover test files
function findTestFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isFile() && entry.name.endsWith('.test.js')) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

async function main() {
  const startTime = Date.now();
  console.log('='.repeat(80));
  console.log('  1FILES SOFTWARE VAULT — AUTOMATED E2E TEST RUNNER');
  console.log(`  Execution Mode: Node.js ${process.version} | Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  const tierStats = {};

  for (const tier of TIERS) {
    if (tierFilter && tierFilter !== tier.id) continue;

    const tierDir = path.join(TESTS_ROOT, tier.dir);
    const testFiles = findTestFiles(tierDir);

    tierStats[tier.id] = {
      name: tier.name,
      fileCount: testFiles.length,
      tests: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };

    console.log(`\n▶ [Tier ${tier.id}] ${tier.name} (${testFiles.length} files)`);

    for (const file of testFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);

      // Filter by feature if requested
      if (featureFilter && !file.toUpperCase().includes(featureFilter)) {
        continue;
      }

      // Snapshot suites before loading file
      const beforeIndex = globalResults.suites.length;

      try {
        // Require test file (which registers suites into globalResults)
        require(file);
      } catch (loadErr) {
        console.error(`  ✗ Failed to load test file: ${relPath}`);
        console.error(`    ${loadErr.message}`);
        tierStats[tier.id].failed++;
        continue;
      }

      // Execute newly registered suites
      for (let sIdx = beforeIndex; sIdx < globalResults.suites.length; sIdx++) {
        const suite = globalResults.suites[sIdx];
        await suite.run();

        const suitePassed = suite.tests.filter(t => t.status === 'passed').length;
        const suiteFailed = suite.tests.filter(t => t.status === 'failed').length;
        const suiteSkipped = suite.tests.filter(t => t.status === 'skipped').length;

        tierStats[tier.id].tests += suite.tests.length;
        tierStats[tier.id].passed += suitePassed;
        tierStats[tier.id].failed += suiteFailed;
        tierStats[tier.id].skipped += suiteSkipped;

        const icon = suiteFailed === 0 ? '✓' : '✗';
        console.log(`  ${icon} ${suite.name} (${suitePassed}/${suite.tests.length} passed)`);

        if (suiteFailed > 0) {
          for (const t of suite.tests) {
            if (t.status === 'failed') {
              console.log(`    ✗ ${t.name}`);
              console.log(`      Error: ${t.error ? t.error.message : 'Unknown error'}`);
            }
          }
        }
      }
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  // Overall Statistics
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const tid of Object.keys(tierStats)) {
    const s = tierStats[tid];
    totalTests += s.tests;
    totalPassed += s.passed;
    totalFailed += s.failed;
    totalSkipped += s.skipped;
  }

  console.log('\n' + '='.repeat(80));
  console.log('  TEST SUITE EXECUTION SUMMARY');
  console.log('='.repeat(80));

  for (const tid of Object.keys(tierStats)) {
    const s = tierStats[tid];
    const pct = s.tests > 0 ? ((s.passed / s.tests) * 100).toFixed(1) : '0.0';
    console.log(`  Tier ${tid}: ${s.name}`);
    console.log(`    Files: ${s.fileCount} | Tests: ${s.tests} | Passed: ${s.passed} | Failed: ${s.failed} | Pass Rate: ${pct}%`);
  }

  console.log('-'.repeat(80));
  const overallPct = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
  console.log(`  TOTAL: ${totalTests} Tests across ${Object.values(tierStats).reduce((a, b) => a + b.fileCount, 0)} Files`);
  console.log(`  PASSED: ${totalPassed} | FAILED: ${totalFailed} | SKIPPED: ${totalSkipped} | RATE: ${overallPct}%`);
  console.log(`  DURATION: ${durationSec}s`);
  console.log('='.repeat(80));

  if (jsonOutput) {
    const jsonPath = path.join(PROJECT_ROOT, 'test-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify({ tierStats, totalTests, totalPassed, totalFailed, durationSec }, null, 2));
    console.log(`\nReport written to ${jsonPath}`);
  }

  // Return exit code
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
