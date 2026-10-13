# English Adventure 🦊

An interactive English course for a Romanian-speaking second-grader who is a complete beginner.
Static site: plain HTML, CSS and JavaScript, no build step, no dependencies. Works on phone, tablet and desktop.

- Instructions and translations are in **Romanian**; the target language is **British English**.
- **Pictures** are emoji, **speech** is the browser's built-in English voice, feedback sounds are generated in the browser. There are no asset files.
- Progress (stars) is saved in the browser's `localStorage`, per device.

## Learning plan

**Rhythm:** one lesson a day, 10–15 minutes, five days a week. One week = one theme.

| Day | Lesson | What happens |
|-----|--------|--------------|
| 1 | Cuvinte noi 1 | warm-up from earlier weeks, 4–5 new words: listen → pick the picture → pick the written word |
| 2 | Cuvinte noi 2 | quick recall of day 1, next 4 words, memory game |
| 3 | Cuvinte noi 3 | remaining words, spelling (from week 3), Romanian → English |
| 4 | Propoziții | phrases: listen, understand, choose, build the sentence (from week 4) |
| 5 | Recapitulare | mixed test of the week plus words from earlier weeks, unit badge |

**Principles**

- **Listen first, read later.** Romanian is spelled as it sounds; English is not. Each new word is heard with its picture before the spelling is shown.
- **Small steps:** hear → recognise the picture → recognise the written word → spell → use in a phrase.
- **Spaced review:** lessons open with items from earlier lessons and weeks.
- **Pronunciation tips in Romanian** for sounds Romanian does not have (`th`, `w`, long vowels, silent letters).
- **No pressure:** no timers; a wrong answer means "try again". Fewer mistakes earn more stars, and any lesson can be replayed.

**Syllabus (8 weeks, 92 words, 59 phrases)**

| Week | Theme | Words | Phrases and grammar |
|------|-------|-------|---------------------|
| 1 | Hello! | hello, goodbye, yes, no, please, thank you, good morning, good night, boy, girl | What's your name? My name is… How are you? I'm fine, thank you. |
| 2 | Colours | red, blue, yellow, green, orange, pink, purple, black, white, brown, grey | What colour is it? It's red. Is it yellow? Yes, it is. / No, it isn't. |
| 3 | Numbers | one … twelve | How many? How old are you? I'm seven. Two boys. |
| 4 | Family | mum, dad, brother, sister, grandma, grandpa, baby, family, friend, me | This is my mum. I've got a sister. Who is this? |
| 5 | Animals | cat, dog, bird, fish, rabbit, horse, cow, pig, sheep, duck, lion, elephant, monkey | It's a cat. It's an elephant (a / an). Two cats (plural -s). |
| 6 | School | book, pen, pencil, ruler, scissors, bag, chair, door, clock, teacher, school | Have you got a pen? Yes, I have. Open your book. Sit down. Stand up. |
| 7 | My body | head, hair, eyes, ear, nose, mouth, hand, arm, leg, foot, big, small | I've got two eyes. Touch your nose. The elephant is big. |
| 8 | Food | apple, banana, bread, milk, water, juice, egg, cheese, cake, pizza, chicken, hungry, thirsty | I like apples. I don't like cheese. Do you like pizza? Yes, I do. |
| End | Marele test | everything, mixed | printable certificate |

The same plan, with the child's progress, is shown in the site under **Pentru părinți**.

## Exercise types

| Type | Child does |
|------|-----------|
| Flashcard | hears the word, sees picture + Romanian, then the spelling; 🐢 replays slowly |
| Listen & pick | hears a word, taps the right picture |
| Read & pick | sees a picture, taps the right written word |
| Memory | matches picture cards with word cards |
| Spell | taps letters in order to write the word (hint after two misses) |
| Sentence | taps words in order to build a phrase |
| Translate | Romanian → English, or hears English and picks the Romanian meaning |

Lessons are generated from each unit's word and phrase lists, so every replay has different questions.

## Run locally

ES modules need a web server (opening `index.html` from disk will not work):

```bash
python3 -m http.server 8123
```

Then open <http://localhost:8123>.

## Deploy to GitHub Pages

1. Create an empty repository on GitHub.
2. Push this folder:
   ```bash
   git remote add origin git@github.com:<user>/<repo>.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, branch `main`, folder `/ (root)`.
4. After a minute the site is at `https://<user>.github.io/<repo>/`.

All paths are relative, so it works under the repository sub-path. `.nojekyll` tells Pages to serve the files as they are.

## Add or change content

Each week is one file in `js/data/` and is listed in `js/data/index.js`.

```js
words: [
  { en: 'sheep', ro: 'oaie', emoji: '🐑', tip: 'ee = „i” lung: „șiip”.' },
  { en: 'red', ro: 'roșu', color: '#e53935' },          // colour swatch instead of emoji
  { en: 'three', ro: 'trei', num: 3 },                  // number picture
  { en: 'yes', ro: 'da', emoji: '✅', cap: true },       // cap: show Romanian under an abstract picture
],
phrases: [{ en: "It's a cat.", ro: 'Este o pisică.' }],
```

Every word needs a picture that no other word uses. Check the content after editing:

```bash
node tools/validate.mjs
```

## Voice

The site uses the device's text-to-speech and prefers a British (`en-GB`) voice. Quality depends on the device:
good on iOS, macOS, Android and Chrome; if no English voice is installed the home page shows a warning.
The voice in use can be tested under **Pentru părinți → Setări**.

## Layout

```
index.html              page shell
css/style.css           all styles
js/app.js               router and screens (home, unit, lesson runner, results, certificate, parents)
js/lesson-builder.js    builds the exercise list for each lesson
js/exercises/           flashcard, choice (4 modes), memory, order (spell + sentence)
js/data/                course content, one file per week
js/speech.js            voice selection and speaking
js/sfx.js               feedback sounds (Web Audio)
js/progress.js          stars and unlocks in localStorage
tools/validate.mjs      content checks
```
