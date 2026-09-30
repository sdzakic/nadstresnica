// Page wiring: state, controls, and keeping the model, drawing and material list in sync.
(function (N7) {
  const $ = id => document.getElementById(id);
  const f = N7.fmt;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const p = Object.assign({}, N7.DEFAULTS);
  p.HL = N7.resolveHL(p);
  let roofKind = 'sandwich';
  let anim = null;
  let d = null;

  const scene = N7.createScene($('stage'));

  const INPUTS = {
    'in-D': { key: 'D', min: 2, max: 12 },
    'in-WL': { key: 'WL', min: 4.9, max: 8 },
    'in-gap': { key: 'gap', min: 0, max: 1.5 },
    'in-HH': { key: 'HH', min: 2.4, max: 3.6 },
    'in-HL': { key: 'HL', min: 1.8, max: 3.6 },
    'in-GW': { key: 'GW', min: N7.FIX.garage.minW, max: N7.FIX.garage.maxW }
  };

  function pressed(group, v) { group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); }

  function refresh(hl, light) {
    d = N7.derive(p, hl);
    scene.update(d);
    N7.renderElevation($('elev'), d);
    $('ro-plan').textContent = f(d.WL) + ' × ' + f(d.D) + ' m';
    $('ro-hh').textContent = f(d.HH) + ' m';
    $('ro-end').textContent = f(d.HL) + ' m';
    $('ro-w').textContent = f(d.W) + ' m';
    $('ro-gap').textContent = Math.round(d.gap * 100) + ' cm';
    $('ro-pitch').textContent = '≈ ' + f(d.pitchDeg, 1) + '° (' + Math.round(d.pitchPct) + ' %)';
    $('ro-garage').textContent = f(d.GW) + ' × ' + f(d.GH) + ' m';
    const gxIn = $('in-GX');
    gxIn.min = d.gxMin.toFixed(2); gxIn.max = d.gxMax.toFixed(2); gxIn.value = d.gx.toFixed(2);
    gxIn.disabled = d.gxMax - d.gxMin < 0.01;
    $('gx-out').textContent = f(d.gx - N7.FIX.pillar.x1) + ' m od stupića';
    if (light) return;
    const label = p.mode === 'high' ? 'Najviša' : p.mode === 'low' ? 'Niža' : 'Vlastita';
    $('elev-note').textContent = `Prikazano: ${label} varijanta · kraj krova ${f(d.HL)} m · pad ${f(d.pitchDeg, 1)}° · garažna vrata ${f(d.GW)} × ${f(d.GH)} m${d.lowHeadroom ? ' (okov za nisku nadvisinu)' : ''}.`;
    $('pn-pitch').textContent = f(d.pitchDeg, 1) + '°';
    $('h-high-sub').textContent = f(N7.maxHL(p)) + ' m na kraju';
    $('warn').innerHTML = d.warnings.map(w => `<li>${w}</li>`).join('');
    $('warn').hidden = !d.warnings.length;
    const groups = N7.materials(d, roofKind);
    renderPrint(groups);
    N7.renderMaterials($('bom'), groups);
    $('bom-copy').onclick = () => copyText(N7.materialsText(groups));
    Object.entries(INPUTS).forEach(([id, c]) => { if (document.activeElement !== $(id)) $(id).value = (c.key === 'HL' ? d.HL : p[c.key]).toFixed(2); });
    pressed($('o-height'), p.mode);
  }

  function animateHL(from, to) {
    if (reduce || Math.abs(from - to) < 1e-6) { refresh(); return; }
    const s = performance.now(), ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    if (anim) cancelAnimationFrame(anim);
    const step = now => {
      const k = Math.min(1, (now - s) / 900);
      if (k < 1) { refresh(from + (to - from) * ease(k), true); anim = requestAnimationFrame(step); }
      else { anim = null; refresh(); }
    };
    anim = requestAnimationFrame(step);
  }

  function copyText(txt) {
    const btn = $('bom-copy');
    const done = ok => { btn.textContent = ok ? 'Kopirano' : 'Označi i kopiraj ručno'; setTimeout(() => { btn.textContent = 'Kopiraj popis'; }, 2000); };
    try { navigator.clipboard.writeText(txt).then(() => done(true), () => done(false)); } catch (e) { done(false); }
  }

  // ---------- print sheet (two A4 landscape pages)
  function renderPrint(groups) {
    N7.renderElevation($('ps-front'), d, 'pf');
    N7.renderSection($('ps-section'), d);
    N7.renderPlan($('ps-plan'), d);
    N7.renderSide($('ps-side'), d);
    const label = p.mode === 'high' ? 'najviša' : p.mode === 'low' ? 'niža' : 'vlastita';
    const today = new Date().toLocaleDateString('hr-HR');
    document.querySelectorAll('.ps-meta').forEach(m => { m.textContent = `${label} varijanta krova · ${today}`; });
    const rows = [
      ['Tlocrt nadstrešnice', `${f(d.WL)} × ${f(d.D)} m`], ['Širina krova', `${f(d.W)} m (${f(d.gap)} m od susjeda)`],
      ['Visina uz kuću / na kraju', `${f(d.HH)} / ${f(d.HL)} m`], ['Pad krova', `${f(d.pitchDeg, 1)}° (${Math.round(d.pitchPct)} %)`],
      ['Ulazna vrata', `${f(N7.FIX.door.x1 - N7.FIX.door.x0)} × ${f(N7.FIX.door.h)} m, ${f(N7.FIX.door.x0)} m od kuće, šarke desno`],
      ['Garažna vrata', `${f(d.GW)} × ${f(d.GH)} m, ${f(d.gx)} m od kuće${d.lowHeadroom ? ', niska nadvisina' : ''}`],
      ['Stupovi / rogovi', `${d.nSide + 1} × □100×100 · ${d.nRafters} × □120×60`]
    ];
    $('ps-specs').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const roofName = { sandwich: 'sendvič panel 40 mm', poly: 'polikarbonat 16 mm', trap: 'trapezni lim' }[roofKind];
    $('ps-bom').innerHTML = `<p class="ps-bom-meta">Krov: ${roofName} · tlocrt ${f(d.WL)} × ${f(d.D)} m · kraj krova ${f(d.HL)} m · garažna vrata ${f(d.GW)} × ${f(d.GH)} m</p>` +
      groups.map(g => `<table><thead><tr><th colspan="3">${g.title}</th></tr></thead><tbody>${g.rows.map(r => `<tr><td>${r[0]}</td><td class="q">${r[1]}</td><td class="n">${r[2]}</td></tr>`).join('')}</tbody></table>`).join('');
  }
  // Inside an embedded preview the browser blocks printing, so the button opens the published site instead.
  const embedded = window.self !== window.top;
  const pb = $('print-btn');
  if (embedded) { pb.href = 'https://nadstresnica.slobo.eu/#ispis'; pb.target = '_blank'; pb.rel = 'noopener'; pb.textContent = 'Ispiši crteže (otvara stranicu)'; }
  else pb.addEventListener('click', e => { e.preventDefault(); window.print(); });

  // ---------- controls
  $('o-height').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const from = d.HL; p.mode = b.dataset.v; p.HL = N7.resolveHL(p); animateHL(from, p.HL);
  });
  [['o-roof', v => { roofKind = v; scene.setRoof(v); refresh(); }], ['o-garage', v => scene.setGarage(v)], ['o-fence', v => scene.setFence(v)]].forEach(([id, fn]) => {
    const g = $(id);
    g.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; pressed(g, b.dataset.v); fn(b.dataset.v); });
  });
  Object.entries(INPUTS).forEach(([id, c]) => {
    $(id).addEventListener('change', e => {
      const v = parseFloat(String(e.target.value).replace(',', '.'));
      if (!isFinite(v)) { refresh(); return; }
      p[c.key] = Math.min(c.max, Math.max(c.min, v));
      if (c.key === 'HL') p.mode = 'custom';
      else if (p.mode !== 'custom') p.HL = N7.resolveHL(p);
      refresh();
    });
  });
  $('in-GX').addEventListener('input', e => { p.gx = parseFloat(e.target.value); refresh(); });
  $('gx-auto').addEventListener('click', () => { p.gx = null; refresh(); });
  $('dims-reset').addEventListener('click', () => {
    Object.assign(p, N7.MEASURED, { mode: 'high', GW: N7.FIX.garage.w, gx: null }); p.HL = N7.resolveHL(p); refresh();
  });

  const vg = document.querySelector('.views');
  vg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; vg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); scene.go(b.id.slice(2)); });
  [['d-garage', 'garage', 'Otvori garažna vrata', 'Zatvori garažna vrata'], ['d-entry', 'entry', 'Otvori ulazna vrata', 'Zatvori ulazna vrata']].forEach(([id, key, o, c]) => {
    const b = $(id);
    b.addEventListener('click', () => { const open = scene.toggleDoor(key); b.setAttribute('aria-pressed', open); b.textContent = open ? c : o; });
  });

  refresh();
  N7.initGallery($('gallery'), $('lb'));
  if (!embedded && location.hash === '#ispis') setTimeout(() => window.print(), 800);
})(window.N7);
