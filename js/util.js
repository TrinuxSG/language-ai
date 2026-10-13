export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const sample = (list, n) => shuffle(list).slice(0, n);

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

export const hasPicture = (w) => Boolean(w.color || w.num || w.emoji);

// Identity of what the child sees, used to keep answer options visually distinct.
export function picKey(w) {
  if (w.color) return `c:${w.color}`;
  if (w.num) return `n:${w.num}`;
  return `e:${w.emoji}${w.scale || ''}`;
}

export function picture(w) {
  if (w.color) return `<span class="pic pic-swatch" style="--c:${w.color}"></span>`;
  if (w.num) return `<span class="pic pic-num"><b>${w.num}</b><i>${'●'.repeat(w.num)}</i></span>`;
  const scale = w.scale ? ` style="--s:${w.scale}"` : '';
  return `<span class="pic pic-emoji"${scale}>${w.emoji || '💬'}</span>`;
}

// Buttons are handled by one delegated [data-say] listener in app.js.
export function sayButtons(text) {
  const t = esc(text);
  return `<button class="btn-sound" data-say="${t}" aria-label="Ascultă">🔊</button>
    <button class="btn-sound btn-slow" data-say="${t}" data-slow aria-label="Ascultă rar">🐢</button>`;
}

export function shake(node) {
  node.classList.remove('shake');
  void node.offsetWidth;
  node.classList.add('shake');
}
