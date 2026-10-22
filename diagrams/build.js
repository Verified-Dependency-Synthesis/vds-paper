// Generates all SVG diagrams for README.md.
// Usage: node diagrams/build.js
const fs = require('fs');
const path = require('path');

const STYLE = `<style>
text{font-family:'Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif;fill:#1f2430}
.h{font-size:20px;font-weight:700}
.b{font-size:15px;font-weight:600}
.t{font-size:15px}
.s{font-size:13px;fill:#5b6170}
.ms{font-size:13.5px}
.m{font-family:Consolas,'SF Mono',Menlo,monospace;font-size:14px;font-weight:700}
.c{text-anchor:middle}
.e{text-anchor:end}
.num{font-weight:700;fill:#6d3fd1}
.tG{fill:#1a7f37}.tR{fill:#c4321c}.tB{fill:#2457d6}.tP{fill:#6d3fd1}.tA{fill:#8a5a00}.tN{fill:#374151}
.w{fill:#ffffff}
.box{stroke-width:1.5}
.spec{fill:#e8efff;stroke:#2457d6}
.agent{fill:#fff4d6;stroke:#b7791f}
.gate{fill:#f0e9ff;stroke:#6d3fd1}
.ok{fill:#e3f6e8;stroke:#1a7f37}
.bad{fill:#fde7e3;stroke:#c4321c}
.neu{fill:#f3f4f6;stroke:#6b7280}
.q{fill:#ffffff;stroke:#374151}
.dark{fill:#1f2430;stroke:#1f2430}
.ln{fill:none;stroke:#6b7280;stroke-width:1.6}
.lnD{fill:none;stroke:#1f2430;stroke-width:1.4}
.lnG{fill:none;stroke:#1a7f37;stroke-width:1.8}
.lnR{fill:none;stroke:#c4321c;stroke-width:1.8}
.lnB{fill:none;stroke:#2457d6;stroke-width:1.6}
.lnP{fill:none;stroke:#6d3fd1;stroke-width:1.6}
.dash{stroke-dasharray:6 5}
</style>`;

const MARKERS = [['a', '#6b7280'], ['aD', '#1f2430'], ['aG', '#1a7f37'], ['aR', '#c4321c'], ['aB', '#2457d6'], ['aP', '#6d3fd1']]
  .map(([id, c]) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="${c}"/></marker>`)
  .join('');

const DEFS = `<defs>${MARKERS}<filter id="sh" x="-5%" y="-5%" width="110%" height="130%"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#1f2430" flood-opacity=".12"/></filter></defs>`;

const SZ = { h: 20, b: 15, t: 15, s: 13, ms: 13.5, m: 14 };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function svg(name, w, h, body) {
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${STYLE}${DEFS}` +
    `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="16" fill="#ffffff" stroke="#e5e7eb"/>${body}</svg>\n`;
  fs.writeFileSync(path.join(__dirname, name + '.svg'), out);
}

function T(x, y, s, cls = 't') {
  return `<text x="${x}" y="${y}" class="${cls}">${esc(s)}</text>`;
}

// Centered multi-line text inside a rectangle. ls: [[text, classes], ...]
function lines(cx, top, h, ls, extra = '') {
  const sizes = ls.map(([, c]) => SZ[c.split(' ')[0]]);
  const gaps = sizes.map(s => s * 1.4);
  let y = top + (h - gaps.reduce((a, b) => a + b, 0)) / 2;
  return ls.map(([t, c], i) => {
    const base = y + gaps[i] / 2 + sizes[i] * 0.35;
    y += gaps[i];
    return `<text x="${cx}" y="${base.toFixed(1)}" class="${c} c ${extra}">${esc(t)}</text>`;
  }).join('');
}

function box(x, y, w, h, cls, ls, o = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 10}" class="box ${cls}" filter="url(#sh)"${o.dash ? ' stroke-dasharray="6 4"' : ''}/>` +
    lines(x + w / 2, y, h, ls, o.light ? 'w' : '');
}

function arrow(pts, cls = 'ln', mk = 'a', o = {}) {
  const d = 'M' + pts.map(p => p.join(',')).join(' L');
  return `<path d="${d}" class="${cls}${o.dash ? ' dash' : ''}" marker-end="url(#${mk})"${o.both ? ` marker-start="url(#${mk})"` : ''}/>`;
}

function legend(x, y, items) {
  let out = '', cx = x;
  for (const [cls, label, w] of items) {
    out += `<rect x="${cx}" y="${y - 11}" width="14" height="14" rx="3" class="box ${cls}"/>` + T(cx + 20, y, label, 's');
    cx += w;
  }
  return out;
}

// 1 · Blast radius ----------------------------------------------------------
{
  let b = '';
  b += `<rect x="20" y="20" width="470" height="480" rx="14" fill="#fff6f4" stroke="#f1c4bb"/>`;
  b += `<rect x="510" y="20" width="470" height="480" rx="14" fill="#f2faf4" stroke="#bfe3c9"/>`;
  b += T(255, 58, 'Today: shared implementation', 'h c');
  b += T(745, 58, 'VDS: shared specification', 'h c');

  const xl = [72, 163, 255, 347, 438];
  xl.forEach(x => b += arrow([[255, 168], [x, 398]], 'lnR', 'aR'));
  b += box(135, 110, 240, 58, 'bad', [['Library v2.3.1', 'b'], ['one vulnerability', 's tR']]);
  ['App 1', 'App 2', 'App 3', 'App …', 'App 10,000'].forEach((t, i) => b += box(xl[i] - 42, 400, 84, 46, 'bad', [[t, 't']]));
  b += T(255, 478, '1 bug → every application affected', 'b c tR');

  const xr = [600, 700, 800, 900];
  xr.forEach(x => b += arrow([[745, 168], [x, 248]], 'ln', 'a'));
  b += box(625, 110, 240, 58, 'spec', [['Spec Package v1.2', 'b'], ['reviewed and signed', 's']]);
  xr.forEach((x, i) => {
    const bad = i === 1;
    b += arrow([[x, 302], [x, 398]], bad ? 'lnR' : 'lnG', bad ? 'aR' : 'aG');
    b += box(x - 42, 250, 84, 52, bad ? 'bad' : 'ok', bad ? [['Impl. 2', 'b'], ['bug', 's tR']] : [[['Impl. 1', '', 'Impl. 3', 'Impl. …'][i], 'b']]);
    b += box(x - 42, 400, 84, 46, bad ? 'bad' : 'ok', [[['App 1', 'App 2', 'App 3', 'App …'][i], 't']]);
  });
  b += T(745, 478, '1 bug → one application affected', 'b c tG');
  svg('blast-radius', 1000, 520, b);
}

// 2 · Core idea -------------------------------------------------------------
{
  let b = '';
  b += T(30, 44, 'Share behavior, not code', 'h');
  b += T(30, 68, 'The specification is the reusable artifact; the implementation is a local, verified build output.', 's');

  b += arrow([[240, 140], [298, 188]]);
  b += arrow([[240, 260], [298, 212]]);
  b += arrow([[480, 200], [548, 200]]);
  b += arrow([[760, 200], [828, 200]], 'lnG', 'aG');
  b += T(794, 190, 'passed', 's c tG');
  b += arrow([[920, 235], [920, 318]], 'lnG', 'aG');
  b += T(932, 282, 'no findings', 's tG');
  b += arrow([[655, 235], [655, 290], [390, 290], [390, 237]], 'lnR', 'aR');
  b += T(522, 312, 'failure → next round', 's c tR');
  b += arrow([[920, 165], [920, 118], [655, 118], [655, 163]], 'lnP', 'aP');
  b += T(787, 108, 'finding becomes a test', 's c tP');

  b += box(30, 110, 210, 60, 'spec', [['Spec Package', 'b'], ['Behavior · Invariants · Tests', 's']]);
  b += box(30, 230, 210, 60, 'neu', [['Project profile', 'b'], ['Language · Constraints', 's']]);
  b += box(300, 165, 180, 70, 'agent', [['Synthesizer agent', 'b'], ['Model A · sandbox', 's']]);
  b += box(550, 165, 210, 70, 'gate', [['Deterministic gates', 'b'], ['Build · Conformance · Fuzzing', 's']]);
  b += box(830, 165, 180, 70, 'agent', [['Adversarial verifier', 'b'], ['Model B · block only', 's']]);
  b += box(830, 320, 180, 70, 'ok', [['Implementation', 'b'], ['+ Spec Lock + provenance', 's']]);

  b += legend(30, 376, [['spec', 'Shared and signed', 160], ['agent', 'Agent · untrusted', 180], ['gate', 'Deterministic · approves', 200], ['ok', 'Result in the project', 160]]);
  svg('core-idea', 1040, 420, b);
}

// 3 · Quadrant --------------------------------------------------------------
{
  let b = '';
  const X = v => 110 + v * 750, Y = v => 560 - v * 500;
  b += T(110, 40, 'Where does synthesis pay off?', 'h');
  b += `<rect x="110" y="60" width="375" height="250" fill="#eef3ff"/><rect x="485" y="60" width="375" height="250" fill="#f5f0ff"/>`;
  b += `<rect x="110" y="310" width="375" height="250" fill="#f5f6f8"/><rect x="485" y="310" width="375" height="250" fill="#e9f7ee"/>`;
  b += `<rect x="110" y="60" width="750" height="500" fill="none" stroke="#d1d5db"/>`;
  b += `<line x1="485" y1="60" x2="485" y2="560" stroke="#d1d5db"/><line x1="110" y1="310" x2="860" y2="310" stroke="#d1d5db"/>`;
  b += T(126, 88, 'Verified central library', 'b tB');
  b += T(844, 88, 'Hybrid: synthesis on primitives', 'b e tP');
  b += T(126, 545, 'Standard library or trivial', 'b tN');
  b += T(844, 545, 'VDS sweet spot', 'h e tG');

  const pts = [
    ['Crypto primitives', .10, .86, '#2457d6'], ['TLS core', .26, .76, '#2457d6'], ['Compression', .14, .62, '#2457d6'],
    ['Protocol adapter', .80, .62, '#6d3fd1'],
    ['HTTP client', .66, .42, '#1a7f37'], ['Format parser', .76, .36, '#1a7f37'], ['Serialization', .58, .28, '#1a7f37'],
    ['Config loader', .86, .20, '#1a7f37'], ['Retry logic', .70, .12, '#1a7f37'],
    ['left-pad', .30, .12, '#6b7280'],
  ];
  for (const [n, px, py, c] of pts) {
    b += `<circle cx="${X(px)}" cy="${Y(py)}" r="7" fill="${c}" stroke="#fff" stroke-width="2"/>` + T(X(px) + 13, Y(py) + 5, n, 'ms');
  }
  b += T(485, 592, 'Project specificity →', 'b c');
  b += T(110, 592, 'low', 's');
  b += T(860, 592, 'high', 's e');
  b += `<text transform="translate(66,310) rotate(-90)" class="b c">Verification cost →</text>`;
  b += `<text transform="translate(92,560) rotate(-90)" class="s">cheap, automated</text>`;
  b += `<text transform="translate(92,60) rotate(-90)" class="s e">expensive to prove</text>`;
  svg('quadrant', 900, 620, b);
}

// 4 · Decision tree ---------------------------------------------------------
{
  let b = '';
  const q = (y, l1, l2) => box(120, y, 420, 64, 'q', [[l1, 'b'], [l2, 's']]) +
    `<circle cx="146" cy="${y + 32}" r="12" fill="#374151"/><text x="146" y="${y + 37}" class="b c w">?</text>`;
  const r = (y, cls, l1, l2, o) => box(630, y, 280, 64, cls, [[l1, 'b'], [l2, 's']], o);
  const yes = (x, y) => T(x, y, 'yes', 's c tG');
  const no = (x, y) => T(x, y, 'no', 's c tR');

  b += `<rect x="190" y="24" width="280" height="44" rx="22" class="dark" filter="url(#sh)"/>` + T(330, 51, 'New dependency needed', 'b c w');
  b += arrow([[330, 68], [330, 108]]);
  [[110, 230], [230, 350], [350, 470], [470, 588]].forEach(([y1, y2]) => b += arrow([[330, y1 + 64], [330, y2 - 2]]));
  [110, 230, 350, 470].forEach(y => b += arrow([[540, y + 32], [628, y + 32]]));

  b += q(110, 'Complex, stable primitive?', 'Cryptography · TLS · Compression');
  b += q(230, 'Sufficiently verifiable automatically?', 'Tests · Properties · Fuzzing');
  b += q(350, 'Is there a spec package?', 'in the spec registry');
  b += q(470, 'Is a specification worth it?', 'Adoption · Risk · Attack surface');

  b += yes(584, 134); b += no(584, 254); b += yes(584, 374); b += yes(584, 494);
  b += no(346, 205); b += yes(348, 325); b += no(346, 445); b += no(346, 565);

  b += r(110, 'spec', 'Verified central library', 'include as a primitive');
  b += r(230, 'neu', 'Conventional library', 'pinned · audited · SBOM');
  b += r(350, 'ok', 'Verified Dependency Synthesis', 'synthesize and verify');
  b += r(470, 'ok', 'Write a spec package', 'then synthesize', { dash: true });
  b += box(190, 590, 280, 64, 'neu', [['Conventional library', 'b'], ['pinned · audited · SBOM', 's']]);
  svg('decision-tree', 940, 680, b);
}

// 5 · Architecture ----------------------------------------------------------
{
  let b = '';
  b += `<rect x="20" y="20" width="1060" height="180" rx="14" fill="#f3faf5" stroke="#1a7f37"/>`;
  b += `<text x="40" y="48"><tspan class="b tG">Trust base</tspan><tspan class="s"> · reviewed, signed, deterministic</tspan></text>`;
  b += `<rect x="20" y="400" width="500" height="210" rx="14" fill="#fffaf0" stroke="#b7791f" stroke-dasharray="7 5"/>`;
  b += `<text x="40" y="428"><tspan class="b tA">Untrusted</tspan><tspan class="s"> · until the gates pass</tspan></text>`;
  b += `<rect x="580" y="400" width="500" height="210" rx="14" fill="#f6f7f9" stroke="#9ca3af"/>`;
  b += T(600, 428, 'Project repository', 'b tN');

  b += arrow([[180, 165], [180, 285], [398, 285]], 'lnB', 'aB');
  b += T(192, 240, 'spec packages', 's tB');
  b += arrow([[530, 250], [530, 167]], 'lnP', 'aP');
  b += T(522, 214, 'verify', 's e tP');
  b += arrow([[570, 167], [570, 248]], 'lnP', 'aP');
  b += T(578, 214, 'result', 's tP');
  b += arrow([[985, 165], [985, 468]], 'lnB', 'aB', { dash: true });
  b += T(995, 300, 'included', 's tB');
  b += arrow([[440, 320], [152, 468]], 'ln', 'a', { both: true });
  b += arrow([[480, 320], [392, 468]], 'ln', 'a', { both: true });
  b += arrow([[675, 470], [645, 322]]);
  b += arrow([[680, 320], [828, 468]]);
  b += arrow([[700, 305], [950, 468]]);

  b += box(60, 75, 240, 90, 'spec', [['Spec registry', 'b'], ['signed spec packages', 's']]);
  b += box(420, 75, 260, 90, 'gate', [['Deterministic gates', 'b'], ['Compiler · Conformance · Fuzzer', 's'], ['Sanitizers · static analysis', 's']]);
  b += box(800, 75, 240, 90, 'spec', [['Verified primitives', 'b'], ['Crypto · TLS · Compression', 's']]);
  b += box(400, 250, 300, 70, 'dark', [['specbase CLI', 'b'], ['Orchestration · sandbox, no network', 's']], { light: true });
  b += box(50, 470, 200, 90, 'agent', [['Synthesizer agent', 'b'], ['Model A', 's'], ['generates code + tests', 's']]);
  b += box(290, 470, 200, 90, 'agent', [['Adversarial verifier', 'b'], ['Model B', 's'], ['reports findings as tests', 's']]);
  b += box(605, 470, 140, 90, 'neu', [['specbase.yaml', 'm'], ['project profile', 's']]);
  b += box(760, 470, 140, 90, 'ok', [['spec.lock', 'm'], ['digests +', 's'], ['provenance', 's']]);
  b += box(915, 470, 140, 90, 'ok', [['synthesized/', 'm'], ['generated code', 's']]);
  svg('architecture', 1100, 630, b);
}

// 6 · Spec package ----------------------------------------------------------
{
  let b = '';
  b += `<text x="40" y="54"><tspan class="h">Spec package </tspan><tspan class="m" style="font-size:19px">http-client/</tspan></text>`;
  b += T(40, 78, 'Distributable unit: the contract is shared, not the code.', 's');
  const cols = [
    ['Contract', '#2457d6', 'spec', [
      ['spec.md', 'Normative specification (MUST/SHOULD)'],
      ['interface.yaml', 'Language-neutral interface'],
      ['invariants.yaml', 'Security and resource invariants'],
      ['profile.schema.json', 'Constraints a profile may set'],
      ['threat-model.md', 'Attack classes, assumptions, scope'],
    ]],
    ['Conformance suite', '#6d3fd1', 'gate', [
      ['harness.md', 'Black-box protocol (stdin/stdout)'],
      ['vectors/', 'Input → expected behavior'],
      ['properties/', 'Language-neutral properties'],
      ['fuzz/', 'Fuzz targets, seed corpus, duration'],
      ['adversarial/', 'Known attack classes'],
    ]],
    ['Trust and optional parts', '#1a7f37', null, [
      ['SIGNATURE', 'Signature of the spec maintainers', 'ok'],
      ['reference/', 'Only for differential testing', 'neu'],
    ]],
  ];
  cols.forEach(([title, color, cls, items], ci) => {
    const x = 40 + ci * 317;
    b += `<rect x="${x}" y="104" width="290" height="32" rx="8" fill="${color}"/>` + T(x + 14, 125, title, 'b w');
    items.forEach(([f, d, c], i) => {
      const y = 148 + i * 70;
      b += `<rect x="${x}" y="${y}" width="290" height="60" rx="10" class="box ${c || cls}" filter="url(#sh)"/>`;
      b += T(x + 16, y + 25, f, 'm') + T(x + 16, y + 45, d, 's');
    });
  });
  const nx = 40 + 2 * 317;
  b += `<rect x="${nx}" y="300" width="290" height="186" rx="10" fill="#fafafa" stroke="#9ca3af" stroke-dasharray="6 4"/>`;
  b += T(nx + 16, 332, 'Language-neutral verification', 'b');
  ['Every implementation includes a small', 'conformance adapter. The same suite', 'then runs as a black box against', 'Go, Rust or C.']
    .forEach((l, i) => b += T(nx + 16, 360 + i * 22, l, 's'));
  svg('spec-package', 1000, 520, b);
}

// 7 · Sequence --------------------------------------------------------------
{
  let b = '';
  const X = { dev: 95, cli: 280, reg: 465, syn: 650, gate: 835, ver: 1015 };
  const msg = (a, z, y, n, text, o = {}) =>
    arrow([[X[a], y], [X[z], y]], o.cls || 'lnD', o.mk || 'aD', { dash: o.dash }) +
    `<text x="${(X[a] + X[z]) / 2}" y="${y - 8}" class="ms c"><tspan class="num">${n}</tspan> ${esc(text)}</text>`;
  const self = (a, y, n, text, cls = '') =>
    `<path d="M${X[a]},${y} h34 v20 h-32" class="lnD" marker-end="url(#aD)"/>` +
    `<text x="${X[a] + 44}" y="${y + 15}" class="ms ${cls}"><tspan class="num">${n}</tspan> ${esc(text)}</text>`;
  const frame = (x, y, w, h, label) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="none" stroke="#9ca3af" stroke-width="1.2"/>` +
    `<rect x="${x}" y="${y}" width="${label.length * 7 + 22}" height="24" rx="8" fill="#eef0f3" stroke="#9ca3af" stroke-width="1.2"/>` +
    T(x + 11, y + 16, label, 's b tN');

  Object.values(X).forEach(x => b += `<line x1="${x}" y1="72" x2="${x}" y2="850" stroke="#c3c8d1" stroke-dasharray="4 4"/>`);
  b += frame(190, 318, 735, 185, 'Loop · until all gates pass (max. N rounds)');
  b += frame(190, 608, 900, 182, 'Alternative');
  b += `<line x1="190" y1="690" x2="1090" y2="690" stroke="#9ca3af" stroke-dasharray="6 4"/>`;
  b += T(1078, 630, '[finding reproduced]', 's b e tR');
  b += T(1078, 710, '[no findings]', 's b e tG');

  b += box(15, 20, 160, 52, 'neu', [['Developer', 'b']]);
  b += box(200, 20, 160, 52, 'dark', [['specbase CLI', 'b']], { light: true });
  b += box(385, 20, 160, 52, 'spec', [['Spec registry', 'b']]);
  b += box(570, 20, 160, 52, 'agent', [['Synthesizer', 'b'], ['Model A', 's']]);
  b += box(755, 20, 160, 52, 'gate', [['Gates', 'b'], ['deterministic', 's']]);
  b += box(935, 20, 160, 52, 'agent', [['Verifier', 'b'], ['Model B', 's']]);

  b += msg('dev', 'cli', 112, 1, 'specbase add http-client');
  b += msg('cli', 'reg', 152, 2, 'Request spec package');
  b += msg('reg', 'cli', 192, 3, 'Spec + suite + signature', { dash: true });
  b += self('cli', 212, 4, 'Verify signature and profile');
  b += msg('dev', 'cli', 290, 5, 'specbase synthesize');
  b += msg('cli', 'syn', 368, 6, 'Spec + profile + previous failures');
  b += T((X.cli + X.syn) / 2, 386, 'in a sandbox, no network', 's c');
  b += msg('syn', 'cli', 418, 7, 'Code + conformance adapter + tests', { dash: true });
  b += msg('cli', 'gate', 456, 8, 'Build · Conformance · Properties · Fuzzing · Sanitizers');
  b += msg('gate', 'cli', 488, 9, 'Result', { dash: true });
  b += msg('cli', 'ver', 548, 10, 'Code + spec + threat model: “Find vulnerabilities”');
  b += msg('ver', 'cli', 586, 11, 'Findings as reproducible test cases', { dash: true });
  b += self('cli', 645, 12, 'Add test to the suite, back to step 6', 'tR');
  b += self('cli', 718, 13, 'Write spec.lock + provenance', 'tG');
  b += msg('cli', 'dev', 772, 14, 'Diff for review', { dash: true });
  b += self('dev', 812, 15, 'Review and commit');
  svg('pipeline-sequence', 1110, 870, b);
}

// 8 · Lifecycle -------------------------------------------------------------
{
  let b = '';
  b += `<circle cx="30" cy="140" r="9" fill="#1f2430"/>` + arrow([[39, 140], [68, 140]], 'lnD', 'aD');
  b += arrow([[210, 140], [288, 140]], 'lnD', 'aD');
  b += T(250, 130, 'synthesize', 's c');
  b += arrow([[430, 140], [508, 140]], 'lnG', 'aG');
  b += T(470, 116, 'gates', 's c tG') + T(470, 130, 'passed', 's c tG');
  b += arrow([[650, 140], [728, 140]], 'lnD', 'aD');
  b += T(690, 130, 'verifier', 's c');
  b += arrow([[870, 140], [948, 140]], 'lnG', 'aG');
  b += T(910, 116, 'no', 's c tG') + T(910, 130, 'findings', 's c tG');

  b += `<path d="M322,110 C318,66 362,66 358,108" class="lnR" marker-end="url(#aR)"/>`;
  b += T(340, 60, 'gate failure', 's c tR');
  b += arrow([[800, 110], [800, 40], [400, 40], [400, 108]], 'lnR', 'aR');
  b += T(600, 32, 'finding reproduced', 's c tR');
  b += arrow([[1020, 170], [1020, 338]], 'lnD', 'aD');
  b += T(1010, 260, 'review + commit', 's e');
  b += arrow([[950, 358], [667, 358]], 'lnP', 'aP');
  b += T(808, 296, 'Triggers', 's b c tP');
  b += T(808, 312, 'new spec version', 's c') + T(808, 328, 'new attack class', 's c') + T(808, 344, 'profile changed', 's c');
  b += arrow([[665, 384], [948, 384]], 'lnG', 'aG');
  b += T(808, 404, 'still passes', 's c tG');
  b += arrow([[495, 370], [360, 370], [360, 172]], 'lnR', 'aR');
  b += T(370, 290, 'no longer passes', 's tR');

  b += box(70, 110, 140, 60, 'q', [['Specified', 'b']]);
  b += box(290, 110, 140, 60, 'agent', [['Synthesized', 'b']]);
  b += box(510, 110, 140, 60, 'gate', [['Verified', 'b']]);
  b += box(730, 110, 140, 60, 'agent', [['Attacked', 'b']]);
  b += box(950, 110, 140, 60, 'ok', [['Locked', 'b'], ['spec.lock', 's']]);
  b += box(495, 340, 170, 60, 'gate', [['Revalidation', 'b']]);
  b += box(950, 340, 140, 60, 'ok', [['Deployed', 'b']], { rx: 30 });
  svg('lifecycle', 1120, 430, b);
}

// 9 · Revalidation ----------------------------------------------------------
{
  let b = '';
  b += arrow([[210, 150], [258, 150]]);
  b += arrow([[440, 150], [488, 150]]);
  b += arrow([[670, 138], [758, 78]], 'lnG', 'aG');
  b += T(706, 98, 'passes', 's e tG');
  b += arrow([[670, 162], [758, 222]], 'lnR', 'aR');
  b += T(706, 214, 'fails', 's e tR');
  b += arrow([[930, 225], [978, 225]], 'lnG', 'aG');

  b += box(30, 115, 180, 70, 'bad', [['New attack class', 'b'], ['e.g. a smuggling variant', 's']]);
  b += box(260, 115, 180, 70, 'spec', [['Conformance suite', 'b'], ['extended with test cases', 's']]);
  b += box(490, 115, 180, 70, 'gate', [['specbase audit', 'm'], ['in every project', 's']]);
  b += box(760, 40, 170, 70, 'ok', [['Still valid', 'b'], ['no change needed', 's']]);
  b += box(760, 190, 170, 70, 'agent', [['Re-synthesis', 'b'], ['+ all gates', 's']]);
  b += box(980, 190, 150, 70, 'ok', [['Newly verified', 'b'], ['implementation', 's']]);
  svg('revalidation', 1160, 300, b);
}

// 10 · Diversity ------------------------------------------------------------
{
  let b = '';
  [130, 370, 630, 870].forEach(x => b += arrow([[500, 90], [x, 148]]));
  [[130, 420], [370, 470], [630, 530], [870, 580]].forEach(([x, e]) => b += arrow([[x, 220], [e, 288]], 'lnP', 'aP'));
  b += arrow([[420, 360], [282, 428]], 'lnR', 'aR');
  b += T(338, 392, 'Divergence', 's b e tR');
  b += arrow([[580, 360], [718, 428]], 'lnG', 'aG');
  b += T(662, 392, 'Agreement', 's b tG');

  b += box(400, 30, 200, 60, 'spec', [['Spec Package', 'b']]);
  b += box(30, 150, 200, 70, 'agent', [['Synthesis 1', 'b'], ['Model A · Go', 's']]);
  b += box(270, 150, 200, 70, 'agent', [['Synthesis 2', 'b'], ['Model B · Rust', 's']]);
  b += box(530, 150, 200, 70, 'agent', [['Synthesis 3', 'b'], ['Model C · other architecture', 's']]);
  b += box(770, 150, 200, 70, 'spec', [['Reference impl.', 'b'], ['from the spec package', 's']]);
  b += box(330, 290, 340, 70, 'gate', [['Differential testing', 'b'], ['same inputs → same behavior?', 's']]);
  b += box(120, 430, 320, 70, 'bad', [['Bug in one implementation', 'b'], ['or a gap in the specification', 's']]);
  b += box(560, 430, 320, 70, 'ok', [['Higher confidence', 'b'], ['in all implementations', 's']]);
  svg('diversity', 1000, 530, b);
}

// 11 · Experiment -----------------------------------------------------------
{
  let b = '';
  b += arrow([[230, 135], [298, 80]]);
  b += arrow([[230, 155], [298, 210]]);
  b += arrow([[510, 75], [578, 132]], 'lnP', 'aP');
  b += arrow([[510, 215], [578, 158]], 'lnP', 'aP');
  b += arrow([[800, 145], [858, 145]], 'lnG', 'aG');

  b += box(30, 110, 200, 70, 'spec', [['Choose a component', 'b'], ['with an existing suite', 's']]);
  b += box(300, 40, 210, 70, 'agent', [['N syntheses', 'b'], ['Models · Languages · Profiles', 's']]);
  b += box(300, 180, 210, 70, 'neu', [['Established library', 'b'], ['as baseline', 's']]);
  b += box(580, 100, 220, 90, 'gate', [['Same checks', 'b'], ['Suite · Fuzzing · Mutation', 's'], ['external audit', 's']]);
  b += box(860, 110, 140, 70, 'ok', [['Comparison', 'b'], ['metrics from §9.2', 's']]);
  svg('experiment', 1030, 290, b);
}

// 12 · Roadmap --------------------------------------------------------------
{
  let b = '';
  const phases = [
    ['Phase A', 'Spec-Driven Generation', '#1a7f37', '#e3f6e8',
      ['Pick one component', 'Spec format + harness', 'Pipeline + gates', 'Evaluation (§9)'],
      ['Metrics at least on par with', 'the established library']],
    ['Phase B', 'Dependency-free Secure Builds', '#b7791f', '#fff4d6',
      ['Spec registry + signatures', '5–10 spec packages', 'CI integration + audit'],
      ['Real projects replace small', 'dependencies with VDS']],
    ['Phase C', 'Agentic Software Substrate', '#6d3fd1', '#f0e9ff',
      ['Base layer entirely from specs', 'Automatic revalidation', 'Agentic development on top'],
      ['The base layer is synthesized,', 'revalidated and extended automatically']],
  ];
  phases.forEach(([name, sub, c, light, steps, goal], i) => {
    const x = 30 + i * 360;
    b += `<rect x="${x}" y="30" width="320" height="320" rx="14" fill="#fff" stroke="${c}" stroke-width="1.5" filter="url(#sh)"/>`;
    b += `<path d="M${x},44 a14,14 0 0 1 14,-14 h292 a14,14 0 0 1 14,14 v60 h-320 z" fill="${light}"/>`;
    b += `<text x="${x + 20}" y="64" class="h" style="fill:${c}">${name}</text>` + T(x + 20, 90, sub, 'b');
    steps.forEach((s, j) => {
      const y = 138 + j * 36;
      b += `<circle cx="${x + 30}" cy="${y}" r="11" fill="${c}"/>` + T(x + 30, y + 4.5, String(j + 1), 's b c w') + T(x + 52, y + 5, s, 't');
    });
    b += `<rect x="${x + 16}" y="266" width="288" height="68" rx="10" fill="${light}"/>`;
    b += `<text x="${x + 30}" y="288" class="s b" style="fill:${c}">Success criterion</text>`;
    goal.forEach((g, j) => b += T(x + 30, 307 + j * 18, g, 's'));
    if (i < 2) b += `<path d="M${x + 333},172 l16,18 l-16,18" fill="none" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  });
  svg('roadmap', 1100, 380, b);
}

console.log('ok');
