import init, { Universe } from '../pkg/ca.js';

// ─── Presets ────────────────────────────────────────────────
const LIFE_PRESETS = [
  { name: "Conway's Life",  b: [3],          s: [2, 3] },
  { name: "HighLife",        b: [3, 6],       s: [2, 3] },
  { name: "Seeds",           b: [2],          s: [] },
  { name: "Day & Night",    b: [3, 6, 7, 8], s: [3, 4, 6, 7, 8] },
  { name: "Replicator",     b: [1, 3, 5, 7], s: [1, 3, 5, 7] },
  { name: "Diamoeba",       b: [3, 5, 6, 7, 8], s: [5, 6, 7, 8] },
  { name: "2x2",            b: [3, 6],       s: [1, 2, 5] },
  { name: "Morley (Move)",  b: [3, 6, 8],    s: [2, 4, 5] },
  { name: "Anneal",         b: [4, 6, 7, 8], s: [3, 5, 6, 7, 8] },
  { name: "Life w/o Death", b: [3],          s: [0,1,2,3,4,5,6,7,8] },
  { name: "Maze",           b: [3],          s: [1,2,3,4,5] },
  { name: "Custom",         b: [],           s: [] },
];

const ELEM_PRESETS = [
  { name: "Rule 30",  rule: 30 },
  { name: "Rule 90",  rule: 90 },
  { name: "Rule 110", rule: 110 },
  { name: "Rule 184", rule: 184 },
  { name: "Rule 150", rule: 150 },
  { name: "Rule 73",  rule: 73 },
  { name: "Rule 45",  rule: 45 },
  { name: "Rule 60",  rule: 60 },
  { name: "Rule 105", rule: 105 },
  { name: "Rule 225", rule: 225 },
  { name: "Custom",   rule: 30 },
];

// ─── Color Palettes (pixel mode) ────────────────────────────
const PALETTES = {
  life:       [[17,17,17], [0,255,136]],
  elementary: [[17,17,17], [210,210,210]],
  brain:      [[17,17,17], [0,170,255], [180,40,100]],
  wireworld:  [[17,17,17], [68,150,255], [255,68,68], [255,180,30]],
};

function buildCyclicPalette(n) {
  const pal = [[17, 17, 17]];
  for (let i = 1; i < n; i++) {
    const h = (i / n) * 360;
    const [r, g, b] = hslToRgb(h, 80, 58);
    pal.push([r, g, b]);
  }
  return pal;
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function bsMask(arr) {
  let mask = 0;
  for (const n of arr) mask |= (1 << n);
  return mask;
}

// ─── Marching Squares ───────────────────────────────────────

const MS_THEMES = {
  cyan:  { bg: '#080818', fill: '#00e5ff', glow: '#00e5ff', blur: 6 },
  green: { bg: '#0a0a0a', fill: '#00ff88', glow: '#00ff88', blur: 4 },
  amber: { bg: '#0a0808', fill: '#ffaa00', glow: '#ffaa00', blur: 6 },
  white: { bg: '#111111', fill: '#e0e0e0', glow: '#e0e0e0', blur: 0 },
};

function buildTileFuncs() {
  const fns = new Array(16);
  fns[0] = null;
  fns[1] = (ctx, x, y, s) => {
    const r = s / 2;
    ctx.moveTo(x, y + s); ctx.lineTo(x, y + r);
    ctx.arc(x, y + s, r, -Math.PI / 2, 0);
  };
  fns[2] = (ctx, x, y, s) => {
    const r = s / 2;
    ctx.moveTo(x + s, y + s); ctx.lineTo(x + r, y + s);
    ctx.arc(x + s, y + s, r, Math.PI, Math.PI * 3 / 2);
  };
  fns[3] = (ctx, x, y, s) => {
    ctx.moveTo(x, y + s / 2); ctx.lineTo(x, y + s);
    ctx.lineTo(x + s, y + s); ctx.lineTo(x + s, y + s / 2);
    ctx.quadraticCurveTo(x + s / 2, y + s * 0.47, x, y + s / 2);
  };
  fns[4] = (ctx, x, y, s) => {
    const r = s / 2;
    ctx.moveTo(x + s, y); ctx.lineTo(x + s, y + r);
    ctx.arc(x + s, y, r, Math.PI / 2, Math.PI);
  };
  fns[5] = (ctx, x, y, s) => {
    const r = s / 2;
    ctx.moveTo(x, y + r);
    ctx.arc(x, y + s, r, -Math.PI / 2, 0);
    ctx.quadraticCurveTo(x + s, y + s, x + s, y + r);
    ctx.arc(x + s, y, r, Math.PI / 2, Math.PI);
    ctx.quadraticCurveTo(x, y, x, y + r);
  };
  fns[6] = (ctx, x, y, s) => {
    ctx.moveTo(x + s / 2, y); ctx.lineTo(x + s, y);
    ctx.lineTo(x + s, y + s); ctx.lineTo(x + s / 2, y + s);
    ctx.quadraticCurveTo(x + s * 0.48, y + s / 2, x + s / 2, y);
  };
  fns[7] = (ctx, x, y, s) => {
    ctx.moveTo(x, y + s / 2);
    ctx.quadraticCurveTo(x, y, x + s / 2, y);
    ctx.lineTo(x + s, y); ctx.lineTo(x + s, y + s);
    ctx.lineTo(x, y + s); ctx.lineTo(x, y + s / 2);
  };
  fns[8] = (ctx, x, y, s) => {
    const r = s / 2;
    ctx.moveTo(x, y); ctx.lineTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI / 2);
  };
  fns[9] = (ctx, x, y, s) => {
    ctx.moveTo(x + s / 2, y); ctx.lineTo(x, y);
    ctx.lineTo(x, y + s); ctx.lineTo(x + s / 2, y + s);
    ctx.quadraticCurveTo(x + s * 0.52, y + s / 2, x + s / 2, y);
  };
  fns[10] = (ctx, x, y, s) => {
    const r = s / 2;
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI / 2);
    ctx.quadraticCurveTo(x, y + s, x + r, y + s);
    ctx.arc(x + s, y + s, r, Math.PI, Math.PI * 3 / 2);
    ctx.quadraticCurveTo(x + s, y, x + r, y);
  };
  fns[11] = (ctx, x, y, s) => {
    ctx.moveTo(x, y); ctx.lineTo(x + s / 2, y);
    ctx.quadraticCurveTo(x + s, y, x + s, y + s / 2);
    ctx.lineTo(x + s, y + s); ctx.lineTo(x, y + s); ctx.lineTo(x, y);
  };
  fns[12] = (ctx, x, y, s) => {
    ctx.moveTo(x, y); ctx.lineTo(x + s, y);
    ctx.lineTo(x + s, y + s / 2);
    ctx.quadraticCurveTo(x + s / 2, y + s * 0.53, x, y + s / 2);
    ctx.lineTo(x, y);
  };
  fns[13] = (ctx, x, y, s) => {
    ctx.moveTo(x, y); ctx.lineTo(x + s, y);
    ctx.lineTo(x + s, y + s / 2);
    ctx.quadraticCurveTo(x + s, y + s, x + s / 2, y + s);
    ctx.lineTo(x, y + s); ctx.lineTo(x, y);
  };
  fns[14] = (ctx, x, y, s) => {
    ctx.moveTo(x, y); ctx.lineTo(x + s, y);
    ctx.lineTo(x + s, y + s); ctx.lineTo(x + s / 2, y + s);
    ctx.quadraticCurveTo(x, y + s, x, y + s / 2);
    ctx.lineTo(x, y);
  };
  fns[15] = (ctx, x, y, s) => { ctx.rect(x, y, s, s); };
  return fns;
}

const TILE_FUNCS = buildTileFuncs();

function buildTileImages(S, theme) {
  const pad = Math.ceil(theme.blur * 2);
  const size = S + pad * 2;
  const tiles = new Array(16);
  for (let i = 0; i < 16; i++) {
    if (i === 0) { tiles[i] = null; continue; }
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const tctx = c.getContext('2d');
    tctx.fillStyle = theme.fill;
    if (theme.blur > 0) { tctx.shadowColor = theme.glow; tctx.shadowBlur = theme.blur; }
    tctx.beginPath();
    TILE_FUNCS[i](tctx, pad, pad, S);
    tctx.fill();
    tiles[i] = c;
  }
  const cr = S * 0.55;
  const cs = Math.ceil(cr * 2) + 2;
  const cc = document.createElement('canvas');
  cc.width = cs; cc.height = cs;
  const cctx = cc.getContext('2d');
  cctx.fillStyle = theme.fill;
  cctx.beginPath();
  cctx.arc(cs / 2, cs / 2, cr, 0, Math.PI * 2);
  cctx.fill();
  return { tiles, circle: cc, pad, circleOff: cs / 2 };
}

// ─── Metaballs ──────────────────────────────────────────────

function buildMetaballKernel(radius) {
  const sigma = radius / 2.5;
  const size = radius * 2 + 1;
  const kernel = new Float32Array(size * size);
  const invSigma2 = 1 / (2 * sigma * sigma);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const d2 = dx * dx + dy * dy;
      if (d2 <= radius * radius) {
        kernel[(dy + radius) * size + (dx + radius)] = Math.exp(-d2 * invSigma2);
      }
    }
  }
  return { kernel, size, radius };
}

const SPEED_TABLE = [1, 2, 3, 5, 8, 10, 15, 20, 30, 45, 60, 90, 120, 180, 300, 480, 600, 900, 1200, 1800];

// ─── Main ───────────────────────────────────────────────────
async function main() {
  const wasm = await init();

  const DISPLAY_W = 800, DISPLAY_H = 600;
  let GRID_W = 200, GRID_H = 150;
  let universe = new Universe(GRID_W, GRID_H);

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  let imageData, imgBuf;
  let tileS = 0, tileImages = null;
  let mbField = null, mbFieldW = 0, mbFieldH = 0;
  let mbMultiplier = 1, mbKernel = null;
  let mbImageData = null, mbBuf = null;

  let running = true;
  let generation = 0;
  let genPerSec = SPEED_TABLE[10];
  let animId = null;
  let palette = PALETTES.life;
  let caType = 'life';
  let renderMode = 'pixels';
  let msTheme = MS_THEMES.cyan;
  let tickAccum = 0;
  let lastFrameTime = 0;

  const genSpan = document.getElementById('gen');

  // ─── Canvas Setup ─────────────────────────────────────────
  function setupPixelCanvas() {
    canvas.width = GRID_W;
    canvas.height = GRID_H;
    canvas.style.width = DISPLAY_W + 'px';
    canvas.style.height = DISPLAY_H + 'px';
    canvas.style.imageRendering = 'pixelated';
    imageData = ctx.createImageData(GRID_W, GRID_H);
    imgBuf = imageData.data;
    for (let i = 3; i < imgBuf.length; i += 4) imgBuf[i] = 255;
  }

  function setupMarchingCanvas() {
    tileS = Math.max(4, Math.floor(Math.min(
      DISPLAY_W / (GRID_W - 1),
      DISPLAY_H / (GRID_H - 1)
    )));
    const cw = (GRID_W - 1) * tileS;
    const ch = (GRID_H - 1) * tileS;
    canvas.width = cw;
    canvas.height = ch;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    canvas.style.imageRendering = 'auto';
    tileImages = buildTileImages(tileS, msTheme);
  }

  function setupMetaballsCanvas() {
    if (GRID_W * GRID_H > 120000) {
      console.warn('Metaballs: grid too large, falling back to pixels');
      renderMode = 'pixels';
      document.getElementById('render-mode').value = 'pixels';
      document.getElementById('ms-params').classList.remove('active');
      setupPixelCanvas();
      return;
    }
    const rawMult = Math.floor(Math.min(DISPLAY_W / GRID_W, DISPLAY_H / GRID_H));
    mbMultiplier = Math.max(1, Math.min(6, rawMult));
    mbFieldW = GRID_W * mbMultiplier;
    mbFieldH = GRID_H * mbMultiplier;
    mbField = new Float32Array(mbFieldW * mbFieldH);
    const kernelRadius = Math.max(2, mbMultiplier * 3);
    mbKernel = buildMetaballKernel(kernelRadius);
    canvas.width = mbFieldW;
    canvas.height = mbFieldH;
    canvas.style.width = DISPLAY_W + 'px';
    canvas.style.height = DISPLAY_H + 'px';
    canvas.style.imageRendering = 'auto';
    mbImageData = ctx.createImageData(mbFieldW, mbFieldH);
    mbBuf = mbImageData.data;
    for (let i = 3; i < mbBuf.length; i += 4) mbBuf[i] = 255;
  }

  function setupCanvas() {
    if (renderMode === 'metaballs') setupMetaballsCanvas();
    else if (renderMode === 'marching') setupMarchingCanvas();
    else setupPixelCanvas();
  }

  // ─── Rendering ──────────────────────────────────────────
  function drawPixels() {
    const ptr = universe.cells_ptr();
    const cells = new Uint8Array(wasm.memory.buffer, ptr, GRID_W * GRID_H);
    for (let i = 0; i < GRID_W * GRID_H; i++) {
      const c = palette[cells[i]] || palette[0];
      const off = i * 4;
      imgBuf[off] = c[0]; imgBuf[off + 1] = c[1]; imgBuf[off + 2] = c[2];
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function drawMarching() {
    const ptr = universe.cells_ptr();
    const cells = new Uint8Array(wasm.memory.buffer, ptr, GRID_W * GRID_H);
    const S = tileS;
    const { tiles, circle, pad, circleOff } = tileImages;

    ctx.fillStyle = msTheme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < GRID_H; row++) {
      for (let col = 0; col < GRID_W; col++) {
        if (cells[row * GRID_W + col] > 0) {
          ctx.drawImage(circle, col * S - circleOff, row * S - circleOff);
        }
      }
    }

    for (let row = 0; row < GRID_H - 1; row++) {
      for (let col = 0; col < GRID_W - 1; col++) {
        const tl = cells[row * GRID_W + col] > 0 ? 1 : 0;
        const tr = cells[row * GRID_W + col + 1] > 0 ? 1 : 0;
        const br = cells[(row + 1) * GRID_W + col + 1] > 0 ? 1 : 0;
        const bl = cells[(row + 1) * GRID_W + col] > 0 ? 1 : 0;
        const caseIdx = (tl << 3) | (tr << 2) | (br << 1) | bl;
        if (caseIdx !== 0) {
          ctx.drawImage(tiles[caseIdx], col * S - pad, row * S - pad);
        }
      }
    }
  }

  function drawMetaballs() {
    const ptr = universe.cells_ptr();
    const cells = new Uint8Array(wasm.memory.buffer, ptr, GRID_W * GRID_H);
    const field = mbField;
    const fw = mbFieldW, fh = mbFieldH;
    const mult = mbMultiplier;
    const { kernel, size, radius } = mbKernel;

    field.fill(0);

    for (let row = 0; row < GRID_H; row++) {
      const rowOff = row * GRID_W;
      const fy = row * mult;
      for (let col = 0; col < GRID_W; col++) {
        if (cells[rowOff + col] === 0) continue;
        const fx = col * mult;
        const yStart = Math.max(0, fy - radius);
        const yEnd = Math.min(fh - 1, fy + radius);
        const xStart = Math.max(0, fx - radius);
        const xEnd = Math.min(fw - 1, fx + radius);
        for (let py = yStart; py <= yEnd; py++) {
          const ky = py - fy + radius;
          const fOff = py * fw;
          const kOff = ky * size;
          for (let px = xStart; px <= xEnd; px++) {
            field[fOff + px] += kernel[kOff + (px - fx + radius)];
          }
        }
      }
    }

    const theme = msTheme;
    const [bgR, bgG, bgB] = hexToRgb(theme.bg);
    const [fgR, fgG, fgB] = hexToRgb(theme.fill);
    const buf = mbBuf;
    const THRESHOLD = 0.8;
    const EDGE = 0.3;
    const lo = THRESHOLD - EDGE, hi = THRESHOLD + EDGE;

    for (let i = 0; i < fw * fh; i++) {
      const v = field[i];
      const off = i * 4;
      if (v <= lo) {
        buf[off] = bgR; buf[off + 1] = bgG; buf[off + 2] = bgB;
      } else if (v >= hi) {
        buf[off] = fgR; buf[off + 1] = fgG; buf[off + 2] = fgB;
      } else {
        let t = (v - lo) / (hi - lo);
        t = t * t * (3 - 2 * t);
        buf[off]     = bgR + (fgR - bgR) * t | 0;
        buf[off + 1] = bgG + (fgG - bgG) * t | 0;
        buf[off + 2] = bgB + (fgB - bgB) * t | 0;
      }
    }

    ctx.putImageData(mbImageData, 0, 0);
  }

  function draw() {
    if (renderMode === 'metaballs') drawMetaballs();
    else if (renderMode === 'marching') drawMarching();
    else drawPixels();
    genSpan.textContent = generation;
  }

  // ─── Animation loop (time-based) ─────────────────────────
  function loop(now) {
    if (!running) return;
    if (lastFrameTime === 0) lastFrameTime = now;
    const dt = now - lastFrameTime;
    lastFrameTime = now;

    const msPerGen = 1000 / genPerSec;
    tickAccum += dt;
    let ticked = false;
    let cap = 20;
    while (tickAccum >= msPerGen && cap-- > 0) {
      universe.tick();
      generation++;
      tickAccum -= msPerGen;
      ticked = true;
    }
    if (tickAccum > msPerGen * 5) tickAccum = msPerGen;
    if (ticked) draw();
    animId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (animId) cancelAnimationFrame(animId);
    animId = null;
  }

  function start() {
    if (!running) {
      running = true;
      playPauseBtn.textContent = 'Pause';
      playPauseBtn.classList.remove('active');
      lastFrameTime = 0;
      tickAccum = 0;
      loop(performance.now());
    }
  }

  // ─── Resolution ─────────────────────────────────────────
  function resize(newW, newH) {
    GRID_W = newW;
    GRID_H = newH;
    universe.free();
    universe = new Universe(GRID_W, GRID_H);
    setupCanvas();
    generation = 0;
    genSpan.textContent = '0';
    switchCA(caType);
  }

  // ─── Build B/S checkboxes ───────────────────────────────
  function buildBSRow(containerId, initial) {
    const row = document.getElementById(containerId);
    while (row.children.length > 1) row.removeChild(row.lastChild);
    for (let n = 0; n <= 8; n++) {
      const lbl = document.createElement('label');
      lbl.textContent = n;
      lbl.dataset.n = n;
      if (initial.includes(n)) lbl.classList.add('on');
      lbl.addEventListener('click', () => { lbl.classList.toggle('on'); onBSChange(); });
      row.appendChild(lbl);
    }
  }

  function readBS(containerId) {
    const arr = [];
    for (const lbl of document.getElementById(containerId).querySelectorAll('label')) {
      if (lbl.classList.contains('on')) arr.push(parseInt(lbl.dataset.n));
    }
    return arr;
  }

  function setBS(containerId, arr) {
    for (const lbl of document.getElementById(containerId).querySelectorAll('label')) {
      lbl.classList.toggle('on', arr.includes(parseInt(lbl.dataset.n)));
    }
  }

  function onBSChange() {
    const b = readBS('birth-row');
    const s = readBS('surv-row');
    universe.update_life_like(bsMask(b), bsMask(s));
    const presetSel = document.getElementById('life-preset');
    let matched = false;
    for (let i = 0; i < LIFE_PRESETS.length - 1; i++) {
      const p = LIFE_PRESETS[i];
      if (arrEq(p.b, b) && arrEq(p.s, s)) { presetSel.value = i; matched = true; break; }
    }
    if (!matched) presetSel.value = LIFE_PRESETS.length - 1;
  }

  function arrEq(a, b) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }

  // ─── Rule visualization (Elementary) ────────────────────
  function updateRuleViz(rule) {
    const viz = document.getElementById('rule-viz');
    viz.innerHTML = '';
    for (let i = 7; i >= 0; i--) {
      const div = document.createElement('div');
      div.className = 'rule-pat';
      const top = document.createElement('div');
      top.className = 'top';
      for (let bit = 2; bit >= 0; bit--) {
        const cell = document.createElement('div');
        cell.className = 'cell ' + ((i >> bit) & 1 ? 'on' : 'off');
        top.appendChild(cell);
      }
      const out = document.createElement('div');
      out.className = 'cell out ' + ((rule >> i) & 1 ? 'on' : 'off');
      div.appendChild(top);
      div.appendChild(out);
      viz.appendChild(div);
    }
  }

  // ─── Populate preset dropdowns ──────────────────────────
  const lifePresetSel = document.getElementById('life-preset');
  LIFE_PRESETS.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = p.name + (p.b.length ? ` (B${p.b.join('')}/S${p.s.join('')})` : '');
    lifePresetSel.appendChild(opt);
  });

  const elemPresetSel = document.getElementById('elem-preset');
  ELEM_PRESETS.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = p.name;
    elemPresetSel.appendChild(opt);
  });

  // ─── Init B/S checkboxes ────────────────────────────────
  buildBSRow('birth-row', [3]);
  buildBSRow('surv-row', [2, 3]);

  // ─── CA Type switching ──────────────────────────────────
  const paramSections = {
    life: document.getElementById('life-params'),
    elementary: document.getElementById('elem-params'),
    brain: document.getElementById('bb-params'),
    wireworld: document.getElementById('ww-params'),
    cyclic: document.getElementById('cyc-params'),
  };

  function switchCA(type) {
    caType = type;
    for (const [key, el] of Object.entries(paramSections)) {
      el.classList.toggle('active', key === type);
    }
    generation = 0;
    genSpan.textContent = '0';
    switch (type) {
      case 'life': {
        const b = readBS('birth-row');
        const s = readBS('surv-row');
        universe.set_life_like(bsMask(b), bsMask(s));
        palette = PALETTES.life;
        universe.randomize(Math.random() * 0xFFFFFFFF | 0);
        break;
      }
      case 'elementary': {
        const rule = parseInt(document.getElementById('elem-rule').value) || 30;
        universe.set_elementary(rule);
        palette = PALETTES.elementary;
        updateRuleViz(rule);
        break;
      }
      case 'brain': {
        universe.set_brians_brain();
        palette = PALETTES.brain;
        universe.randomize(Math.random() * 0xFFFFFFFF | 0);
        break;
      }
      case 'wireworld': {
        universe.set_wireworld();
        palette = PALETTES.wireworld;
        universe.clear();
        break;
      }
      case 'cyclic': {
        const ns = parseInt(document.getElementById('cyc-states').value) || 16;
        const th = parseInt(document.getElementById('cyc-threshold').value) || 3;
        universe.set_cyclic(ns, th);
        palette = buildCyclicPalette(ns);
        universe.randomize(Math.random() * 0xFFFFFFFF | 0);
        break;
      }
    }
    draw();
  }

  // ─── Event handlers ─────────────────────────────────────
  document.getElementById('ca-type').addEventListener('change', (e) => {
    switchCA(e.target.value);
  });

  lifePresetSel.addEventListener('change', (e) => {
    const p = LIFE_PRESETS[parseInt(e.target.value)];
    if (!p || p.name === 'Custom') return;
    setBS('birth-row', p.b);
    setBS('surv-row', p.s);
    universe.update_life_like(bsMask(p.b), bsMask(p.s));
  });

  elemPresetSel.addEventListener('change', (e) => {
    const p = ELEM_PRESETS[parseInt(e.target.value)];
    if (!p || p.name === 'Custom') return;
    document.getElementById('elem-rule').value = p.rule;
    universe.set_elementary(p.rule);
    updateRuleViz(p.rule);
    generation = 0;
    genSpan.textContent = '0';
    draw();
  });

  document.getElementById('elem-rule').addEventListener('change', (e) => {
    const rule = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
    e.target.value = rule;
    universe.update_elementary(rule);
    updateRuleViz(rule);
    const match = ELEM_PRESETS.findIndex(p => p.rule === rule);
    elemPresetSel.value = match >= 0 ? match : ELEM_PRESETS.length - 1;
  });

  document.getElementById('cyc-states').addEventListener('change', () => {
    const ns = parseInt(document.getElementById('cyc-states').value) || 16;
    const th = parseInt(document.getElementById('cyc-threshold').value) || 3;
    universe.update_cyclic(ns, th);
    palette = buildCyclicPalette(ns);
    draw();
  });
  document.getElementById('cyc-threshold').addEventListener('change', () => {
    const ns = parseInt(document.getElementById('cyc-states').value) || 16;
    const th = parseInt(document.getElementById('cyc-threshold').value) || 3;
    universe.update_cyclic(ns, th);
  });

  // Speed (time-based)
  const speedSlider = document.getElementById('speed');
  const speedVal = document.getElementById('speed-val');
  speedSlider.addEventListener('input', (e) => {
    const idx = parseInt(e.target.value) - 1;
    genPerSec = SPEED_TABLE[idx];
    speedVal.textContent = genPerSec;
  });

  // Resolution
  document.getElementById('resolution').addEventListener('change', (e) => {
    const [w, h] = e.target.value.split('x').map(Number);
    resize(w, h);
  });

  // Render mode
  document.getElementById('render-mode').addEventListener('change', (e) => {
    renderMode = e.target.value;
    const showTheme = (renderMode === 'marching' || renderMode === 'metaballs');
    document.getElementById('ms-params').classList.toggle('active', showTheme);
    setupCanvas();
    draw();
  });

  // MS theme
  document.getElementById('ms-theme').addEventListener('change', (e) => {
    msTheme = MS_THEMES[e.target.value];
    if (renderMode === 'marching') {
      tileImages = buildTileImages(tileS, msTheme);
      draw();
    } else if (renderMode === 'metaballs') {
      draw();
    }
  });

  // Play/Pause
  const playPauseBtn = document.getElementById('play-pause');
  playPauseBtn.addEventListener('click', () => {
    if (running) {
      stop();
      playPauseBtn.textContent = 'Play';
      playPauseBtn.classList.add('active');
    } else {
      start();
    }
  });

  // Step
  document.getElementById('step').addEventListener('click', () => {
    if (!running) {
      universe.tick();
      generation++;
      genSpan.textContent = generation;
      draw();
    }
  });

  // Clear
  document.getElementById('clear').addEventListener('click', () => {
    universe.clear();
    generation = 0;
    genSpan.textContent = '0';
    draw();
  });

  // Random
  document.getElementById('random').addEventListener('click', () => {
    universe.randomize(Math.random() * 0xFFFFFFFF | 0);
    generation = 0;
    genSpan.textContent = '0';
    if (caType === 'cyclic') {
      palette = buildCyclicPalette(parseInt(document.getElementById('cyc-states').value) || 16);
    }
    draw();
  });

  // ─── Mouse interaction ──────────────────────────────────
  let painting = false;
  let paintState = 1;
  let erasing = false;

  function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    let col, row;
    if (renderMode === 'marching') {
      const px = (e.clientX - rect.left) / rect.width * canvas.width;
      const py = (e.clientY - rect.top) / rect.height * canvas.height;
      col = Math.round(px / tileS);
      row = Math.round(py / tileS);
    } else if (renderMode === 'metaballs') {
      const px = (e.clientX - rect.left) / rect.width * canvas.width;
      const py = (e.clientY - rect.top) / rect.height * canvas.height;
      col = Math.floor(px / mbMultiplier);
      row = Math.floor(py / mbMultiplier);
    } else {
      col = Math.floor((e.clientX - rect.left) / rect.width * GRID_W);
      row = Math.floor((e.clientY - rect.top) / rect.height * GRID_H);
    }
    if (col >= 0 && col < GRID_W && row >= 0 && row < GRID_H) return { row, col };
    return null;
  }

  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const cell = cellFromEvent(e);
    if (!cell) return;
    if (e.button === 2) {
      erasing = true; painting = true;
      universe.set_cell(cell.row, cell.col, 0);
    } else {
      universe.toggle_cell(cell.row, cell.col);
      const ptr = universe.cells_ptr();
      const cells = new Uint8Array(wasm.memory.buffer, ptr, GRID_W * GRID_H);
      paintState = cells[cell.row * GRID_W + cell.col];
      painting = true; erasing = false;
    }
    draw();
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!painting) return;
    const cell = cellFromEvent(e);
    if (!cell) return;
    universe.set_cell(cell.row, cell.col, erasing ? 0 : paintState);
    draw();
  });

  window.addEventListener('mouseup', () => { painting = false; erasing = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // ─── Init and start ─────────────────────────────────────
  setupCanvas();
  universe.set_life_like(bsMask([3]), bsMask([2, 3]));
  universe.randomize(Date.now() & 0xFFFFFFFF);
  updateRuleViz(30);
  draw();
  lastFrameTime = 0;
  tickAccum = 0;
  loop(performance.now());
}

main();
