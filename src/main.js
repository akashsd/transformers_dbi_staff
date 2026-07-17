import './styles.css';
import { renderTokenizerPanel } from './panels/tokenizer.js';
import { renderAttentionPanel } from './panels/attention.js';
import { renderSemanticSearchPanel } from './panels/semantic-search.js';
import { renderNextTokenPanel } from './panels/next-token.js';

const app = document.querySelector('#app');
const currentUrl = new URL(window.location.href);

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
      <a href="#panel-tokenizer" data-panel-nav>Panel 1: Tokenizer</a>
      <a href="#panel-attention" data-panel-nav>Panel 2: Attention</a>
      <a href="#panel-semantic-search" data-panel-nav>Panel 3: Semantic Search</a>
      <a href="#panel-next-token" data-panel-nav>Panel 4: Next Token</a>
    </nav>
    <main class="panels">
      <section class="panel" id="panel-tokenizer"></section>
      <section class="panel" id="panel-attention"></section>
      <section class="panel" id="panel-semantic-search"></section>
      <section class="panel" id="panel-next-token"></section>
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

document.querySelectorAll('[data-panel-nav]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href')?.slice(1);
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
