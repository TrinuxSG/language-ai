import { speak, speakAndWait } from '../speech.js';
import { sfx } from '../sfx.js';
import { esc, hasPicture, picture, sayButtons, shake } from '../util.js';

// hear: English is spoken instead of shown. show: what the prompt displays. opt: what the options display.
const MODES = {
  listenPick: { task: 'Ascultă și alege imaginea', hear: true, show: null, opt: 'pic' },
  readPick: { task: 'Ce este în imagine? Alege cuvântul', hear: false, show: 'pic', opt: 'en' },
  ro2en: { task: 'Cum spui în engleză?', hear: false, show: 'ro', opt: 'en' },
  listen2ro: { task: 'Ascultă. Ce înseamnă?', hear: true, show: null, opt: 'ro' },
};

const caption = (w) => (w.cap ? `<small class="cap">${esc(w.ro)}</small>` : '');

function optionHtml(o, kind) {
  if (kind === 'pic') return picture(o) + caption(o);
  return kind === 'en' ? `<span lang="en">${esc(o.en)}</span>` : esc(o.ro);
}

function promptHtml(item, m) {
  if (m.hear) return sayButtons(item.en);
  if (m.show === 'pic') return picture(item) + caption(item);
  return (hasPicture(item) ? picture(item) : '') + `<span class="prompt-text">${esc(item.ro)}</span>`;
}

export function render(root, step, done) {
  const m = MODES[step.type];
  const { item, options } = step;
  let mistake = false;
  let solved = false;

  root.innerHTML = `
    <p class="task">${m.task}</p>
    <div class="prompt ${m.hear ? 'prompt-hear' : ''}">${promptHtml(item, m)}</div>
    <div class="options options-${m.opt}">
      ${options.map((o, i) => `<button class="option" data-i="${i}">${optionHtml(o, m.opt)}</button>`).join('')}
    </div>
    <div class="answer" hidden><b lang="en">${esc(item.en)}</b> = ${esc(item.ro)}</div>`;

  if (m.hear) speak(item.en);

  root.querySelector('.options').addEventListener('click', async (e) => {
    const btn = e.target.closest('.option');
    if (!btn || solved || btn.disabled) return;
    if (options[btn.dataset.i] !== item) {
      mistake = true;
      btn.disabled = true;
      btn.classList.add('wrong');
      shake(btn);
      sfx.wrong();
      return;
    }
    solved = true;
    btn.classList.add('correct');
    root.querySelector('.answer').hidden = false;
    sfx.correct();
    await speakAndWait(item.en);
    done(mistake);
  });
}
