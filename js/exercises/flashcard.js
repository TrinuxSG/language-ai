import { speak } from '../speech.js';
import { esc, picture, sayButtons } from '../util.js';

// New material: hear it first, the spelling appears only after the first listen.
export function render(root, step, done) {
  const { item } = step;
  root.innerHTML = `
    <p class="task">Ascultă și repetă cu voce tare</p>
    <div class="flash">
      ${picture(item)}
      <div class="flash-en veiled ${item.en.length > 14 ? 'long' : ''}" lang="en">${esc(item.en)}</div>
      <div class="flash-ro">${esc(item.ro)}</div>
      <div class="row">${sayButtons(item.en)}</div>
      ${item.tip ? `<div class="tip">💡 ${esc(item.tip)}</div>` : ''}
    </div>
    <button class="btn primary" data-next>Mai departe ➜</button>`;

  const word = root.querySelector('.flash-en');
  const reveal = () => word.classList.remove('veiled');
  speak(item.en).then(reveal);
  setTimeout(reveal, 1800);
  root.querySelector('.row').addEventListener('click', reveal);
  root.querySelector('[data-next]').addEventListener('click', () => done(false));
}
