import './env.js';
import './styles.css';
import { renderTokenizerPanel } from './panels/tokenizer.js';
import { renderAttentionPanel } from './panels/attention.js';
import { renderSemanticSearchPanel } from './panels/semantic-search.js';
import { renderNextTokenPanel } from './panels/next-token.js';

const app = document.querySelector('#app');
const currentUrl = new URL(window.location.href);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const panels = [
  { id: 'tokenizer', icon: '🔤', label: 'Tokenizer', render: renderTokenizerPanel },
  { id: 'attention', icon: '🕸️', label: 'Attention', render: renderAttentionPanel },
  { id: 'semantic-search', icon: '🔍', label: 'Semantic Search', render: renderSemanticSearchPanel },
  { id: 'next-token', icon: '🔮', label: 'Next Token', render: renderNextTokenPanel },
];

app.innerHTML = `
  <div class="aurora" aria-hidden="true">
    <span class="aurora-blob aurora-blue"></span>
    <span class="aurora-blob aurora-green"></span>
    <span class="aurora-blob aurora-orange"></span>
  </div>
  <div class="page-shell">
    <div class="sticky-header">
      <header class="hero">
        <div>
          <p class="eyebrow">Built for DBI's transformers show-and-tell</p>
          <h1>Transformers, but <span class="gradient-text">interactive.</span></h1>
          <p class="hero-copy">A browser-only demo for tokenizer boundaries, attention, semantic search, and next-token prediction.</p>
        </div>
        <div class="hero-note">
          <strong>How to use in Zoom</strong>
          <p>Open the page early, keep it in a tab, and jump between panels live when the slide deck cues you.</p>
          <button type="button" class="secondary preload-btn" data-preload>Preload all models</button>
        </div>
      </header>
      <nav class="panel-nav" aria-label="Panel navigation">
        <span class="panel-nav-indicator" data-nav-indicator aria-hidden="true"></span>
        ${panels
          .map(
            (panel, index) =>
              `<button type="button" class="panel-nav-btn" data-panel-nav="${panel.id}" data-index="${index}">
                <span class="panel-nav-icon" aria-hidden="true">${panel.icon}</span>
                <span>Panel ${index + 1}: ${panel.label}</span>
              </button>`,
          )
          .join('')}
      </nav>
    </div>
    <main class="panels">
      ${panels.map((panel) => `<section class="panel" id="panel-${panel.id}"></section>`).join('')}
    </main>
    <footer class="footer">
      <p>Built for DBI's transformers show-and-tell.</p>
      <p><a href="https://github.com/" target="_blank" rel="noreferrer">GitHub repo</a> · <span class="footer-url">${currentUrl.origin}</span></p>
    </footer>
  </div>
`;

const panelControllers = new Map(
  panels.map((panel) => [panel.id, panel.render(document.getElementById(`panel-${panel.id}`)) || {}]),
);

const navButtons = [...document.querySelectorAll('[data-panel-nav]')];
const panelSections = new Map(panels.map((panel) => [panel.id, document.getElementById(`panel-${panel.id}`)]));
const navIndicator = document.querySelector('[data-nav-indicator]');
const preloadButton = document.querySelector('[data-preload]');
const activated = new Set();

function moveIndicator(button) {
  if (!button || !navIndicator) {
    return;
  }
  navIndicator.style.width = `${button.offsetWidth}px`;
  navIndicator.style.height = `${button.offsetHeight}px`;
  navIndicator.style.transform = `translate(${button.offsetLeft}px, ${button.offsetTop}px)`;
}

function activatePanel(id) {
  if (activated.has(id)) {
    return;
  }
  activated.add(id);
  panelControllers.get(id)?.activate?.();
}

function applyPanelState(targetId, { updateHash }) {
  panelSections.forEach((section, sectionId) => {
    section.hidden = sectionId !== targetId;
  });
  navButtons.forEach((button) => {
    const isActive = button.dataset.panelNav === targetId;
    button.classList.toggle('is-active', isActive);
    if (isActive) {
      moveIndicator(button);
    }
  });

  if (updateHash) {
    const url = new URL(window.location.href);
    url.hash = targetId;
    window.history.replaceState({}, '', url);
  }

  activatePanel(targetId);
}

function showPanel(id, { updateHash = true } = {}) {
  const targetId = panelSections.has(id) ? id : panels[0].id;

  if (!prefersReducedMotion && document.startViewTransition) {
    document.startViewTransition(() => applyPanelState(targetId, { updateHash }));
  } else {
    applyPanelState(targetId, { updateHash });
  }
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => showPanel(button.dataset.panelNav));
});

preloadButton.addEventListener('click', () => {
  preloadButton.disabled = true;
  preloadButton.textContent = 'Preloading...';
  panels.forEach((panel) => activatePanel(panel.id));
  setTimeout(() => {
    preloadButton.textContent = 'All models preloading';
  }, 400);
});

window.addEventListener('resize', () => {
  moveIndicator(navButtons.find((button) => button.classList.contains('is-active')));
});

const initialPanel = currentUrl.hash.slice(1) || (currentUrl.searchParams.has('q') ? 'semantic-search' : panels[0].id);
applyPanelState(panelSections.has(initialPanel) ? initialPanel : panels[0].id, { updateHash: false });
