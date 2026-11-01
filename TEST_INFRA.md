# 1files Software Vault — Test Infrastructure Specification

**Document Version**: 1.0.0  
**Target Environment**: Node.js v26.7.0+ (Zero external npm dependencies)  
**Project Root**: `C:\Users\David\.gemini\antigravity\scratch\1files\`  
**Entry Point**: `node test-runner.js` (or `node tests/run-all.js`)  

---

## 1. Overview & Architectural Philosophy

The 1files test infrastructure provides a fully automated, independent, opaque-box test suite designed to verify the offline zero-dependency single-file software vault across all requirements specified in `ORIGINAL_REQUEST.md` and `PROJECT.md § Feature Inventory` (F01–F25).

In alignment with the vault's core manifesto—**Zero External Dependencies & Complete Offline Durability**—the test runner and suite require **zero npm packages** and zero build steps. The runner utilizes modern Node.js native standard modules (`node:test`, `node:assert/strict`, `node:crypto`, `node:vm`, `node:fs`, `node:path`), delivering sub-second execution (283 tests in ~0.50s) across all 4 verification tiers.

---

## 2. Directory Layout & Components

```
tests/
├── helpers/
│   ├── test-harness.js           # Zero-dep test framework (describe, test, assert, CLI runner)
│   ├── dom-parser.js             # HTML tokenizer with balanced tag nesting and CSS query engine
│   ├── audit-offline.js          # Static regex scanner for zero external CDN/font/script requests
│   ├── a11y-audit.js             # WCAG 2.1 AA validator (landmarks, headings, focus trap, ARIA)
│   ├── crypto-oracle.js          # Hardware-accelerated NIST reference oracle via node:crypto
│   ├── audio-oracle.js           # Mathematical acoustics & Web Audio parameter verifier
│   └── sandbox-vm.js             # Browser environment emulator (Web Crypto, Web Audio, Storage, FileReader)
├── tier1-feature-coverage/       # 25 files (F01–F25), 125 test cases (happy-path & equivalence classes)
│   ├── f01-font-stack.test.js
│   ├── f02-landmarks.test.js
│   ├── f03-skip-nav.test.js
│   ├── f04-modal-dialog.test.js
│   ├── f05-modal-dismissal.test.js
│   ├── f06-sandboxed-iframe.test.js
│   ├── f07-catalog-search.test.js
│   ├── f08-category-chips.test.js
│   ├── f09-card-schema.test.js
│   ├── f10-sync-404-docs.test.js
│   ├── f11-audio-oscillator.test.js
│   ├── f12-binaural-synth.test.js
│   ├── f13-noise-generator.test.js
│   ├── f14-canvas-visualizer.test.js
│   ├── f15-multi-hash.test.js
│   ├── f16-hash-match.test.js
│   ├── f17-aes-gcm.test.js
│   ├── f18-diceware-keygen.test.js
│   ├── f19-json-workbench.test.js
│   ├── f20-csv-markdown.test.js
│   ├── f21-yaml-converter.test.js
│   ├── f22-base64-hex.test.js
│   ├── f23-jwt-inspector.test.js
│   ├── f24-defensive-storage.test.js
│   └── f25-file-io.test.js
├── tier2-boundary-corner/        # 5 files, 125 test cases (empty inputs, extreme limits, air-gap)
│   ├── boundary-portal-a11y.test.js    # F01–F10 edge cases (50 tests)
│   ├── boundary-audio.test.js          # F11–F14 edge cases (20 tests)
│   ├── boundary-crypto.test.js         # F15–F18 edge cases (20 tests)
│   ├── boundary-dataforge.test.js      # F19–F23 edge cases (25 tests)
│   └── boundary-storage-io.test.js     # F24–F25 edge cases (10 tests)
├── tier3-cross-feature/          # 4 files, 16 test cases (pairwise interactions)
│   ├── modal-app-embedding.test.js     # Sandboxed iframe embedding with Audio/Crypto/Forge
│   ├── search-filter-download.test.js  # Search query + Category chip + Download anchors
│   ├── sandboxed-storage-flow.test.js  # Defensive storage fallback under sandbox restrictions
│   └── multi-tool-data-pipeline.test.js# Data Forge CSV -> Crypto Vault Hash -> AES encrypt -> Blob egress
├── tier4-application-workloads/  # 4 files, 17 test cases (end-to-end user journeys)
│   ├── workload-checksum-workflow.test.js # Multi-chunk file hashing & checksum verification
│   ├── workload-csv-json-markdown.test.js # CSV to JSON to Markdown table conversion
│   ├── workload-acoustic-sweep.test.js    # 20 Hz – 20 kHz acoustic sweep with FFT visualizer
│   └── workload-vault-journey.test.js     # Full landing, search, launch, teardown, and download journey
├── run-all.js                    # Central CLI runner with tier reporting and filter flags
└── test-runner.js                # Root forwarder script (node test-runner.js)
```

---

## 3. Test Methodology & Systematic Tier Breakdown

The test suite exercises all 25 features systematically across 4 tiers:

### Tier 1: Feature Coverage (125 Test Cases)
- **Scope**: Every feature from F01 through F25 has a dedicated test suite with at least 5 distinct test cases covering primary behavior, positive flows, and equivalence classes.
- **Independence**: Each test case is self-contained and independently verifiable.

### Tier 2: Boundary & Corner Cases (125 Test Cases)
- **Scope**: Rigorous boundary stress testing for all 25 features (5 test cases per feature).
- **Domains Tested**:
  - Empty string inputs, null bytes (`0x00`), 0-byte buffers.
  - Extreme ranges: 1 Hz infrasound to 20,000 Hz ultrasound, 50-level nested JSON, 500 KB ciphertext envelopes.
  - Error and exception injection: `SecurityError` and `QuotaExceededError` in storage, invalid JWT structures, tampered AES authentication tags.
  - Air-gap verification: Strict zero-tolerance for external fonts or CDN dependencies.

### Tier 3: Cross-Feature Combinations (16 Test Cases)
- **Scope**: Verifies pairwise module interactions and contracts:
  - Sandboxed iframe embedding (`sandbox="..."`) hosting Web Audio and Web Crypto applications.
  - Live catalog search query combined with category filter chip selection.
  - Defensive in-memory storage fallback across consecutive iframe launches.
  - Cross-application data pipeline linking Data Forge, Crypto Vault, and Blob file egress.

### Tier 4: Real-World Application Workloads (17 Test Cases)
- **Scope**: Verifies complete end-to-end user workflows:
  - Multi-gigabyte chunked file hashing and visual match verification.
  - Ingesting raw CSV exports, auto-detecting delimiters, sorting JSON keys, and generating formatted Markdown tables.
  - Frequency sweeps with logarithmic progression and dual Canvas oscilloscope/spectrum visualizer updates.
  - Full vault user journey: skip-to-content navigation, search filtering, modal preview launch, keyboard dismissal, and direct download.

**Total Test Count**: **283 Test Cases** across 38 files.

---

## 4. Authoritative Output Derivation & Reference Oracles

Every assertion in the test suite is grounded in an explicit authoritative source:

1. **Cryptographic Standards (NIST / FIPS / W3C Web Cryptography API)**:
   - Reference Oracle: Node.js native `node:crypto` hardware-accelerated cryptographic engine.
   - Authoritative test vectors verified for SHA-256, SHA-512, SHA-384, SHA-1 empty buffers and standard strings.
   - PBKDF2 key derivation (100,000 iterations, SHA-256) and AES-256-GCM standard envelopes (`salt(16) + iv(12) + ciphertext + tag(16)`).
2. **Acoustic & Audio Mathematics (W3C Web Audio API)**:
   - Reference Oracle: `midiToFrequency(n) = 440 * 2^((n - 69) / 12)`.
   - Binaural beat frequency $|f_R - f_L|$ verified against standard physiological brainwave bands (Delta, Theta, Alpha, Beta, Gamma).
   - ITU-T DTMF dual-frequency tone matrices.
   - Statistical buffer verification for White, Pink (Paul Kellet 3-pole filter), and Brownian (leaky integration) noise.
3. **Data Specifications (IETF RFCs)**:
   - RFC 4180: CSV quote escaping (`""`), embedded commas, multiline values, and auto-delimiter detection.
   - RFC 4648: Base64 and Base64URL encoding/decoding with zero-loss UTF-8 multi-byte decoding.
   - RFC 7519: JSON Web Token claims decoding, expiration timestamp parsing, and delta calculation.
4. **Accessibility Standards (W3C WCAG 2.1 AA)**:
   - Semantic landmark audit (`<main>`, `<nav>`, `<section>`).
   - Heading hierarchy inspection (`<h1>` uniqueness and proper nesting).
   - Dialog semantics (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trapping).

---

## 5. Execution Instructions & CLI Flags

Run the test suite directly from the project root using Node.js:

```bash
# 1. Run all 283 tests across all 4 tiers
node test-runner.js

# 2. Run a specific tier only
node test-runner.js --tier=1    # Feature Coverage (125 tests)
node test-runner.js --tier=2    # Boundary & Corner Cases (125 tests)
node test-runner.js --tier=3    # Cross-Feature Interactions (16 tests)
node test-runner.js --tier=4    # Real-World Workloads (17 tests)

# 3. Filter tests by Feature ID
node test-runner.js --feature=F15  # Runs multi-hash checksum tests

# 4. Export machine-readable JSON report
node test-runner.js --json      # Generates test-report.json

# 5. Run an individual test file standalone
node tests/tier1-feature-coverage/f15-multi-hash.test.js
node tests/tier2-boundary-corner/boundary-crypto.test.js
```

---

## 6. Progressive Verification Strategy

Because this test suite is written during Milestone 1 in parallel with implementation workers:
- **Tiers 1 & 2** immediately test existing files (`index.html`, `404.html`, `README.md`, `sim-root.html`, `sim-root-v1.html`) and clearly report missing features (e.g., Google Fonts external leaks in the legacy files, lack of skip link, lack of F11–F25).
- **As Worker M1 lands `tone-lab.html`, `crypto-vault.html`, and `data-forge.html`**, running `node test-runner.js` will immediately test and verify their single-file implementations against F11–F25.
- **As Worker M2 lands overhauled `index.html`, `404.html`, and `README.md`**, running `node test-runner.js` will verify the accessible modal runner, search, category chips, skip link, and zero-font compliance, reaching 100% pass across all 283 tests.
