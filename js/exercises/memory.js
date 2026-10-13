import { speak } from '../speech.js';
import { sfx } from '../sfx.js';
import { esc, picture, shuffle } from '../util.js';

const FLIP_BACK_MS = 1000;

function faceHtml(card) {
  if (card.kind === 'word') return `<b lang="en">${esc(card.w.en)}</b>`;
  return picture(card.w) + (card.w.cap ? `<small class="cap">${esc(card.w.ro)}</small>` : '');
}

// Pairs are picture + written word. Wrong flips are part of the game, so they never cost stars.
export function render(root, step, done) {
  const cards = shuffle(step.pairs.flatMap((w, pair) => [{ w, pair, kind: 'pic' }, { w, pair, kind: 'word' }]));
  let open = [];
  let busy = false;
  let left = step.pairs.length;

  root.innerHTML = `
    <p class="task">Găsește perechile: imagine + cuvânt</p>
    <div class="memory">
      ${cards.map((c, k) => `<button class="mcard" data-k="${k}"><span class="mfront">❓</span><span class="mback">${faceHtml(c)}</span></button>`).join('')}
    </div>`;

  root.querySelector('.memory').addEventListener('click', (e) => {
    const btn = e.target.closest('.mcard');
    if (!btn || busy || btn.classList.contains('open')) return;
    const card = cards[btn.dataset.k];
    btn.classList.add('open');
    sfx.tap();
    if (card.kind === 'word') speak(card.w.en);
    open.push(btn);
    if (open.length < 2) return;

    const [first, second] = open;
    open = [];
    if (cards[first.dataset.k].pair === card.pair) {
      first.classList.add('matched');
      second.classList.add('matched');
      sfx.correct();
      speak(card.w.en);
      if (--left === 0) setTimeout(() => done(false), 1300);
    } else {
      busy = true;
      setTimeout(() => {
        first.classList.remove('open');
        second.classList.remove('open');
        busy = false;
      }, FLIP_BACK_MS);
    }
  });
}
