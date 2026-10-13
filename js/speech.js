const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;

// Known good British voices, best first (Chrome, then Apple).
const PREFERRED = ['Google UK English Female', 'Google UK English Male', 'Daniel', 'Kate', 'Serena', 'Martha', 'Arthur'];

let voice = null;
let loaded = false;
let current = null; // keeps the utterance alive, Chrome drops onend otherwise
const listeners = [];

function pickVoice() {
  const voices = synth.getVoices();
  if (!voices.length) return;
  loaded = true;
  const en = voices.filter((v) => /^en([-_]|$)/i.test(v.lang));
  const gb = en.filter((v) => /^en[-_]GB/i.test(v.lang));
  voice =
    PREFERRED.map((name) => gb.find((v) => v.name.startsWith(name))).find(Boolean) ||
    gb[0] ||
    en.find((v) => /^en[-_]US/i.test(v.lang)) ||
    en[0] ||
    null;
}

if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', () => {
    pickVoice();
    listeners.forEach((fn) => fn());
  });
}

export const onVoicesChanged = (fn) => listeners.push(fn);

/** 'unsupported' | 'loading' | 'no-english' | 'ok' */
export function voiceStatus() {
  if (!synth) return 'unsupported';
  if (!loaded) return 'loading';
  return voice ? 'ok' : 'no-english';
}

export const voiceName = () => (voice ? `${voice.name} (${voice.lang})` : '');

// Chrome can drop an utterance queued in the same tick as cancel(), so give it a moment.
const AFTER_CANCEL_MS = 60;

export function speak(text, { slow = false } = {}) {
  if (!synth) return Promise.resolve();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'en-GB';
    u.rate = slow ? 0.6 : 0.85;
    u.onend = u.onerror = () => resolve();
    current = u;
    if (!synth.speaking && !synth.pending) return synth.speak(u);
    synth.cancel();
    setTimeout(() => (current === u ? synth.speak(u) : resolve()), AFTER_CANCEL_MS);
  });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Speaks and resolves when done, but never sooner than `min` nor later than `max` ms. */
export const speakAndWait = (text, min = 900, max = 3500) =>
  Promise.all([Promise.race([speak(text), wait(max)]), wait(min)]);

export function stopSpeaking() {
  current = null;
  synth?.cancel();
}

// iOS and Chrome only allow speech after a user gesture; call this from the first tap.
export function unlockSpeech() {
  if (!synth) return;
  const u = new SpeechSynthesisUtterance('');
  u.volume = 0;
  synth.speak(u);
}
