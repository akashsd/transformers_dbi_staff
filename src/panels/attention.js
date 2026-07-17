import data from '../data/attention.json';

// No live model: attention weights here are a hand-authored schematic
// (the ONNX model exports don't expose attention). It illustrates the concept
// — which tokens a word "looks at" — rather than reproducing a specific head.
const examples = data.examples;
const SVG_NS = 'http://www.w3.org/2000/svg';

function renderChips(row, tokens, prefix, selected) {
  row.replaceChildren(
    ...tokens.map((token, index) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `atoken${index === selected && prefix === 'src' ? ' is-sel' : ''}`;
      chip.dataset.index = String(index);
      chip.dataset.prefix = prefix;
      chip.textContent = token;
      return chip;
    }),
  );
}

function centers(row, stageRect) {
  return [...row.querySelectorAll('.atoken')].map((chip) => {
    const rect = chip.getBoundingClientRect();
    return { x: rect.left - stageRect.left + rect.width / 2, y: rect.top - stageRect.top + rect.height / 2 };
  });
}

export function renderAttentionPanel(root) {
  root.innerHTML = `
    <div class="panel-head">
      <div>
        <span class="tag">Panel 2</span>
        <h2>Attention</h2>
        <p class="lead">Every token can look at every other token. That's how "she" gets tied back to "officer". Click a word to see where it looks.</p>
      </div>
    </div>
    <div class="stack">
      <div class="chips-row" data-presets>
        <span class="chips-row-label">Example:</span>
        ${examples
          .map((ex, i) => `<button type="button" class="pill${i === 0 ? ' is-on' : ''}" data-ex="${i}">${ex.label}</button>`)
          .join('')}
      </div>
      <div class="attn-stage" data-stage>
        <div class="attn-row"><span class="attn-tag">looks from</span><div class="attn-strip" data-src></div></div>
        <div class="attn-row"><span class="attn-tag">looks at</span><div class="attn-strip" data-dst></div></div>
        <svg class="attn-lines" data-lines aria-hidden="true"></svg>
      </div>
      <p class="hint" data-hint></p>
      <p class="canned-note">Illustrative schematic — a hand-authored view of what attention captures, not live model output.</p>
    </div>
  `;

  const presetRow = root.querySelector('[data-presets]');
  const stage = root.querySelector('[data-stage]');
  const srcRow = root.querySelector('[data-src]');
  const dstRow = root.querySelector('[data-dst]');
  const svg = root.querySelector('[data-lines]');
  const hintEl = root.querySelector('[data-hint]');

  let current = 0;
  let selected = 0;

  function draw() {
    const ex = examples[current];
    const weights = ex.weights[selected] || [];
    const stageRect = stage.getBoundingClientRect();
    const src = centers(srcRow, stageRect);
    const dst = centers(dstRow, stageRect);
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const from = src[selected];
    if (!from) {
      svg.replaceChildren();
      return;
    }
    const lines = weights.map((weight, j) => {
      const to = dst[j];
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y);
      line.setAttribute('stroke', 'url(#attn-grad)');
      line.setAttribute('stroke-width', String(0.5 + weight * 16));
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('opacity', String(0.15 + weight * 1.4));
      return line;
    });
    const defs = document.createElementNS(SVG_NS, 'defs');
    defs.innerHTML =
      '<linearGradient id="attn-grad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#4da3ff"/><stop offset="1" stop-color="#8ec900"/></linearGradient>';
    svg.replaceChildren(defs, ...lines);

    // emphasise the strongest target
    let best = 0;
    weights.forEach((weight, j) => {
      if (weight > weights[best]) best = j;
    });
    dstRow.querySelectorAll('.atoken').forEach((chip, j) => {
      chip.classList.toggle('is-hot', j === best && j !== selected);
    });
    hintEl.innerHTML = `<strong>"${ex.tokens[selected]}"</strong> attends most to <strong>"${ex.tokens[best]}"</strong>.`;
  }

  function loadExample(index) {
    current = index;
    const ex = examples[index];
    selected = ex.hintTokenIndex ?? 0;
    renderChips(srcRow, ex.tokens, 'src', selected);
    renderChips(dstRow, ex.tokens, 'dst', selected);
    presetRow.querySelectorAll('[data-ex]').forEach((button) => {
      button.classList.toggle('is-on', Number(button.dataset.ex) === index);
    });
    requestAnimationFrame(draw);
  }

  srcRow.addEventListener('click', (event) => {
    const chip = event.target.closest('.atoken');
    if (!chip) {
      return;
    }
    selected = Number(chip.dataset.index);
    srcRow.querySelectorAll('.atoken').forEach((c, i) => c.classList.toggle('is-sel', i === selected));
    draw();
  });
  presetRow.querySelectorAll('[data-ex]').forEach((button) => {
    button.addEventListener('click', () => loadExample(Number(button.dataset.ex)));
  });
  window.addEventListener('resize', draw);

  return {
    activate() {
      loadExample(0);
    },
  };
}
