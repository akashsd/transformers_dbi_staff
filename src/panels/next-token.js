import data from '../data/next-token.json';

// No live model: these are real GPT-2 predictions captured once at build time
// (see tools/precompute_panels.mjs) and frozen into JSON.
const examples = data.examples;

function renderBars(root, predictions) {
  const max = Math.max(...predictions.map((p) => p.percent), 1);
  root.replaceChildren(
    ...predictions.map((pred) => {
      const row = document.createElement('div');
      row.className = 'bar';
      const label = document.createElement('span');
      label.className = 'bar-token';
      label.textContent = pred.token.trim() || '␣';
      const track = document.createElement('span');
      track.className = 'bar-track';
      const fill = document.createElement('span');
      fill.className = 'bar-fill';
      fill.style.width = `${(pred.percent / max) * 100}%`;
      track.append(fill);
      const value = document.createElement('span');
      value.className = 'bar-value';
      value.textContent = `${pred.percent.toFixed(1)}%`;
      row.append(label, track, value);
      return row;
    }),
  );
}

export function renderNextTokenPanel(root) {
  root.innerHTML = `
    <div class="panel-head">
      <div>
        <span class="tag">Panel 4</span>
        <h2>Guess the Next Token</h2>
        <p class="lead">A language model just predicts the <em>next token</em>, over and over. Watch it stay fluent even when it's flat wrong.</p>
      </div>
    </div>
    <div class="stack">
      <div class="chips-row" data-presets>
        <span class="chips-row-label">Example:</span>
        ${examples
          .map(
            (ex, i) =>
              `<button type="button" class="pill${i === 0 ? ' is-on' : ''}" data-ex="${i}">${ex.label}</button>`,
          )
          .join('')}
      </div>
      <div class="prompt-line">
        <span data-prompt></span><span class="caret">▌</span>
      </div>
      <div class="bars" data-bars></div>
      <p class="hint" data-hint></p>
      <p class="canned-note">Frozen GPT-2 output — captured once so the page needs no model download.</p>
    </div>
  `;

  const presetRow = root.querySelector('[data-presets]');
  const promptEl = root.querySelector('[data-prompt]');
  const barsEl = root.querySelector('[data-bars]');
  const hintEl = root.querySelector('[data-hint]');

  function select(index) {
    const ex = examples[index];
    promptEl.textContent = ex.prompt + ' ';
    renderBars(barsEl, ex.predictions);
    presetRow.querySelectorAll('[data-ex]').forEach((button) => {
      button.classList.toggle('is-on', Number(button.dataset.ex) === index);
    });
    hintEl.innerHTML =
      ex.label === 'Confidently wrong'
        ? '<strong>Notice:</strong> it offers recent years with total confidence — every one wrong. Fluent ≠ correct.'
        : '<strong>Notice:</strong> no single "answer" — just a probability spread over plausible next words.';
  }

  presetRow.querySelectorAll('[data-ex]').forEach((button) => {
    button.addEventListener('click', () => select(Number(button.dataset.ex)));
  });

  return {
    activate() {
      select(0);
    },
  };
}
