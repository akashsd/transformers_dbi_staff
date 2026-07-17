// Freeze the Attention and Next-token panels into static JSON so they need no
// live model at runtime. Next-token uses REAL GPT-2 output captured once here.
// Attention is a hand-authored schematic (the ONNX exports don't expose
// attention weights) — it's an illustration of the concept, labelled as such.
// Run: node tools/precompute_panels.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { AutoTokenizer, AutoModelForCausalLM } from '@huggingface/transformers';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'src', 'data');
mkdirSync(outDir, { recursive: true });

/* ---------------- Next-token: real GPT-2, frozen ---------------- */

const NEXT_PROMPTS = [
  { label: 'Everyday', prompt: 'The officer parked the cruiser and walked into the' },
  { label: 'Boring / obvious', prompt: 'The capital of France is' },
  { label: 'Ambiguous', prompt: 'After the meeting, she went to the' },
  { label: 'Confidently wrong', prompt: 'The Dallas Cowboys won the Super Bowl in' },
];

function softmax(values) {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

console.log('Loading GPT-2…');
const tokenizer = await AutoTokenizer.from_pretrained('Xenova/gpt2');
const model = await AutoModelForCausalLM.from_pretrained('Xenova/gpt2', { dtype: 'fp32' });

const nextExamples = [];
for (const { label, prompt } of NEXT_PROMPTS) {
  const inputs = await tokenizer(prompt);
  const { logits } = await model(inputs);
  const vocab = logits.dims[2];
  const seq = logits.dims[1];
  const lastRow = Array.from(logits.data.slice((seq - 1) * vocab, seq * vocab));
  const probs = softmax(lastRow);
  const predictions = probs
    .map((p, id) => ({ id, p }))
    .sort((a, b) => b.p - a.p)
    .slice(0, 10)
    .map(({ id, p }) => ({
      token: tokenizer.decode([id], { skip_special_tokens: true }),
      percent: Math.round(p * 1000) / 10,
    }));
  nextExamples.push({ label, prompt, predictions });
  console.log(`  ${label}: "${prompt}" -> ${predictions[0].token.trim()} (${predictions[0].percent}%)`);
}

writeFileSync(
  join(outDir, 'next-token.json'),
  JSON.stringify({ model: 'Xenova/gpt2', note: 'Real GPT-2 output, captured once.', examples: nextExamples }, null, 0),
);

/* ---------------- Attention: hand-authored schematic ---------------- */

// Build a row-normalised attention matrix from simple linguistic rules so the
// fan-out is readable and makes the coreference point ("she" -> "officer").
function buildAttention(tokens, links) {
  const n = tokens.length;
  const weight = links.reduce((map, [from, to, w]) => {
    (map[from] ||= {})[to] = w;
    return map;
  }, {});
  const rows = [];
  for (let i = 0; i < n; i += 1) {
    const raw = new Array(n).fill(0);
    for (let j = 0; j < n; j += 1) {
      let w = 0.15; // diffuse baseline
      if (j === i) w += 1.0; // self-attention
      if (j === i - 1 || j === i + 1) w += 0.5; // neighbours
      if (weight[i]?.[j]) w += weight[i][j]; // authored links
      raw[j] = w;
    }
    const sum = raw.reduce((a, b) => a + b, 0);
    rows.push(raw.map((v) => Math.round((v / sum) * 1000) / 1000));
  }
  return rows;
}

const s1 = ['The', 'officer', 'filed', 'a', 'report', 'because', 'she', 'was', 'on', 'duty', '.'];
// links: [sourceIndex, targetIndex, extraWeight]
const s1links = [
  [6, 1, 2.6], // she -> officer  (the money link)
  [2, 1, 1.4], // filed -> officer (subject)
  [2, 4, 1.2], // filed -> report (object)
  [4, 2, 1.0], // report -> filed
  [4, 3, 0.6], // report -> a
  [1, 0, 0.6], // officer -> The
  [9, 8, 0.8], // duty -> on
  [5, 2, 0.9], // because -> filed
];

const s2 = ['The', 'dog', 'chased', 'the', 'cat', 'because', 'it', 'was', 'scared', '.'];
const s2links = [
  [6, 1, 1.4], // it -> dog   (ambiguous...)
  [6, 4, 1.3], // it -> cat   (...both plausible)
  [2, 1, 1.3], // chased -> dog
  [2, 4, 1.2], // chased -> cat
  [4, 3, 0.6], // cat -> the
  [1, 0, 0.6], // dog -> The
  [8, 6, 0.9], // scared -> it
];

const attnExamples = [
  {
    label: 'Coreference: "she" → "officer"',
    tokens: s1,
    weights: buildAttention(s1, s1links),
    hintTokenIndex: 6,
  },
  {
    label: 'Ambiguous: what does "it" refer to?',
    tokens: s2,
    weights: buildAttention(s2, s2links),
    hintTokenIndex: 6,
  },
];

writeFileSync(
  join(outDir, 'attention.json'),
  JSON.stringify(
    {
      note: 'Illustrative schematic — hand-authored to show what attention captures, not live model output.',
      examples: attnExamples,
    },
    null,
    0,
  ),
);

console.log('Wrote src/data/next-token.json and src/data/attention.json');
