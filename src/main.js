import './env.js';
import './styles.css';
import { renderTokenizerPanel } from './panels/tokenizer.js';
import { renderAttentionPanel } from './panels/attention.js';
import { renderSemanticSearchPanel } from './panels/semantic-search.js';
import { renderNextTokenPanel } from './panels/next-token.js';

const app = document.querySelector('#app');
const currentUrl = new URL(window.location.href);

const panels = [
  { id: 'tokenizer', label: 'Panel 1: Tokenizer' },
  { id: 'attention', label: 'Panel 2: Attention' },
  { id: 'semantic-search', label: 'Panel 3: Semantic Search' },
  { id: 'next-token', label: 'Panel 4: Next Token' },
];

app.innerHTML = `
  <div class="page-shell">
    <header class="hero">
      <div>
        <p class="eyebrow">Built for DBI's transformers show-and-tell</p>
        <h1>Transformers, but interactive.</h1>
        <p class="hero-copy">A browser-only demo for tokenizer boundaries, attention, semantic search, and next-token prediction.</p>
      </div>
      <div class="hero-note">
        <strong>How to use in Zoom</strong>
        <p>Open the page early, keep it in a tab, and jump between panels live when the slide deck cues you.</p>
      </div>
    </header>
    <nav class="panel-nav" aria-label="Panel navigation">
      ${panels
        .map(
          (panel) =>
            `<button type="button" data-panel-nav="${panel.id}">${panel.label}</button>`,
        )
        .join('')}
    </nav>
    <main class="panels">
      ${panels.map((panel) => `<section class="panel" id="panel-${panel.id}"></section>`).join('')}
    </main>
    <footer class="footer">
      <p>Built for DBI's transformers show-and-tell.</p>
      <p><a href="https://github.com/" target="_blank" rel="noreferrer">GitHub repo</a> · <span class="footer-url">${currentUrl.origin}</span></p>
    </footer>
  </div>
`;

renderTokenizerPanel(document.querySelector('#panel-tokenizer'));
renderAttentionPanel(document.querySelector('#panel-attention'));
renderSemanticSearchPanel(document.querySelector('#panel-semantic-search'));
renderNextTokenPanel(document.querySelector('#panel-next-token'));

const navButtons = [...document.querySelectorAll('[data-panel-nav]')];
const panelSections = new Map(panels.map((panel) => [panel.id, document.getElementById(`panel-${panel.id}`)]));

function showPanel(id, { updateHash = true } = {}) {
  const targetId = panelSections.has(id) ? id : panels[0].id;

  panelSections.forEach((section, sectionId) => {
    section.hidden = sectionId !== targetId;
  });
  navButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.panelNav === targetId);
  });

  if (updateHash) {
    const url = new URL(window.location.href);
    url.hash = targetId;
    window.history.replaceState({}, '', url);
  }

  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => showPanel(button.dataset.panelNav));
});

const initialPanel = currentUrl.hash.slice(1) || (currentUrl.searchParams.has('q') ? 'semantic-search' : panels[0].id);
showPanel(initialPanel, { updateHash: false });
