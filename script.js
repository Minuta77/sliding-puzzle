/* Sliding Puzzle – Anyashka
   DRAG  : grab a tile, drag onto the empty space, release
   CLICK : click a tile next to the empty space
*/

// ─── Config ────────────────────────────────────────────────────────────────
const DEFAULT_IMAGE = 'mame.jpg';
const DEFAULT_SIZE  = 4;
const PUZZLE_PX     = 520; // fallback px (matches CSS min(92vw,560px) on desktop)

const IMAGES = [
  'mame.jpg',
  'IMG-20260406-WA0011.jpg',
  'IMG-20260406-WA0012.jpg',
  'IMG-20260406-WA0013.jpg',
  'krasota.jpg',
  'krik.jpg',
  'kipr.jpg',
  'haski-kotik.jpg',
  'IMG-20230417-WA0041.jpg',
  '20230801_203615.jpg',
  '20231104_175302.jpg',
  '20221222_152833.jpg',
  '20210711_204349.jpg',
  '20201005_181106.jpg'
];

// ─── DOM refs ──────────────────────────────────────────────────────────────
const puzzleEl     = document.getElementById('puzzle');
const shuffleBtn   = document.getElementById('shuffleBtn');
const resetBtn     = document.getElementById('resetBtn');
const moveCountEl  = document.getElementById('moveCount');
const timerEl      = document.getElementById('timer');
const overlay      = document.getElementById('overlay');
const finalMoves   = document.getElementById('finalMoves');
const finalTime    = document.getElementById('finalTime');
const playAgainBtn = document.getElementById('playAgain');
const gridSizeSel  = document.getElementById('gridSize');
const pickerEl     = document.getElementById('picker');

// ─── State ─────────────────────────────────────────────────────────────────
let SIZE         = DEFAULT_SIZE;
let tiles        = [];
let emptyIndex   = 0;
let moves        = 0;
let timer        = null;
let startTime    = null;
let currentImage = DEFAULT_IMAGE;

// Drag state
let dragPos  = -1;
let dragEl   = null;
let ghostEl  = null;
let dragOffX = 0;
let dragOffY = 0;

// ─── Puzzle pixel size ─────────────────────────────────────────────────────
function getPuzzleSize() {
  const r = puzzleEl.getBoundingClientRect();
  const w = r.width  > 20 ? r.width  : PUZZLE_PX;
  const h = r.height > 20 ? r.height : PUZZLE_PX;
  return { w, h };
}

// ─── Image Picker ──────────────────────────────────────────────────────────
function buildPicker() {
  if (!pickerEl) return;
  pickerEl.innerHTML = '';
  IMAGES.forEach(src => {
    const img     = document.createElement('img');
    img.src       = src;
    img.className = 'picker-thumb' + (src === currentImage ? ' active' : '');
    img.title     = src;
    img.addEventListener('click', () => {
      pickerEl.querySelectorAll('.picker-thumb').forEach(t => t.classList.remove('active'));
      img.classList.add('active');
      currentImage = src;
      puzzleEl.style.backgroundImage = `url(${src})`;
      render();
    });
    pickerEl.appendChild(img);
  });
}

// ─── Grid builder ──────────────────────────────────────────────────────────
function buildGrid() {
  const N = SIZE * SIZE;
  puzzleEl.innerHTML = '';
  puzzleEl.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
  puzzleEl.style.gridTemplateRows    = `repeat(${SIZE}, 1fr)`;
  puzzleEl.style.backgroundImage     = `url(${currentImage})`;

  for (let i = 0; i < N; i++) {
    const div = document.createElement('div');
    div.className   = 'tile';
    div.dataset.pos = i;
    div.addEventListener('click',       ()   => onTileClick(i));
    div.addEventListener('pointerdown', (ev) => onDragStart(ev, i));
    puzzleEl.appendChild(div);
  }
}

// ─── Render ────────────────────────────────────────────────────────────────
function render() {
  const N       = SIZE * SIZE;
  const tileEls = puzzleEl.querySelectorAll('.tile');
  const { w: pxW, h: pxH } = getPuzzleSize();
  const tileW   = pxW / SIZE;
  const tileH   = pxH / SIZE;

  for (let pos = 0; pos < N; pos++) {
    const tileIndex = tiles[pos];
    const el        = tileEls[pos];

    if (tileIndex === N - 1) {
      el.classList.add('empty');
      el.style.backgroundImage    = 'none';
      el.style.backgroundPosition = '';
      el.style.backgroundSize     = '';
    } else {
      el.classList.remove('empty');
      const sr = Math.floor(tileIndex / SIZE);
      const sc = tileIndex % SIZE;
      el.style.backgroundImage    = `url(${currentImage})`;
      el.style.backgroundSize     = `${pxW}px ${pxH}px`;
      el.style.backgroundPosition = `${-sc * tileW}px ${-sr * tileH}px`;
    }
  }
}

// ─── Drag & Drop ───────────────────────────────────────────────────────────
function onDragStart(ev, pos) {
  if (pos === emptyIndex) return;
  if (!neighbors(pos).includes(emptyIndex)) return;
  ev.preventDefault();

  dragPos = pos;
  dragEl  = ev.currentTarget;

  const rect = dragEl.getBoundingClientRect();
  dragOffX   = ev.clientX - rect.left;
  dragOffY   = ev.clientY - rect.top;

  ghostEl = dragEl.cloneNode(true);
  Object.assign(ghostEl.style, {
    position:     'fixed',
    zIndex:       '9999',
    pointerEvents:'none',
    width:        rect.width  + 'px',
    height:       rect.height + 'px',
    borderRadius: '6px',
    opacity:      '0.88',
    boxShadow:    '0 8px 24px rgba(0,0,0,.55)',
    transform:    'scale(1.08)',
    top:          rect.top  + 'px',
    left:         rect.left + 'px',
    transition:   'none'
  });
  document.body.appendChild(ghostEl);
  dragEl.style.opacity = '0.25';

  document.addEventListener('pointermove', onDragMove);
  document.addEventListener('pointerup',   onDragEnd);
}

function onDragMove(ev) {
  if (!ghostEl) return;
  ghostEl.style.left = (ev.clientX - dragOffX) + 'px';
  ghostEl.style.top  = (ev.clientY - dragOffY) + 'px';
}

function onDragEnd(ev) {
  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointerup',   onDragEnd);

  if (ghostEl) { ghostEl.remove(); ghostEl = null; }
  if (dragEl)  { dragEl.style.opacity = ''; dragEl = null; }

  if (dragPos === -1) return;

  const emptyEl = puzzleEl.querySelectorAll('.tile')[emptyIndex];
  const r       = emptyEl.getBoundingClientRect();
  const hit     = ev.clientX >= r.left && ev.clientX <= r.right
               && ev.clientY >= r.top  && ev.clientY <= r.bottom;

  if (hit) doMove(dragPos);
  dragPos = -1;
}

// ─── Click ─────────────────────────────────────────────────────────────────
function onTileClick(pos) {
  if (isSolved()) return;
  if (neighbors(pos).includes(emptyIndex)) doMove(pos);
}

// ─── Move ──────────────────────────────────────────────────────────────────
function doMove(pos) {
  swap(pos, emptyIndex);
  emptyIndex = pos;
  moves++;
  moveCountEl.textContent = moves;

  const tileEls = puzzleEl.querySelectorAll('.tile');
  tileEls[emptyIndex].classList.remove('pop');
  void tileEls[emptyIndex].offsetWidth;
  tileEls[emptyIndex].classList.add('pop');

  render();
  if (!startTime) startTimer();
  if (checkSolved()) finish();
}

// ─── State helpers ─────────────────────────────────────────────────────────
function resetState() {
  const N = SIZE * SIZE;
  tiles                   = Array.from({ length: N }, (_, i) => i);
  emptyIndex              = N - 1;
  moves                   = 0;
  moveCountEl.textContent = moves;
  stopTimer();
  timerEl.textContent = '00:00';
}

function swap(a, b) {
  const t = tiles[a]; tiles[a] = tiles[b]; tiles[b] = t;
}

function neighbors(pos) {
  const row = Math.floor(pos / SIZE), col = pos % SIZE;
  const res = [];
  if (row > 0)      res.push(pos - SIZE);
  if (row < SIZE-1) res.push(pos + SIZE);
  if (col > 0)      res.push(pos - 1);
  if (col < SIZE-1) res.push(pos + 1);
  return res;
}

function checkSolved() {
  for (let i = 0; i < tiles.length; i++) if (tiles[i] !== i) return false;
  return true;
}
function isSolved() { return checkSolved(); }

// ─── Shuffle / Reset ───────────────────────────────────────────────────────
function shuffle(times) {
  if (times === undefined) times = 200;
  resetState();
  let last = -1;
  for (let i = 0; i < times; i++) {
    const neigh  = neighbors(emptyIndex).filter(function(n){ return n !== last; });
    const choice = neigh[Math.floor(Math.random() * neigh.length)];
    swap(choice, emptyIndex);
    last       = emptyIndex;
    emptyIndex = choice;
  }
  moves                   = 0;
  moveCountEl.textContent = moves;
  stopTimer();
  startTime           = null;
  timerEl.textContent = '00:00';
  render();
}

function resetPuzzle() {
  resetState();
  buildGrid();
  requestAnimationFrame(function(){ requestAnimationFrame(render); });
  overlay.classList.add('hidden');
}

// ─── Finish ────────────────────────────────────────────────────────────────
function finish() {
  stopTimer();
  finalMoves.textContent = moves;
  finalTime.textContent  = timerEl.textContent;
  overlay.classList.remove('hidden');
}

// ─── Timer ─────────────────────────────────────────────────────────────────
function startTimer() {
  startTime = Date.now();
  timer = setInterval(function(){
    timerEl.textContent = formatTime(Date.now() - startTime);
  }, 500);
}
function stopTimer() {
  if (timer) clearInterval(timer);
  timer     = null;
  startTime = null;
}
function formatTime(ms) {
  const s  = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return mm + ':' + ss;
}

// ─── Init ──────────────────────────────────────────────────────────────────
function init() {
  SIZE = parseInt(gridSizeSel.value, 10) || DEFAULT_SIZE;
  resetState();
  buildGrid();
  buildPicker();
  // Wait until the puzzle element actually has pixel dimensions before rendering.
  // ResizeObserver fires as soon as layout is complete — works whether the page
  // was opened directly or navigated to from another origin.
  var ro = new ResizeObserver(function(entries) {
    var entry = entries[0];
    var w = entry.contentRect.width;
    var h = entry.contentRect.height;
    if (w > 20 && h > 20) {
      ro.disconnect();
      render();
      shuffle(200);
    }
  });
  ro.observe(puzzleEl);
}

// ─── Event listeners ───────────────────────────────────────────────────────
shuffleBtn.addEventListener('click',   function(){ shuffle(200); });
resetBtn.addEventListener('click',     function(){ resetPuzzle(); });
playAgainBtn.addEventListener('click', function(){ overlay.classList.add('hidden'); shuffle(200); });
gridSizeSel.addEventListener('change', function(){ SIZE = parseInt(gridSizeSel.value, 10); resetPuzzle(); });

// ─── Boot ──────────────────────────────────────────────────────────────────
window.addEventListener('load', function(){
  var probe   = new Image();
  probe.onload  = function(){ currentImage = DEFAULT_IMAGE; init(); };
  probe.onerror = function(){ currentImage = null;          init(); };
  probe.src     = DEFAULT_IMAGE;
});

// Debug API
window.puzzleDebug = {
  shuffle: function(n){ shuffle(n || 200); },
  reset:   resetPuzzle,
  setImg:  function(url){ currentImage = url; puzzleEl.style.backgroundImage = 'url(' + url + ')'; render(); }
};
