import { units } from './data/index.js';
import { LESSONS, buildLesson, buildFinal } from './lesson-builder.js';
import * as progress from './progress.js';
import { speak, stopSpeaking, unlockSpeech, voiceStatus, voiceName, onVoicesChanged } from './speech.js';
import { sfx } from './sfx.js';
import { esc, picture } from './util.js';
import { render as flashcard } from './exercises/flashcard.js';
import { render as choice } from './exercises/choice.js';
import { render as memory } from './exercises/memory.js';
import { render as order } from './exercises/order.js';

const RENDER = {
  flashcard,
  listenPick: choice,
  readPick: choice,
  ro2en: choice,
  listen2ro: choice,
  memory,
  spell: order,
  sentence: order,
};

const app = document.getElementById('app');
const MAX_STARS = 3;

// Bumped on every screen change so callbacks from an abandoned lesson are ignored.
let session = 0;

const starsHtml = (n) => '⭐'.repeat(n) + `<span class="star-off">${'⭐'.repeat(MAX_STARS - n)}</span>`;
const starsFor = (mistakes) => (mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1);

/* ---------- home ---------- */

function nextUp() {
  for (let u = 0; u < units.length; u++) {
    for (let l = 0; l < LESSONS.length; l++) {
      if (!progress.getStars(progress.lessonId(u, l))) {
        return { href: `#/lesson/${u + 1}/${l + 1}`, label: `${units[u].title} · ${LESSONS[l].title}` };
      }
    }
  }
  return progress.getStars(progress.FINAL_ID)
    ? { href: '#/certificat', label: 'Diploma mea' }
    : { href: '#/final', label: 'Marele test' };
}

function voiceBanner() {
  const status = voiceStatus();
  if (status === 'unsupported') {
    return '<p class="banner">🔇 Acest browser nu poate citi cuvintele cu voce. Încearcă Chrome, Safari sau Edge.</p>';
  }
  if (status === 'no-english') {
    return '<p class="banner">🔇 Nu am găsit o voce în limba engleză pe acest dispozitiv. Instalează o voce „English (UK)” din setările sistemului.</p>';
  }
  return '';
}

function unitCard(unit, u) {
  const open = progress.isLessonOpen(u, 0);
  const inner = `
    <span class="unit-emoji">${open ? unit.emoji : '🔒'}</span>
    <span class="unit-week">Săptămâna ${u + 1}</span>
    <b lang="en">${esc(unit.title)}</b>
    <small>${esc(unit.titleRo)}</small>
    <span class="unit-stars">⭐ ${progress.unitStars(u)} / ${LESSONS.length * MAX_STARS}</span>`;
  return open
    ? `<a class="unit-card" style="--unit:${unit.color}" href="#/unit/${u + 1}">${inner}</a>`
    : `<div class="unit-card locked">${inner}</div>`;
}

function homeScreen() {
  const next = nextUp();
  const finalOpen = progress.isFinalOpen(units.length);
  const finalInner = `
    <span class="unit-emoji">${finalOpen ? '🏆' : '🔒'}</span>
    <span class="unit-week">La sfârșit</span>
    <b>Marele test</b>
    <small>Toate săptămânile</small>
    <span class="unit-stars">${starsHtml(progress.getStars(progress.FINAL_ID))}</span>`;

  app.innerHTML = `
    <div class="page">
      <header class="top">
        <h1>🦊 English Adventure</h1>
        <span class="total">⭐ ${progress.totalStars()}</span>
      </header>
      ${voiceBanner()}
      <a class="btn primary continue" href="${next.href}">▶ Continuă: ${esc(next.label)}</a>
      <div class="units">
        ${units.map(unitCard).join('')}
        ${finalOpen
          ? `<a class="unit-card" style="--unit:#ffd54f" href="#/final">${finalInner}</a>`
          : `<div class="unit-card locked">${finalInner}</div>`}
      </div>
      <footer class="foot"><a href="#/parinti">👨‍👩‍👧 Pentru părinți</a></footer>
    </div>`;
}

/* ---------- unit ---------- */

function lessonRow(u, L, l) {
  const open = progress.isLessonOpen(u, l);
  const inner = `
    <span class="lesson-icon">${open ? L.icon : '🔒'}</span>
    <span class="lesson-name">${l + 1}. ${L.title}<small>${L.desc}</small></span>
    <span class="lesson-stars">${starsHtml(progress.getStars(progress.lessonId(u, l)))}</span>`;
  return open
    ? `<li><a class="lesson-row" href="#/lesson/${u + 1}/${l + 1}">${inner}</a></li>`
    : `<li><div class="lesson-row locked">${inner}</div></li>`;
}

function unitScreen(u) {
  const unit = units[u];
  app.innerHTML = `
    <div class="page" style="--unit:${unit.color}">
      <a class="back" href="#/">← Acasă</a>
      <header class="unit-head">
        <span class="unit-emoji">${unit.emoji}</span>
        <div><h1 lang="en">${esc(unit.title)}</h1><p>Săptămâna ${u + 1} · ${esc(unit.titleRo)}</p></div>
      </header>
      <ol class="lessons">${LESSONS.map((L, l) => lessonRow(u, L, l)).join('')}</ol>
      <h2>📚 Cuvintele mele</h2>
      <p class="hint-text">Apasă pe un cuvânt ca să-l auzi.</p>
      <div class="words">
        ${unit.words.map((w) => `
          <button class="word-chip" data-say="${esc(w.en)}">
            ${picture(w)}<b lang="en">${esc(w.en)}</b><small>${esc(w.ro)}</small>
          </button>`).join('')}
      </div>
      <h2>💬 Propoziții</h2>
      <div class="phrases">
        ${unit.phrases.map((p) => `
          <button class="phrase-row" data-say="${esc(p.en)}">
            <span>🔊</span><span><b lang="en">${esc(p.en)}</b><small>${esc(p.ro)}</small></span>
          </button>`).join('')}
      </div>
    </div>`;
}

/* ---------- lesson runner ---------- */

function runLesson(steps, backHref, onFinish) {
  const mine = ++session;
  let index = 0;
  let mistakes = 0;

  app.innerHTML = `
    <div class="lesson">
      <header class="lesson-bar">
        <a class="close" href="${backHref}" aria-label="Închide lecția">✕</a>
        <div class="bar"><div class="bar-fill"></div></div>
        <span class="count"></span>
      </header>
      <main class="step"></main>
    </div>`;
  const fill = app.querySelector('.bar-fill');
  const count = app.querySelector('.count');
  const stage = app.querySelector('.step');

  const show = () => {
    fill.style.width = `${(index / steps.length) * 100}%`;
    if (index >= steps.length) return onFinish(mistakes);
    const step = steps[index];
    count.textContent = `${index + 1} / ${steps.length}`;
    stage.className = `step step-${step.type}`;
    RENDER[step.type](stage, step, (mistake) => {
      if (mine !== session) return;
      if (mistake) mistakes++;
      index++;
      show();
    });
  };
  show();
}

function resultsScreen({ mistakes, id, again, next, back, badge }) {
  session++;
  const stars = starsFor(mistakes);
  progress.setStars(id, stars);
  sfx.win();
  const cheer = ['Bravo!', 'Foarte bine!', 'Excelent!'][stars - 1];

  app.innerHTML = `
    <div class="page results">
      <div class="stars-big">${'<span>⭐</span>'.repeat(stars)}${'<span class="star-off">⭐</span>'.repeat(MAX_STARS - stars)}</div>
      <h1>${cheer}</h1>
      <p lang="en" class="results-en">Well done! 🎉</p>
      ${badge ? `<p class="badge">Ai câștigat insigna <span>${badge.emoji}</span> <b lang="en">${esc(badge.title)}</b>!</p>` : ''}
      ${stars < MAX_STARS ? '<p class="hint-text">Fără greșeli primești 3 stele. Mai încerci o dată?</p>' : ''}
      <div class="row">
        <button class="btn" data-again>🔁 Încă o dată</button>
        <a class="btn primary" href="${next.href}">${next.label}</a>
      </div>
      <a class="back" href="${back}">← Înapoi</a>
    </div>`;
  app.querySelector('[data-again]').addEventListener('click', again);
}

function lessonScreen(u, l) {
  runLesson(buildLesson(u, l), `#/unit/${u + 1}`, (mistakes) => {
    const last = l === LESSONS.length - 1;
    let next = { href: `#/lesson/${u + 1}/${l + 2}`, label: 'Lecția următoare ➜' };
    if (last) {
      next = u < units.length - 1
        ? { href: `#/unit/${u + 2}`, label: `Săptămâna ${u + 2} ➜` }
        : { href: '#/final', label: 'Marele test ➜' };
    }
    resultsScreen({
      mistakes,
      id: progress.lessonId(u, l),
      again: () => lessonScreen(u, l),
      next,
      back: `#/unit/${u + 1}`,
      badge: last ? units[u] : null,
    });
  });
}

function finalScreen() {
  runLesson(buildFinal(), '#/', (mistakes) => {
    resultsScreen({
      mistakes,
      id: progress.FINAL_ID,
      again: finalScreen,
      next: { href: '#/certificat', label: '🏆 Diploma mea' },
      back: '#/',
    });
  });
}

/* ---------- certificate ---------- */

function certificateScreen() {
  app.innerHTML = `
    <div class="page">
      <div class="certificate">
        <p class="cert-top">🏆</p>
        <h1 lang="en">Certificate</h1>
        <p>Această diplomă este pentru</p>
        <input class="cert-name" placeholder="Scrie numele tău" value="${esc(progress.getName())}" aria-label="Numele tău" maxlength="40">
        <p>care a terminat cu succes cele ${units.length} săptămâni de engleză!</p>
        <p class="cert-stars">⭐ ${progress.totalStars()} stele</p>
        <p lang="en" class="cert-en">English Adventure · Well done!</p>
        <p class="cert-date">${new Date().toLocaleDateString('ro-RO')}</p>
      </div>
      <div class="row no-print">
        <button class="btn" data-print>🖨️ Printează</button>
        <a class="btn primary" href="#/">Acasă</a>
      </div>
    </div>`;
  app.querySelector('.cert-name').addEventListener('input', (e) => progress.setName(e.target.value));
  app.querySelector('[data-print]').addEventListener('click', () => window.print());
}

/* ---------- parents ---------- */

function parentsScreen() {
  const status = voiceStatus();
  const voice = status === 'ok' ? esc(voiceName()) : status === 'loading' ? 'vocea implicită a dispozitivului' : 'indisponibilă';

  app.innerHTML = `
    <div class="page parents">
      <a class="back" href="#/">← Acasă</a>
      <h1>👨‍👩‍👧 Pentru părinți</h1>

      <h2>Cum folosim cursul</h2>
      <ul>
        <li><b>O lecție pe zi</b>, 10–15 minute, 5 zile pe săptămână. O săptămână = o temă.</li>
        <li><b>Întâi ascultăm, apoi citim.</b> Engleza nu se citește cum se scrie, de aceea fiecare cuvânt nou este auzit înainte să apară scris.</li>
        <li>Încurajați copilul să <b>repete cu voce tare</b> după fiecare cuvânt. Butonul 🐢 redă cuvântul mai rar.</li>
        <li>Greșelile sunt normale. Orice lecție poate fi repetată pentru mai multe stele.</li>
        <li>În weekend: recapitulați „Cuvintele mele” din pagina săptămânii.</li>
      </ul>

      <h2>Planul pe ${units.length} săptămâni</h2>
      <p class="hint-text">Fiecare săptămână: 3 lecții de cuvinte noi, 1 lecție de propoziții, 1 recapitulare cu test.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Săpt.</th><th>Tema</th><th>Cuvinte</th><th>Propoziții</th><th>Stele</th></tr></thead>
          <tbody>
            ${units.map((unit, u) => `
              <tr>
                <td>${u + 1}</td>
                <td>${unit.emoji} <b lang="en">${esc(unit.title)}</b><br><small>${esc(unit.titleRo)}</small></td>
                <td lang="en">${unit.words.map((w) => esc(w.en)).join(', ')}</td>
                <td lang="en">${unit.phrases.map((p) => esc(p.en)).join(' ')}</td>
                <td class="nowrap">${progress.unitStars(u)} / ${LESSONS.length * MAX_STARS}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <h2>Setări</h2>
      <p>Voce: <b>${voice}</b> <button class="btn small" data-say="Hello! Let's learn English.">🔊 Test</button></p>
      <label class="check"><input type="checkbox" data-unlock ${progress.getUnlockAll() ? 'checked' : ''}> Deblochează toate lecțiile</label>
      <p><button class="btn small danger" data-reset>🗑️ Șterge progresul</button></p>
    </div>`;

  app.querySelector('[data-unlock]').addEventListener('change', (e) => progress.setUnlockAll(e.target.checked));
  app.querySelector('[data-reset]').addEventListener('click', () => {
    if (!confirm('Sigur ștergi toate stelele și progresul?')) return;
    progress.reset();
    parentsScreen();
  });
}

/* ---------- router ---------- */

function route() {
  session++;
  stopSpeaking();
  window.scrollTo(0, 0);
  const [, name, a, b] = location.hash.split('/');
  const u = Number(a) - 1;
  const l = Number(b) - 1;

  if (name === 'unit' && units[u] && progress.isLessonOpen(u, 0)) return unitScreen(u);
  if (name === 'lesson' && units[u] && LESSONS[l] && progress.isLessonOpen(u, l)) return lessonScreen(u, l);
  if (name === 'final' && progress.isFinalOpen(units.length)) return finalScreen();
  if (name === 'certificat' && progress.getStars(progress.FINAL_ID)) return certificateScreen();
  if (name === 'parinti') return parentsScreen();
  homeScreen();
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-say]');
  if (btn) speak(btn.dataset.say, { slow: btn.hasAttribute('data-slow') });
});

document.addEventListener('pointerdown', () => {
  sfx.unlock();
  unlockSpeech();
}, { once: true });

// Voices arrive asynchronously; refresh the screens that report on them.
onVoicesChanged(() => {
  if (!app.querySelector('.lesson, .results, .certificate')) route();
});

window.addEventListener('hashchange', route);
route();
