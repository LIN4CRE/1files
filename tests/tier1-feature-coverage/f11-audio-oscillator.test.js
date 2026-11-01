/**
 * F11: Web Audio Oscillator Engine
 * Verifies precision multi-waveform audio tone synthesis (1 Hz - 20 kHz) in tone-lab.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { parseHTML, extractScripts } = require('../helpers/dom-parser');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F11: Web Audio Oscillator Engine', () => {
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

  test('F11-1: tone-lab.html is a self-contained single-file document with no external scripts', () => {
    const { content } = getToneLab();
    assert.ok(!/<script[^>]+src=/i.test(content), 'tone-lab.html must not load external scripts');
    assert.ok(!/<link[^>]+href=["']https?:\/\//i.test(content), 'tone-lab.html must not link external stylesheets');
  });

  test('F11-2: Synthesizer supports 4 standard waveforms (sine, triangle, square, sawtooth)', () => {
    const { scripts } = getToneLab();
    assert.ok(/sine/i.test(scripts), 'Must support sine waveform');
    assert.ok(/triangle/i.test(scripts), 'Must support triangle waveform');
    assert.ok(/square/i.test(scripts), 'Must support square waveform');
    assert.ok(/sawtooth/i.test(scripts), 'Must support sawtooth waveform');
  });

  test('F11-3: Frequency control allows adjusting pitch across audible spectrum (1 Hz - 20 kHz)', () => {
    const { content } = getToneLab();
    assert.ok(/20000|20\s*k/i.test(content), 'Frequency range must support upper limit up to 20,000 Hz');
    assert.ok(/(?:min=["']1["']|1\s*Hz)/i.test(content), 'Frequency range must support low frequencies down to 1 Hz');
  });

  test('F11-4: Includes standard acoustic presets such as concert pitch A440', () => {
    const { content } = getToneLab();
    assert.ok(/440/i.test(content), 'Must include 440 Hz standard concert pitch preset');
  });

  test('F11-5: AudioContext complies with browser autoplay policy (suspended until user action)', () => {
    const { scripts } = getToneLab();
    assert.ok(/AudioContext|webkitAudioContext/i.test(scripts), 'Must instantiate Web Audio AudioContext');
    assert.ok(/resume\s*\(\s*\)/i.test(scripts), 'Must call audioCtx.resume() on user interaction to honor autoplay policy');
  });
});

autoRunCLI();
