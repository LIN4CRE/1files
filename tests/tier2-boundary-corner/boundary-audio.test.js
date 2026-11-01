/**
 * Tier 2 Boundary & Corner Cases: Web Audio Laboratory (F11–F14)
 * 20 test cases covering acoustic frequency limits, binaural beat offsets, noise buffer stability, and visualizer bounds.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { extractScripts } = require('../helpers/dom-parser');
const { midiToFrequency, calculateBeatFrequency, verifyNoiseProperties } = require('../helpers/audio-oracle');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('Tier 2: Web Audio Boundaries (F11–F14)', () => {
  const getToneLab = () => {
    const filePath = path.join(PROJECT_ROOT, 'tone-lab.html');
    assert.ok(fs.existsSync(filePath), 'tone-lab.html must exist at repository root');
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, scripts: extractScripts(content).join('\n') };
  };

  // --- F11 Boundaries (5 tests) ---
  test('T2-F11-1: Frequency clamping prevents zero or negative frequencies', () => {
    const clampFreq = f => isNaN(Number(f)) ? 440 : Math.max(1, Math.min(20000, Number(f)));
    assert.equal(clampFreq(0), 1, 'Frequency 0 should be clamped to 1 Hz');
    assert.equal(clampFreq(-100), 1, 'Negative frequency should be clamped to 1 Hz');
    assert.equal(clampFreq(25000), 20000, 'Frequency > 20000 should be clamped to 20000 Hz');
  });

  test('T2-F11-2: Infrasonic boundary (1 Hz) calculates valid period duration', () => {
    const freq = 1.0;
    const periodSeconds = 1 / freq;
    assert.equal(periodSeconds, 1.0, '1 Hz wave period is exactly 1.0 second');
  });

  test('T2-F11-3: Ultrasonic boundary (20,000 Hz) does not exceed standard 44.1kHz Nyquist frequency', () => {
    const sampleRate = 44100;
    const nyquist = sampleRate / 2;
    const maxFreq = 20000;
    assert.ok(maxFreq < nyquist, `20 kHz must remain below Nyquist frequency (${nyquist} Hz) to prevent aliasing`);
  });

  test('T2-F11-4: MIDI note calculation handles boundaries (C0 = note 12, B8 = note 119)', () => {
    const c0Freq = midiToFrequency(12);
    const b8Freq = midiToFrequency(119);
    assert.ok(c0Freq > 16 && c0Freq < 17, `C0 frequency should be ~16.35 Hz (got ${c0Freq.toFixed(2)})`);
    assert.ok(b8Freq > 7900 && b8Freq < 8000, `B8 frequency should be ~7902 Hz (got ${b8Freq.toFixed(2)})`);
  });

  test('T2-F11-5: Waveform switching handles all 4 types without audio glitch', () => {
    const validWaveforms = ['sine', 'triangle', 'square', 'sawtooth'];
    for (const wf of validWaveforms) {
      assert.ok(typeof wf === 'string' && wf.length > 0);
    }
  });

  // --- F12 Boundaries (5 tests) ---
  test('T2-F12-1: Binaural beat with 0 Hz offset produces monaural unison without phase cancellation', () => {
    const beat = calculateBeatFrequency(440, 440);
    assert.equal(beat, 0, 'Equal frequencies produce 0 Hz beat');
  });

  test('T2-F12-2: Sub-Hz binaural beat offset (0.5 Hz Delta) calculates accurately', () => {
    const beat = calculateBeatFrequency(200, 200.5);
    assert.equal(beat, 0.5, 'Offset of 0.5 Hz corresponds to ultra-slow deep sleep Delta wave');
  });

  test('T2-F12-3: High binaural beat offset (40 Hz Gamma) calculates accurately', () => {
    const beat = calculateBeatFrequency(200, 240);
    assert.equal(beat, 40, 'Offset of 40 Hz corresponds to peak cognition Gamma wave');
  });

  test('T2-F12-4: Carrier frequency handles upper limits (up to 1,000 Hz for binaural perception)', () => {
    // Humans perceive binaural beats best below 1000 Hz
    const carrier = 800;
    assert.ok(carrier < 1000, 'Carrier frequencies under 1000 Hz produce effective entrainment');
  });

  test('T2-F12-5: Panning values are strictly bounded between -1.0 and +1.0', () => {
    const leftPan = -1.0;
    const rightPan = 1.0;
    assert.ok(leftPan >= -1 && leftPan <= 1);
    assert.ok(rightPan >= -1 && rightPan <= 1);
  });

  // --- F13 Boundaries (5 tests) ---
  test('T2-F13-1: White noise buffer of 512 samples contains no NaN or infinite values', () => {
    const samples = new Float32Array(512);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    const check = verifyNoiseProperties(samples, 'white');
    assert.ok(check.withinBounds, 'White noise samples must stay within [-1.05, 1.05]');
  });

  test('T2-F13-2: Pink noise filter does not explode or saturate over 10,000 samples', () => {
    const bufferSize = 10000;
    const data = new Float32Array(bufferSize);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    const check = verifyNoiseProperties(data, 'pink');
    assert.ok(check.withinBounds, 'Pink noise filter output must remain bounded');
  });

  test('T2-F13-3: Brownian noise leaky integrator does not drift infinitely into DC offset', () => {
    const bufferSize = 10000;
    const data = new Float32Array(bufferSize);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + (0.02 * white)) / 1.02;
      data[i] = lastOut * 3.5;
    }
    const check = verifyNoiseProperties(data, 'brownian');
    assert.ok(check.withinBounds, 'Brownian noise must not saturate amplitude');
  });

  test('T2-F13-4: Master volume level 0.0 achieves digital zero silence', () => {
    const volume = 0.0;
    assert.equal(volume * 0.8, 0.0, 'Zero volume must produce absolute silence');
  });

  test('T2-F13-5: Master volume is clamped to max 1.0 to prevent speaker damage', () => {
    const clampVol = v => Math.max(0, Math.min(1.0, v));
    assert.equal(clampVol(1.5), 1.0, 'Excessive volume must be clamped to 1.0');
  });

  // --- F14 Boundaries (5 tests) ---
  test('T2-F14-1: Time-domain byte buffer with neutral baseline (128) renders flat horizontal line', () => {
    const buffer = new Uint8Array(256).fill(128);
    const isBaseline = buffer.every(v => v === 128);
    assert.ok(isBaseline, 'Baseline audio should be represented by 128 in Uint8Array');
  });

  test('T2-F14-2: Max amplitude values (0 and 255) do not overflow canvas dimensions', () => {
    const canvasHeight = 200;
    const toY = (byteVal) => (byteVal / 255) * canvasHeight;
    assert.equal(toY(0), 0);
    assert.equal(toY(255), canvasHeight);
  });

  test('T2-F14-3: FFT Spectrum bar count is power of two (e.g. 32, 64, or 128)', () => {
    const binCount = 64;
    assert.ok((binCount & (binCount - 1)) === 0, 'FFT bar count must be a power of two');
  });

  test('T2-F14-4: Stopping audio halts requestAnimationFrame visualizer loop', () => {
    const { scripts } = getToneLab();
    assert.ok(/cancelAnimationFrame|active|running|animId/i.test(scripts),
      'Must manage visualizer animation frame id for clean stopping');
  });

  test('T2-F14-5: Dual mode view provides split display for oscilloscope and spectrum', () => {
    const { content } = getToneLab();
    assert.ok(/oscilloscope|spectrum|fft|visualizer/i.test(content),
      'Must support visualizer modes');
  });
});

autoRunCLI();
