/**
 * Zero-dependency Offline & CDN Audit Scanner for 1files Software Vault.
 * Strictly verifies zero external network requests across all HTML/CSS/JS code.
 */

const fs = require('node:fs');
const path = require('node:path');

// Patterns representing external network requests that violate zero-dependency offline integrity
const EXTERNAL_PATTERNS = [
  {
    name: 'External Google Fonts link',
    regex: /<link[^>]+href=["']https?:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^"']*["']/i
  },
  {
    name: 'External CDN stylesheet',
    regex: /<link[^>]+rel=["']stylesheet["'][^>]+href=["'](?:https?:|\/\/)[^"']+["']/i
  },
  {
    name: 'External script source',
    regex: /<script[^>]+src=["'](?:https?:|\/\/)[^"']+["']/i
  },
  {
    name: 'External CSS @import',
    regex: /@import\s+(?:url\(['"]?|['"])(?:https?:|\/\/)/i
  },
  {
    name: 'External image resource',
    regex: /<img[^>]+src=["'](?:https?:|\/\/)[^"']+["']/i
  },
  {
    name: 'External font face url',
    regex: /@font-face\s*\{[^}]*url\(['"]?(?:https?:|\/\/)[^)]+['"]?\)/i
  },
  {
    name: 'External fetch/XHR network call',
    regex: /(?:fetch|XMLHttpRequest)\s*\(\s*["'](?:https?:|\/\/)(?!localhost|127\.0\.0\.1)/i
  }
];

/**
 * Audits a single file content or file path for external network leaks.
 * Returns { passed: boolean, violations: Array<{ rule: string, match: string, line: number }> }
 */
function auditFileContent(content, filename = 'inline') {
  const violations = [];
  const lines = content.split(/\r?\n/);

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    for (const pattern of EXTERNAL_PATTERNS) {
      if (pattern.regex.test(line)) {
        violations.push({
          file: filename,
          rule: pattern.name,
          line: lineIdx + 1,
          snippet: line.trim()
        });
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations
  };
}

/**
 * Audits a file on disk.
 */
function auditFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      passed: false,
      violations: [{ file: filePath, rule: 'File existence', line: 0, snippet: 'File does not exist' }]
    };
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return auditFileContent(content, path.basename(filePath));
}

module.exports = {
  auditFileContent,
  auditFile,
  EXTERNAL_PATTERNS
};
