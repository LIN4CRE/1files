/**
 * F14: Real-time Canvas Visualizer
 * Verifies real-time Oscilloscope (time-domain) and FFT Spectrum Analyzer (frequency-domain) in tone-lab.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML, extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F14: Real-time Canvas Visualizer', () => {
  const getToneLab = () => {
    const filePath = path.join(PROJECT_ROOT, 'tone-lab.html');
    assert.ok(fs.existsSync(filePath), 'tone-lab.html must exist at repository root');
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      content,
      dom: parseHTML(content),
      scripts: extractScripts(content).join('\n')
    };
  };

  test('F14-1: HTML contains dedicated <canvas> element for audio visualization', () => {
    const { dom } = getToneLab();
    const canvas = dom.getElementsByTagName('canvas');
    assert.ok(canvas.length >= 1, 'tone-lab.html must contain at least one <canvas> element for real-time visualization');
  });

  test('F14-2: JavaScript initializes 2D rendering context on canvas', () => {
    const { scripts } = getToneLab();
    assert.ok(/getContext\s*\(\s*['"]2d['"]\s*\)/i.test(scripts),
      'Must obtain 2D rendering context via getContext("2d")');
  });

  test('F14-3: Audio pipeline connects AnalyserNode to capture time-domain waveform', () => {
    const { scripts } = getToneLab();
    assert.ok(/createAnalyser/i.test(scripts), 'Audio graph must create AnalyserNode');
    assert.ok(/getByteTimeDomainData/i.test(scripts), 'Must retrieve time domain data for oscilloscope wave rendering');
  });

  test('F14-4: Audio pipeline captures frequency domain data for FFT spectrum analyzer bars', () => {
    const { scripts } = getToneLab();
    assert.ok(/getByteFrequencyData/i.test(scripts), 'Must retrieve byte frequency data for spectrum bars');
  });

  test('F14-5: Visualizer animation loop utilizes requestAnimationFrame for smooth 60fps rendering', () => {
    const { scripts } = getToneLab();
    assert.ok(/requestAnimationFrame/i.test(scripts),
      'Visualizer must update frames via window.requestAnimationFrame');
  });
});

autoRunCLI();
