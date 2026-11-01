/**
 * Authoritative Web Audio & Acoustic Reference Oracle for 1files E2E Tests.
 * Contains mathematical formulas for frequencies, binaural beats, and DTMF tones.
 */

const MIDI_NOTE_A4 = 69;
const FREQ_A4 = 440.0;

/**
 * Calculates theoretical frequency for a given MIDI note number.
 */
function midiToFrequency(midiNote) {
  return FREQ_A4 * Math.pow(2, (midiNote - MIDI_NOTE_A4) / 12);
}

/**
 * Calculates theoretical binaural beat frequency: |freqRight - freqLeft|.
 */
function calculateBeatFrequency(freqLeft, freqRight) {
  return Math.abs(freqRight - freqLeft);
}

/**
 * Maps a brainwave band to standard physiological frequency bounds.
 */
const BRAINWAVE_BANDS = {
  delta: { min: 0.5, max: 4.0, typical: 2.0, state: 'Deep Sleep & Healing' },
  theta: { min: 4.0, max: 8.0, typical: 6.0, state: 'Meditation & REM' },
  alpha: { min: 8.0, max: 13.0, typical: 10.0, state: 'Relaxed Focus & Flow' },
  beta: { min: 13.0, max: 30.0, typical: 20.0, state: 'Active Thinking' },
  gamma: { min: 30.0, max: 50.0, typical: 40.0, state: 'High Cognition' }
};

/**
 * Standard ITU-T DTMF Dual Tone Frequencies.
 */
const DTMF_FREQUENCIES = {
  '1': { low: 697, high: 1209 },
  '2': { low: 697, high: 1336 },
  '3': { low: 697, high: 1477 },
  '4': { low: 770, high: 1209 },
  '5': { low: 770, high: 1336 },
  '6': { low: 770, high: 1477 },
  '7': { low: 852, high: 1209 },
  '8': { low: 852, high: 1336 },
  '9': { low: 852, high: 1477 },
  '*': { low: 941, high: 1209 },
  '0': { low: 941, high: 1336 },
  '#': { low: 941, high: 1477 }
};

/**
 * Verifies noise generator mathematical properties across sample buffers.
 */
function verifyNoiseProperties(samples, type = 'white') {
  if (!samples || samples.length === 0) return { valid: false, error: 'Empty buffer' };

  let sum = 0;
  let max = -Infinity;
  let min = Infinity;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    sum += s;
    if (s > max) max = s;
    if (s < min) min = s;
  }

  const mean = sum / samples.length;
  // Calculate variance and standard deviation
  let varianceSum = 0;
  for (let i = 0; i < samples.length; i++) {
    varianceSum += Math.pow(samples[i] - mean, 2);
  }
  const variance = varianceSum / samples.length;
  const stdDev = Math.sqrt(variance);

  // Bounds checks: samples must stay within [-1.0, 1.0] to avoid digital clipping
  const withinBounds = min >= -1.05 && max <= 1.05;
  // DC offset check: mean should be near 0
  const dcNearZero = Math.abs(mean) < 0.1;

  return {
    valid: withinBounds && dcNearZero,
    mean,
    stdDev,
    min,
    max,
    withinBounds,
    dcNearZero
  };
}

module.exports = {
  midiToFrequency,
  calculateBeatFrequency,
  BRAINWAVE_BANDS,
  DTMF_FREQUENCIES,
  verifyNoiseProperties
};
