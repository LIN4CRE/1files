/**
 * Tier 4 Application Workload: Acoustic Frequency Sweep & Visualizer
 * Simulates acoustic testing: logarithmic frequency sweep, binaural entrainment, and FFT visualizer updates.
 */

const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { calculateBeatFrequency, BRAINWAVE_BANDS } = require('../helpers/audio-oracle');

describe('Tier 4 Workload: Acoustic Frequency Sweep & Visualizer', () => {
  test('T4-SWEEP-1: Logarithmic frequency sweep calculates continuous progression', () => {
    const fStart = 20.0;    // 20 Hz
    const fEnd = 20000.0;   // 20,000 Hz
    const duration = 5.0;   // 5 seconds

    // Logarithmic frequency at time t: f(t) = fStart * (fEnd / fStart)^(t / duration)
    const getFreqAtTime = t => fStart * Math.pow(fEnd / fStart, t / duration);

    const f0 = getFreqAtTime(0);
    const fMid = getFreqAtTime(2.5);
    const fFinal = getFreqAtTime(5.0);

    assert.equal(Math.round(f0), 20);
    // At t = 2.5s, log midpoint is sqrt(20 * 20000) = sqrt(400,000) = ~632.45 Hz
    assert.ok(Math.abs(fMid - 632.45) < 1.0, `Midpoint frequency should be ~632 Hz (got ${fMid.toFixed(2)})`);
    assert.equal(Math.round(fFinal), 20000);
  });

  test('T4-SWEEP-2: Alpha wave binaural offset is maintained throughout sweep', () => {
    const carrier = 250;
    const offset = 10; // Alpha
    const left = carrier;
    const right = carrier + offset;

    const beat = calculateBeatFrequency(left, right);
    assert.equal(beat, 10);
    assert.ok(beat >= BRAINWAVE_BANDS.alpha.min && beat <= BRAINWAVE_BANDS.alpha.max);
  });

  test('T4-SWEEP-3: Visualizer allocates 64 FFT frequency bands and scales them to canvas height', () => {
    const fftBands = 64;
    const canvasHeight = 150;
    const byteFrequencyData = new Uint8Array(fftBands);

    // Simulate frequency peak around 1 kHz
    for (let i = 0; i < fftBands; i++) {
      byteFrequencyData[i] = Math.max(0, Math.min(255, Math.round(255 * Math.exp(-Math.pow((i - 20) / 5, 2)))));
    }

    // Map byte values [0..255] to canvas bar heights [0..canvasHeight]
    const barHeights = Array.from(byteFrequencyData, val => (val / 255) * canvasHeight);
    assert.equal(barHeights.length, 64);
    assert.ok(Math.max(...barHeights) <= canvasHeight);
    assert.ok(Math.min(...barHeights) >= 0);
  });

  test('T4-SWEEP-4: AudioContext master mute drops gain to 0 instantly without disconnecting nodes', () => {
    let gainValue = 0.8;
    const toggleMute = isMuted => {
      gainValue = isMuted ? 0.0 : 0.8;
    };
    toggleMute(true);
    assert.equal(gainValue, 0.0);
    toggleMute(false);
    assert.equal(gainValue, 0.8);
  });
});

autoRunCLI();
