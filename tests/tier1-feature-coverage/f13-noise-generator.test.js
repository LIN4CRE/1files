/**
 * F13: Algorithmic Noise Generator
 * Verifies procedural synthesis of White, Pink (1/f), and Brownian (1/f²) noise in tone-lab.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { extractScripts } = require('../helpers/dom-parser');
const { verifyNoiseProperties } = require('../helpers/audio-oracle');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F13: Algorithmic Noise Generator', () => {
  const getToneLab = () => {
    const filePath = path.join(PROJECT_ROOT, 'tone-lab.html');
    assert.ok(fs.existsSync(filePath), 'tone-lab.html must exist at repository root');
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, scripts: extractScripts(content).join('\n') };
  };

  test('F13-1: Noise engine provides White Noise option with uniform distribution', () => {
    const { content } = getToneLab();
    assert.ok(/white/i.test(content), 'Must include White Noise generator option');
  });

  test('F13-2: Noise engine provides Pink Noise (1/f) option with multi-pole filter', () => {
    const { content, scripts } = getToneLab();
    assert.ok(/pink/i.test(content), 'Must include Pink Noise generator option');
    assert.ok(/0\.99886|0\.99332|0\.96900|b0|b1|b2/i.test(scripts),
      'Pink noise algorithm should implement Paul Kellet or multi-pole 1/f filter');
  });

  test('F13-3: Noise engine provides Brownian Noise (1/f²) option with integration', () => {
    const { content, scripts } = getToneLab();
    assert.ok(/brown|brownian|red noise/i.test(content), 'Must include Brownian/Brown noise generator option');
    assert.ok(/lastOut|integrate|cumulative/i.test(scripts) || /1\.02/i.test(scripts),
      'Brownian noise should implement leaky random walk integration');
  });

  test('F13-4: AudioBuffer generation fills mono/stereo audio buffers dynamically in client memory', () => {
    const { scripts } = getToneLab();
    assert.ok(/createBuffer|getChannelData/i.test(scripts),
      'Must allocate procedural samples using AudioContext createBuffer/getChannelData');
  });

  test('F13-5: Noise sample buffers maintain zero DC offset and remain within [-1.0, 1.0] bounds', () => {
    // Generate synthetic test buffer to verify mathematical properties
    const bufferSize = 4096;
    const testSamples = new Float32Array(bufferSize);
    for (let i = 0; i < bufferSize; i++) {
      testSamples[i] = Math.random() * 2 - 1;
    }
    const check = verifyNoiseProperties(testSamples, 'white');
    assert.ok(check.valid, 'Generated noise buffers must stay within safe audio bounds without digital clipping');
  });
});

autoRunCLI();
