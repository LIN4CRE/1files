/**
 * Sandboxed Browser VM Environment for 1files E2E Tests.
 * Emulates modern browser globals (Web Crypto, Web Audio, DOM, Storage, FileReader) in Node.js VM.
 */

const vm = require('node:vm');
const crypto = require('node:crypto');

class MockLocalStorage {
  constructor(shouldThrow = false) {
    this._data = {};
    this.shouldThrow = shouldThrow;
  }

  getItem(key) {
    if (this.shouldThrow) throw new Error('SecurityError: The operation is insecure.');
    return Object.prototype.hasOwnProperty.call(this._data, key) ? this._data[key] : null;
  }

  setItem(key, value) {
    if (this.shouldThrow) throw new Error('SecurityError: The operation is insecure.');
    this._data[key] = String(value);
  }

  removeItem(key) {
    if (this.shouldThrow) throw new Error('SecurityError: The operation is insecure.');
    delete this._data[key];
  }

  clear() {
    if (this.shouldThrow) throw new Error('SecurityError: The operation is insecure.');
    this._data = {};
  }
}

class MockAudioParam {
  constructor(defaultValue = 0) {
    this.value = defaultValue;
  }
  setValueAtTime(val) { this.value = val; }
  linearRampToValueAtTime(val) { this.value = val; }
  exponentialRampToValueAtTime(val) { this.value = val; }
}

class MockAudioNode {
  constructor() {
    this._connectedTo = [];
  }
  connect(target) {
    this._connectedTo.push(target);
    return target;
  }
  disconnect() {
    this._connectedTo = [];
  }
}

class MockOscillatorNode extends MockAudioNode {
  constructor() {
    super();
    this.type = 'sine';
    this.frequency = new MockAudioParam(440);
    this.detune = new MockAudioParam(0);
    this.started = false;
    this.stopped = false;
  }
  start() { this.started = true; }
  stop() { this.stopped = true; }
}

class MockGainNode extends MockAudioNode {
  constructor() {
    super();
    this.gain = new MockAudioParam(1.0);
  }
}

class MockStereoPannerNode extends MockAudioNode {
  constructor() {
    super();
    this.pan = new MockAudioParam(0);
  }
}

class MockAnalyserNode extends MockAudioNode {
  constructor() {
    super();
    this.fftSize = 2048;
    this.frequencyBinCount = 1024;
  }
  getByteTimeDomainData(array) {
    array.fill(128); // neutral baseline
  }
  getByteFrequencyData(array) {
    array.fill(64);
  }
}

class MockAudioContext {
  constructor() {
    this.state = 'suspended';
    this.sampleRate = 44100;
    this.destination = new MockAudioNode();
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }
  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
  createOscillator() { return new MockOscillatorNode(); }
  createGain() { return new MockGainNode(); }
  createStereoPanner() { return new MockStereoPannerNode(); }
  createAnalyser() { return new MockAnalyserNode(); }
  createBuffer(channels, length, sampleRate) {
    const channelData = Array.from({ length: channels }, () => new Float32Array(length));
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: idx => channelData[idx]
    };
  }
  createBufferSource() {
    const src = new MockAudioNode();
    src.buffer = null;
    src.loop = false;
    src.start = () => {};
    src.stop = () => {};
    return src;
  }
}

class MockFileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.result = null;
  }
  readAsText(blob) {
    setTimeout(() => {
      this.result = blob.text ? blob.text : String(blob);
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
  readAsArrayBuffer(blob) {
    setTimeout(() => {
      this.result = blob.buffer ? blob.buffer : Buffer.from(String(blob));
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
}

/**
 * Creates a browser-like sandbox context.
 */
function createSandbox(options = {}) {
  const localStorageMock = new MockLocalStorage(options.blockStorage || false);

  const elementsById = new Map();
  const listeners = new Map();

  const mockDocument = {
    title: '',
    getElementById: id => elementsById.get(id) || {
      id,
      value: '',
      innerText: '',
      innerHTML: '',
      style: {},
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      setAttribute() {},
      getAttribute: () => null,
      addEventListener(evt, fn) {
        if (!listeners.has(evt)) listeners.set(evt, []);
        listeners.get(evt).push(fn);
      }
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: tag => ({
      tagName: tag.toUpperCase(),
      style: {},
      setAttribute() {},
      getAttribute: () => null,
      appendChild() {},
      click() {}
    }),
    addEventListener(evt, fn) {
      if (!listeners.has(evt)) listeners.set(evt, []);
      listeners.get(evt).push(fn);
    }
  };

  const sandbox = {
    Buffer,
    Uint8Array,
    ArrayBuffer,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    TextEncoder,
    TextDecoder,
    btoa: str => Buffer.from(str, 'binary').toString('base64'),
    atob: b64 => Buffer.from(b64, 'base64').toString('binary'),
    crypto: globalThis.crypto || crypto.webcrypto,
    AudioContext: MockAudioContext,
    webkitAudioContext: MockAudioContext,
    FileReader: MockFileReader,
    Blob: globalThis.Blob,
    File: globalThis.File,
    URL: {
      createObjectURL: () => 'blob:mock-url-' + Math.random(),
      revokeObjectURL: () => {}
    },
    localStorage: localStorageMock,
    document: mockDocument,
    window: null,
    requestAnimationFrame: fn => setTimeout(fn, 16),
    cancelAnimationFrame: id => clearTimeout(id),
    ...options.customGlobals
  };

  sandbox.window = sandbox;
  sandbox.global = sandbox;
  sandbox.self = sandbox;

  return vm.createContext(sandbox);
}

/**
 * Runs JavaScript code in the sandbox.
 */
function runInSandbox(code, context) {
  return vm.runInContext(code, context);
}

module.exports = {
  createSandbox,
  runInSandbox,
  MockLocalStorage,
  MockAudioContext
};
