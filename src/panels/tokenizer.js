import { AutoTokenizer } from '@huggingface/transformers';

const MODEL_ID = 'Xenova/gpt2';
const PRESETS = ['strawberry', 'antidisestablishmentarianism', 'Weinerschnitzel 🌭'];

let tokenizerPromise;

// Tokenization is pure JavaScript — this downloads a few small vocab files,
// not the GPT-2 weights, and never touches the WASM runtime.
function getTokenizer() {
  if (!tokenizerPromise) {
    tokenizerPromise = AutoTokenizer.from_pretrained(MODEL_ID);
  }
  return tokenizerPromise;
}

function renderTokens(root, tokens) {
  root.replaceChildren(
    ...tokens.map((token, index) => {
      const chip = document.createElement('span');
      chip.className = `chip${index % 2 ? ' chip-alt' : ''}`;
      // GPT-2 marks a leading space with 'Ġ' — show it as a visible space
      chip.textContent = token.replace(/Ġ/g, '␣');
      return chip;
    }),
  );
}

export function renderTokenizerPanel(root) {
  root.innerHTML = `
    <div class="panel-head">
      <div>
        <span class="tag">Panel 1</span>
        <h2>Tokenizer</h2>
        <p class="lead">Models don't read words. They read <em>tokens</em> — chunks that often split mid-word.</p>
      </div>
    </div>
    <div class="stack">
      <label class="field">
        <span class="field-label">Type anything</span>
        <input type="text" data-input value="The officer filed a report because she was on duty." autocomplete="off" spellcheck="false" />
      </label>
      <div class="chips-row" data-presets>
        <span class="chips-row-label">Try:</span>
        ${PRESETS.map((p) => `<button type="button" class="pill" data-preset="${p}">${p}</button>`).join('')}
      </div>
      <div class="readout">
        <div class="metric"><strong data-count>—</strong><span>tokens</span></div>
        <div class="metric"><strong data-chars>—</strong><span>characters</span></div>
        <div class="status" data-status>Loading tokenizer…</div>
      </div>
      <div class="token-wrap" data-tokens></div>
      <p class="hint"><strong>Guess first:</strong> how many tokens is "strawberry"? Then click it above.</p>
    </div>
  `;

  const input = root.querySelector('[data-input]');
  const tokensTarget = root.querySelector('[data-tokens]');
  const count = root.querySelector('[data-count]');
  const chars = root.querySelector('[data-chars]');
  const status = root.querySelector('[data-status]');

  let ready = false;

  async function update() {
    chars.textContent = String([...input.value].length);
    if (!ready) {
      return;
    }
    try {
      const tokenizer = await getTokenizer();
      const tokens = tokenizer.tokenize(input.value, { add_special_tokens: false });
      renderTokens(tokensTarget, tokens);
      count.textContent = String(tokens.length);
    } catch (error) {
      status.textContent = `Could not tokenize: ${error.message}`;
    }
  }

  root.querySelectorAll('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      input.value = button.dataset.preset;
      update();
      input.focus();
    });
  });
  input.addEventListener('input', update);

  async function activate() {
    chars.textContent = String([...input.value].length);
    try {
      await getTokenizer();
      ready = true;
      status.textContent = 'Ready — type to retokenize live.';
      update();
    } catch (error) {
      status.textContent = `Tokenizer failed to load: ${error.message}`;
    }
  }

  return { activate };
}
