const KEY = 'english-adventure-v1';
const EMPTY = { stars: {}, unlockAll: false, name: '' };

let state = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...EMPTY, ...saved, stars: { ...saved.stars } };
  } catch {
    return { ...EMPTY, stars: {} };
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // private mode or blocked storage: progress lasts for this visit only
  }
}

export const LESSONS_PER_UNIT = 5;
export const FINAL_ID = 'final';
export const lessonId = (u, l) => `${u + 1}-${l + 1}`;

export const getStars = (id) => state.stars[id] || 0;

export function setStars(id, n) {
  if (n <= getStars(id)) return;
  state.stars[id] = n;
  save();
}

export const totalStars = () => Object.values(state.stars).reduce((a, b) => a + b, 0);

export const unitStars = (u) =>
  Array.from({ length: LESSONS_PER_UNIT }, (_, l) => getStars(lessonId(u, l))).reduce((a, b) => a + b, 0);

export function isLessonOpen(u, l) {
  if (state.unlockAll) return true;
  if (l > 0) return getStars(lessonId(u, l - 1)) > 0;
  return u === 0 || getStars(lessonId(u - 1, LESSONS_PER_UNIT - 1)) > 0;
}

export const isFinalOpen = (unitCount) =>
  state.unlockAll || getStars(lessonId(unitCount - 1, LESSONS_PER_UNIT - 1)) > 0;

export const getUnlockAll = () => state.unlockAll;
export function setUnlockAll(on) {
  state.unlockAll = Boolean(on);
  save();
}

export const getName = () => state.name;
export function setName(name) {
  state.name = name;
  save();
}

export function reset() {
  state = { ...EMPTY, stars: {} };
  save();
}
