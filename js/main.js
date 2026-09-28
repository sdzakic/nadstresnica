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
})(window.N7);
