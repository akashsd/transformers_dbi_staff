import { pipeline } from '@huggingface/transformers';
import { corpus } from '../corpus.js';
import embeddings from '../corpus-embeddings.json';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const DTYPE = 'q8'; // must match the dtype used to precompute embeddings
const DEFAULT_QUERY = 'fans fighting outside the stadium';

const docVectors = embeddings.vectors;
let extractorPromise;

function getExtractor(onProgress) {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', MODEL_ID, {
      dtype: DTYPE,
      progress_callback: onProgress,
    }).catch((error) => {
      extractorPromise = undefined;
      throw error;
    });
  }
  return extractorPromise;
}

function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

// Common function words excluded so keyword matching/highlighting reflects
// meaningful terms, not incidental overlap on "a", "the", "for", etc.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'was', 'were', 'be', 'been', 'being',
  'to', 'of', 'in', 'on', 'at', 'by', 'for', 'from', 'with', 'without', 'after',
  'before', 'into', 'near', 'out', 'up', 'down', 'over', 'under', 'their', 'its',
  'it', 'this', 'that', 'my', 'your', 'i', 'we', 'they', 'he', 'she',
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !STOPWORDS.has(word));
}

function keywordScore(terms, text) {
  if (terms.length === 0) {
    return 0;
  }
  const lower = text.toLowerCase();
  let hits = 0;
  for (const term of terms) {
    if (lower.includes(term)) {
      hits += 1;
    }
  }
  return hits / terms.length;
}

function highlight(text, terms) {
  const frag = document.createDocumentFragment();
  if (terms.length === 0) {
    frag.append(text);
    return frag;
  }
  const pattern = new RegExp(`\\b(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index;
    if (start > last) {
      frag.append(text.slice(last, start));
    }
    const mark = document.createElement('mark');
    mark.textContent = match[0];
    frag.append(mark);
    last = start + match[0].length;
  }
  if (last < text.length) {
    frag.append(text.slice(last));
  }
  return frag;
}

function renderResults(root, items, terms, { showBar }) {
  root.replaceChildren(
    ...items.map((item, rank) => {
      const row = document.createElement('div');
      row.className = 'result';
      const head = document.createElement('div');
      head.className = 'result-head';
      const num = document.createElement('span');
      num.className = 'result-rank';
      num.textContent = String(rank + 1);
      const score = document.createElement('span');
      score.className = 'result-score';
      score.textContent = item.score.toFixed(2);
      head.append(num, score);
      const body = document.createElement('p');
      body.className = 'result-text';
      body.append(highlight(item.text, terms));
      row.append(head, body);
      if (showBar) {
        const bar = document.createElement('span');
        bar.className = 'result-bar';
        bar.style.setProperty('--v', `${Math.max(0, Math.min(1, item.score)) * 100}%`);
        row.append(bar);
      }
      return row;
    }),
  );
}

function topK(scored, key, k = 5) {
  return [...scored]
    .sort((a, b) => b[key] - a[key])
    .slice(0, k)
    .map((item) => ({ text: item.text, score: item[key] }));
}

export function renderSemanticSearchPanel(root) {
  const urlQuery = new URL(window.location.href).searchParams.get('q');
  root.innerHTML = `
    <div class="panel-head">
      <div>
        <span class="tag">Panel 3</span>
        <h2>Semantic Search</h2>
        <p class="lead">Meaning beats keywords. Search for an <em>idea</em> and watch it find docs that share none of your words.</p>
      </div>
    </div>
    <div class="stack">
      <label class="field">
        <span class="field-label">Search 40 synthetic 911-call summaries from a FIFA World Cup event</span>
        <div class="field-row">
          <input type="text" data-query autocomplete="off" spellcheck="false" />
          <button type="button" data-run>Search</button>
          <button type="button" class="ghost" data-copy title="Copy a link with this query">Link</button>
        </div>
      </label>
      <div class="status" data-status></div>
      <div class="cols">
        <div class="col">
          <div class="col-head"><span class="col-badge keyword">Keyword</span><span class="col-sub">word overlap</span></div>
          <div data-keyword class="results"></div>
        </div>
        <div class="col">
          <div class="col-head"><span class="col-badge semantic">Semantic</span><span class="col-sub">meaning similarity</span></div>
          <div data-semantic class="results"></div>
        </div>
      </div>
      <details class="corpus">
        <summary><span>Browse the 40 documents</span></summary>
        <div class="corpus-list">
          ${corpus.map((doc, i) => `<div class="corpus-item"><span>${i + 1}</span>${doc}</div>`).join('')}
        </div>
      </details>
      <p class="hint"><strong>Try this:</strong> describe a situation without using any word that appears in the docs — e.g. "a visitor grew faint from being overheated for hours."</p>
    </div>
  `;

  const queryInput = root.querySelector('[data-query]');
  const runButton = root.querySelector('[data-run]');
  const copyButton = root.querySelector('[data-copy]');
  const status = root.querySelector('[data-status]');
  const keywordTarget = root.querySelector('[data-keyword]');
  const semanticTarget = root.querySelector('[data-semantic]');

  queryInput.value = urlQuery || DEFAULT_QUERY;

  function setStatus(text, tone = '') {
    status.textContent = text;
    status.dataset.tone = tone;
  }

  function runKeyword(query) {
    const terms = tokenize(query);
    const scored = corpus.map((text) => ({ text, keyword: keywordScore(terms, text) }));
    renderResults(keywordTarget, topK(scored, 'keyword'), terms, { showBar: false });
    return terms;
  }

  async function runSemantic(query, terms) {
    const extractor = await getExtractor((progress) => {
      if (progress?.status === 'progress') {
        const raw = Number(progress.progress) || 0;
        const pct = Math.max(0, Math.min(100, Math.round(raw > 1 ? raw : raw * 100)));
        setStatus(`Loading the embedding model (25 MB, once)… ${pct}%`, 'load');
      }
    });
    const output = await extractor(query, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data);
    const scored = corpus.map((text, index) => ({ text, semantic: dot(queryVector, docVectors[index]) }));
    renderResults(semanticTarget, topK(scored, 'semantic'), terms, { showBar: true });
  }

  async function search() {
    const query = queryInput.value.trim();
    if (!query) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('q', query);
    window.history.replaceState({}, '', url);

    const terms = runKeyword(query); // instant, no model
    runButton.disabled = true;
    setStatus('Scoring by meaning…', 'load');
    try {
      await runSemantic(query, terms);
      setStatus('Ready. Keyword and semantic results are ranked independently.', 'ok');
    } catch (error) {
      semanticTarget.innerHTML = '';
      setStatus(`Semantic model failed to load: ${error.message}`, 'error');
    } finally {
      runButton.disabled = false;
    }
  }

  runButton.addEventListener('click', search);
  queryInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      search();
    }
  });
  copyButton.addEventListener('click', async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('q', queryInput.value.trim());
    try {
      await navigator.clipboard.writeText(url.toString());
      setStatus('Shareable link copied — paste it in chat.', 'ok');
    } catch (error) {
      setStatus(`Could not copy link: ${error.message}`, 'error');
    }
  });

  function activate() {
    runKeyword(queryInput.value.trim()); // show keyword side immediately
    setStatus('Press Search to rank by meaning (loads a 25 MB model once).', '');
  }

  return { activate };
}
