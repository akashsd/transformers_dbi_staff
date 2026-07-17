// Lightweight ambient effects: a pointer-following light and a whisper of
// parallax on the background. Pure compositor work (CSS custom properties →
// transforms/gradients), no layout, no per-frame allocation. Disabled for
// touch/coarse pointers and when the user prefers reduced motion.
const root = document.documentElement;

export function initFx() {
  const fine = window.matchMedia('(pointer: fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduce) {
    return;
  }

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let x = targetX;
  let y = targetY;
  let raf = 0;

  function frame() {
    x += (targetX - x) * 0.12;
    y += (targetY - y) * 0.12;
    root.style.setProperty('--mx', `${x.toFixed(1)}px`);
    root.style.setProperty('--my', `${y.toFixed(1)}px`);
    root.style.setProperty('--px', (x / window.innerWidth - 0.5).toFixed(4));
    root.style.setProperty('--py', (y / window.innerHeight - 0.5).toFixed(4));
    if (Math.abs(targetX - x) > 0.4 || Math.abs(targetY - y) > 0.4) {
      raf = requestAnimationFrame(frame);
    } else {
      raf = 0;
    }
  }

  window.addEventListener(
    'pointermove',
    (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!raf) {
        raf = requestAnimationFrame(frame);
      }
    },
    { passive: true },
  );

  root.classList.add('fx-on');
}
