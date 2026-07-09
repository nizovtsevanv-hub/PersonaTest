# English Partner Profile — Speaking & Personality Map

A premium, mobile-first, **bilingual (English + Russian)** interactive questionnaire for
personalised 1:1 conversational English lessons.

Students complete it as homework. While answering, they meet useful active English phrases
(*speaking bottleneck, personal agency, anchor reference, next action, structured answer…*) and,
at the end, receive a personal **Student Speaking Profile** the teacher can use to plan the first
lessons.

> This is **not** a psychological test and **not** a diagnosis. It is a personal learning map that
> guides the student's thinking.

## Features

- English-first questions with a **“Show Russian”** toggle under each question (and per-option `RU` translate).
- 27 questions across 9 short sections: goals, speaking bottleneck, personality, interests,
  learning style, personal agency, confidence, structured speaking, and AI-native learning.
- Answer types: checkboxes, single-choice, limited multi-select (choose up to 3), 1–5 rating
  scale with labels, short & long text, and optional **“Other”** fields.
- **Progress bar** with percentage, **section navigation** chips, and Previous / Next buttons.
- **Autosave to `localStorage`** plus an explicit **Save** button. Answers persist between visits.
- Final **Student Speaking Profile** generated in **both English and Russian**, with recommended
  first 3 lessons, active vocabulary tags, and a teacher note.
- **Export** the profile as **TXT** or **JSON**, and **Print / Save as PDF**.
- Clean, soft premium UI. Accent colours: **emerald, navy, soft violet**.

## Tech

React + Vite. No backend, no authentication, no external paid services. State is kept in the
browser via `localStorage`.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Deployment (GitHub Pages)

The app is served from a project sub-path, so `vite.config.js` sets `base: '/PersonaTest/'`
(override with the `BASE_PATH` env var if the repository is renamed).

Deployment is automated by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): every push
to `main` builds the project and publishes `dist/` to GitHub Pages. A `404.html` copy and a
`.nojekyll` marker are added so the SPA loads correctly and Jekyll doesn't strip files.

**One-time setup:** in the repository, go to **Settings → Pages → Build and deployment** and set
**Source** to **GitHub Actions**. After that, the site is available at
<https://nizovtsevanv-hub.github.io/PersonaTest/>.

## Project structure

```
index.html
package.json
vite.config.js
src/
  main.jsx        # React entry point
  App.jsx         # header, intro, sections, progress, nav, inputs, report, exports
  questions.js    # bilingual questionnaire data + active vocabulary
  report.js       # builds the bilingual Student Speaking Profile + TXT export
  styles.css      # mobile-first premium styles (emerald / navy / violet)
```
