import { units } from './data/index.js';
import { shuffle, sample, picKey } from './util.js';

export const LESSONS = [
  { title: 'Cuvinte noi 1', icon: '🌱', desc: 'Ascultă și învață' },
  { title: 'Cuvinte noi 2', icon: '🌿', desc: 'Ascultă și învață' },
  { title: 'Cuvinte noi 3', icon: '🌳', desc: 'Ascultă, citește și scrie' },
  { title: 'Propoziții', icon: '💬', desc: 'Vorbim în propoziții' },
  { title: 'Recapitulare', icon: '🏅', desc: 'Arată ce știi!' },
];

const SPELL_FROM_WEEK = 3;
const SENTENCE_FROM_WEEK = 4;

export const isSpellable = (w) => /^[a-z]{2,7}$/.test(w.en);
export const isBuildable = (p) => p.en.split(' ').length >= 3;

/** Splits a unit's words over the three "new words" lessons. */
export function chunks(words) {
  const a = Math.ceil(words.length / 3);
  const b = Math.ceil((words.length - a) / 2);
  return [words.slice(0, a), words.slice(a, a + b), words.slice(a + b)];
}

const wordsBefore = (u) => units.slice(0, u).flatMap((x) => x.words);
const phrasesBefore = (u) => units.slice(0, u).flatMap((x) => x.phrases);

// What the options of each choice exercise show, so two options never look the same.
const OPTION_KEY = {
  listenPick: picKey,
  readPick: (x) => x.en,
  ro2en: (x) => x.en,
  listen2ro: (x) => x.ro,
};

// Pools are in priority order: same unit first (harder), then older material.
function distractors(item, pools, n, key) {
  const out = [];
  const seenKey = new Set([key(item)]);
  const seenEn = new Set([item.en]);
  for (const pool of pools) {
    for (const cand of shuffle(pool)) {
      if (out.length === n) return out;
      if (seenKey.has(key(cand)) || seenEn.has(cand.en)) continue;
      seenKey.add(key(cand));
      seenEn.add(cand.en);
      out.push(cand);
    }
  }
  return out;
}

const choice = (type, item, pools) => ({
  type,
  item,
  options: shuffle([item, ...distractors(item, pools, 3, OPTION_KEY[type])]),
});

const each = (type, items, pools) => shuffle(items).map((item) => choice(type, item, pools));
const cards = (items) => items.map((item) => ({ type: 'flashcard', item }));
const memory = (items) => ({ type: 'memory', pairs: items });
const spell = (items, n) => sample(items.filter(isSpellable), n).map((item) => ({ type: 'spell', item }));
const build = (items, n) => sample(items.filter(isBuildable), n).map((item) => ({ type: 'sentence', item }));

export function buildLesson(u, l) {
  const unit = units[u];
  const week = u + 1;
  const [A, B, C] = chunks(unit.words);
  const P = unit.phrases;
  const before = wordsBefore(u);
  const pw = [unit.words, before];
  const pp = [P, phrasesBefore(u)];
  const canSpell = week >= SPELL_FROM_WEEK;
  const canBuild = week >= SENTENCE_FROM_WEEK;

  switch (l) {
    case 0:
      return [
        ...each('listenPick', sample(before, 3), [before]),
        ...cards(A),
        ...each('listenPick', A, pw),
        ...each('readPick', A, pw),
      ];
    case 1:
      return [
        ...each('listenPick', sample(A, 3), pw),
        ...cards(B),
        ...each('listenPick', B, pw),
        ...each('readPick', B, pw),
        memory(sample([...A, ...B], 4)),
      ];
    case 2:
      return [
        ...each('readPick', sample([...A, ...B], 3), pw),
        ...cards(C),
        ...each('listenPick', C, pw),
        ...each('readPick', C, pw),
        ...(canSpell ? spell([...A, ...B], 3) : []),
        ...each('ro2en', sample(unit.words, 3), pw),
      ];
    case 3:
      return [
        ...cards(P),
        ...each('listen2ro', sample(P, 4), pp),
        ...each('ro2en', sample(P, 4), pp),
        ...(canBuild ? build(P, 3) : []),
      ];
    default:
      return [
        ...each('listenPick', sample(unit.words, 4), pw),
        ...each('readPick', sample(unit.words, 4), pw),
        memory(sample(unit.words, 6)),
        ...(canSpell ? spell(unit.words, 3) : each('ro2en', sample(unit.words, 3), pw)),
        ...each('listen2ro', sample(P, 2), pp),
        ...each('ro2en', sample(P, 2), pp),
        ...(canBuild ? build(P, 2) : []),
        ...each('listenPick', sample(before, 3), [before]),
      ];
  }
}

/** One long mixed test over the whole course. */
export function buildFinal() {
  const words = units.flatMap((x) => x.words);
  const phrases = units.flatMap((x) => x.phrases);
  return [
    ...each('listenPick', sample(words, 6), [words]),
    ...each('readPick', sample(words, 5), [words]),
    ...spell(words, 3),
    ...each('listen2ro', sample(phrases, 3), [phrases]),
    ...build(phrases, 3),
  ];
}
