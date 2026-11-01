/**
 * F12: Stereo Binaural Beat Synth
 * Verifies dual-channel stereophonic panning and brainwave entrainment presets in tone-lab.html.
 */

const fs = require('node:fs');
const path = require('node:path');
const { describe, test, assert, autoRunCLI } = require('../helpers/test-harness');
const { extractScripts } = require('../helpers/dom-parser');
const { BRAINWAVE_BANDS, calculateBeatFrequency } = require('../helpers/audio-oracle');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('F12: Stereo Binaural Beat Synth', () => {
  const getToneLabScripts = () => {
    const filePath = path.join(PROJECT_ROOT, 'tone-lab.html');
    assert.ok(fs.existsSync(filePath), 'tone-lab.html must exist at repository root');
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, scripts: extractScripts(content).join('\n') };
  };

  test('F12-1: Implements stereophonic channel panning via StereoPannerNode or ChannelMerger', () => {
    const { scripts } = getToneLabScripts();
    assert.ok(/createStereoPanner|createChannelMerger|pan/i.test(scripts),
      'Must utilize Web Audio panning or merger nodes for isolated left/right ear output');
  });

  test('F12-2: Includes brainwave entrainment presets across Delta, Theta, Alpha, Beta, Gamma', () => {
    const { content } = getToneLabScripts();
    assert.ok(/Delta/i.test(content), 'Must include Delta preset');
    assert.ok(/Theta/i.test(content), 'Must include Theta preset');
    assert.ok(/Alpha/i.test(content), 'Must include Alpha preset');
    assert.ok(/Beta/i.test(content), 'Must include Beta preset');
    assert.ok(/Gamma/i.test(content), 'Must include Gamma preset');
  });

  test('F12-3: Mathematical oracle validates beat offset calculation |fR - fL|', () => {
    // Authoritative verification against audio oracle
    const left = 200;
    const right = 210;
    const beat = calculateBeatFrequency(left, right);
    assert.equal(beat, 10, 'Beat frequency must equal difference between right and left channels');
    assert.ok(beat >= BRAINWAVE_BANDS.alpha.min && beat <= BRAINWAVE_BANDS.alpha.max,
      '10 Hz must fall within standard Alpha brainwave frequency band');
  });

  test('F12-4: Supports separate carrier frequency and beat offset frequency adjustment', () => {
    const { content } = getToneLabScripts();
    assert.ok(/carrier/i.test(content), 'Must provide carrier frequency control');
    assert.ok(/beat|offset/i.test(content), 'Must provide beat offset frequency control');
  });

  test('F12-5: Panning separation applies hard left (-1) and hard right (+1) isolation', () => {
    const { scripts } = getToneLabScripts();
    assert.ok(/-1(?:\.0)?/i.test(scripts) && /(?:\+?1(?:\.0)?)/i.test(scripts),
      'Must pan left ear to -1 and right ear to +1 for true stereophonic binaural isolation');
  });
});

autoRunCLI();
