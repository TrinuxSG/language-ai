// Content checks for the course data. Run: node tools/validate.mjs
import { units } from '../js/data/index.js';
import { picKey, hasPicture } from '../js/util.js';
import { chunks, isSpellable, isBuildable } from '../js/lesson-builder.js';

// Grammar and helper words that phrases may use without being taught as picture words.
const HELPERS = new Set(`a an the and is it it's isn't i i'm i've my your you this what what's who how are do don't
  have got can some like love name fine old many colour favourite open sit down stand up listen touch clap alex`.split(/\s+/));

const errors = [];
const fail = (unit, msg) => errors.push(`Unit ${unit}: ${msg}`);

const seenEn = new Map();
const seenPic = new Map();
const known = new Set();

units.forEach((unit, u) => {
  const n = u + 1;
  for (const field of ['title', 'titleRo', 'emoji', 'color']) if (!unit[field]) fail(n, `missing ${field}`);
  if (unit.words.length < 10) fail(n, `only ${unit.words.length} words`);
  if (unit.phrases.length < 4) fail(n, `only ${unit.phrases.length} phrases (choice exercises need 4)`);

  for (const w of unit.words) {
    if (!w.en || !w.ro) fail(n, `word without en/ro: ${JSON.stringify(w)}`);
    if (!hasPicture(w)) fail(n, `"${w.en}" has no picture (emoji, color or num)`);
    if (seenEn.has(w.en)) fail(n, `"${w.en}" already taught in unit ${seenEn.get(w.en)}`);
    if (seenPic.has(picKey(w))) fail(n, `"${w.en}" has the same picture as "${seenPic.get(picKey(w))}"`);
    seenEn.set(w.en, n);
    seenPic.set(picKey(w), w.en);
    w.en.split(' ').forEach((part) => known.add(part));
  }

  const [A, B] = chunks(unit.words);
  if (n >= 3 && [...A, ...B].filter(isSpellable).length < 3) fail(n, 'fewer than 3 spellable words in lessons 1-2');
  if (n >= 4 && unit.phrases.filter(isBuildable).length < 3) fail(n, 'fewer than 3 phrases with 3+ words');

  const seenPhrase = new Set();
  for (const p of unit.phrases) {
    if (!p.en || !p.ro) fail(n, `phrase without en/ro: ${JSON.stringify(p)}`);
    if (seenPhrase.has(p.en)) fail(n, `duplicate phrase "${p.en}"`);
    seenPhrase.add(p.en);
    for (const raw of p.en.toLowerCase().split(' ')) {
      const token = raw.replace(/[^a-z']/g, '');
      const singular = token.replace(/s$/, '');
      if (!HELPERS.has(token) && !known.has(token) && !known.has(singular)) {
        fail(n, `phrase "${p.en}" uses "${token}", which is not taught yet`);
      }
    }
  }
});

const words = units.reduce((sum, unit) => sum + unit.words.length, 0);
const phrases = units.reduce((sum, unit) => sum + unit.phrases.length, 0);
console.log(`${units.length} units, ${words} words, ${phrases} phrases`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('OK');
