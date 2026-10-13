import { speak, speakAndWait } from '../speech.js';
import { sfx } from '../sfx.js';
import { esc, picture, sayButtons, shake, shuffle } from '../util.js';

const HINT_AFTER_MISSES = 2;

function scramble(target) {
  let tiles = shuffle(target);
  for (let i = 0; i < 5 && tiles.join('|') === target.join('|'); i++) tiles = shuffle(target);
  return tiles;
}

// 'spell': tap letters in order to write a word. 'sentence': tap words in order to build a phrase.
export function render(root, step, done) {
  const { item } = step;
  const spelling = step.type === 'spell';
  const target = spelling ? [...item.en] : item.en.split(' ');
  let pos = 0;
  let misses = 0;
  let mistake = false;

  root.innerHTML = `
    <p class="task">${spelling ? 'Ascultă și scrie cuvântul' : 'Ascultă și pune cuvintele în ordine'}</p>
    <div class="prompt">
      ${spelling ? picture(item) : ''}
      <span class="prompt-text">${esc(item.ro)}</span>
      <span class="row">${sayButtons(item.en)}</span>
    </div>
    <div class="slots ${spelling ? 'slots-letters' : 'slots-words'}" lang="en">
      ${target.map(() => '<span class="slot"></span>').join('')}
    </div>
    <div class="tiles" lang="en">
      ${scramble(target).map((t) => `<button class="tile">${esc(t)}</button>`).join('')}
    </div>`;

  const slots = [...root.querySelectorAll('.slot')];
  const tiles = [...root.querySelectorAll('.tile')];
  const clearHint = () => tiles.forEach((t) => t.classList.remove('hint'));

  speak(item.en);

  root.querySelector('.tiles').addEventListener('click', async (e) => {
    const tile = e.target.closest('.tile');
    if (!tile || tile.disabled) return;
    if (tile.textContent !== target[pos]) {
      mistake = true;
      shake(tile);
      sfx.wrong();
      if (++misses >= HINT_AFTER_MISSES) {
        tiles.find((t) => !t.disabled && t.textContent === target[pos])?.classList.add('hint');
      }
      return;
    }
    clearHint();
    misses = 0;
    tile.disabled = true;
    slots[pos].textContent = target[pos];
    slots[pos].classList.add('filled');
    pos++;
    if (pos < target.length) return sfx.tap();

    root.querySelector('.slots').classList.add('done');
    sfx.correct();
    await speakAndWait(item.en);
    done(mistake);
  });
}
