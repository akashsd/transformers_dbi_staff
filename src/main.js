import './env.js';
import './styles.css';
import { renderTokenizerPanel } from './panels/tokenizer.js';
import { renderAttentionPanel } from './panels/attention.js';
import { renderSemanticSearchPanel } from './panels/semantic-search.js';
import { renderNextTokenPanel } from './panels/next-token.js';

const app = document.querySelector('#app');
const currentUrl = new URL(window.location.href);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const panels = [
  { id: 'tokenizer', label: 'Tokenizer', render: renderTokenizerPanel },
  { id: 'attention', label: 'Attention', render: renderAttentionPanel },
  { id: 'semantic-search', label: 'Semantic Search', render: renderSemanticSearchPanel },
  { id: 'next-token', label: 'Next Token', render: renderNextTokenPanel },
];

app.innerHTML = `
  <div class="bg" aria-hidden="true"></div>
  <div class="shell">
    <header class="masthead">
      <div class="masthead-main">
        <span class="tag">DBI Staff</span>
        <h1>Transformers, <span class="accent">but you can poke them.</span></h1>
        <p class="sub">A browser-only demo — no server, no sign-in. Keep it open in a tab during the Zoom and jump in when the slide cues you.</p>
      </div>
    </header>
    <nav class="tabs" role="tablist" aria-label="Panels">
      <span class="tabs-pill" data-pill aria-hidden="true"></span>
      ${panels
        .map(
          (panel, index) =>
            `<button type="button" class="tab" role="tab" data-tab="${panel.id}" id="tab-${panel.id}" aria-controls="panel-${panel.id}">
              <span class="tab-index">${index + 1}</span>${panel.label}
            </button>`,
        )
        .join('')}
    </nav>
    <main class="stagearea">
      ${panels
        .map(
          (panel) =>
            `<section class="panel" id="panel-${panel.id}" role="tabpanel" aria-labelledby="tab-${panel.id}"></section>`,
        )
        .join('')}
    </main>
    <footer class="foot">
      <span>Built for DBI Staff · synthetic data only</span>
      <a href="https://github.com/akashsd/transformers_dbi_staff" target="_blank" rel="noreferrer">GitHub repo ↗</a>
    </footer>
  </div>
`;

const controllers = new Map(
  panels.map((panel) => [panel.id, panel.render(document.getElementById(`panel-${panel.id}`)) || {}]),
);
const tabs = [...app.querySelectorAll('[data-tab]')];
const sections = new Map(panels.map((panel) => [panel.id, document.getElementById(`panel-${panel.id}`)]));
const pill = app.querySelector('[data-pill]');
const activated = new Set();

function movePill(tab) {
  if (!tab) {
    return;
  }
  pill.style.width = `${tab.offsetWidth}px`;
  pill.style.transform = `translateX(${tab.offsetLeft}px)`;
}

function apply(id) {
  sections.forEach((section, sectionId) => {
    section.hidden = sectionId !== id;
  });
  tabs.forEach((tab) => {
    const active = tab.dataset.tab === id;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    if (active) {
      movePill(tab);
    }
  });
  if (!activated.has(id)) {
    activated.add(id);
    controllers.get(id)?.activate?.();
  }
}

function show(id) {
  const target = sections.has(id) ? id : panels[0].id;
  const url = new URL(window.location.href);
  url.hash = target;
  window.history.replaceState({}, '', url);
  if (!reducedMotion && document.startViewTransition) {
    document.startViewTransition(() => apply(target));
  } else {
    apply(target);
  }
}

tabs.forEach((tab) => tab.addEventListener('click', () => show(tab.dataset.tab)));
window.addEventListener('resize', () => movePill(tabs.find((tab) => tab.classList.contains('is-active'))));

const initial = currentUrl.hash.slice(1) || (currentUrl.searchParams.has('q') ? 'semantic-search' : panels[0].id);
apply(sections.has(initial) ? initial : panels[0].id);
