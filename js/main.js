// Page wiring: state, controls, and keeping the model, drawing and material list in sync.
(function (N7) {
  const $ = id => document.getElementById(id);
  const f = N7.fmt;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const p = Object.assign({}, N7.DEFAULTS);
  p.HL = N7.resolveHL(p);
  let anim = null;
  const look = { sheet: 'anth', garage: 'anth', door: 'anth' };
  let d = null, groups = [];
  // own unit prices, remembered per browser; a missing key means the default price
  const PKEY = 'n7-prices';
  let prices = {};
  try { prices = JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) { prices = {}; }
  const savePrices = () => { try { localStorage.setItem(PKEY, JSON.stringify(prices)); } catch (e) { /* storage blocked */ } };
  const bomOpt = { slab: true, mix: 3 };

  const scene = N7.createScene($('stage'));

  const INPUTS = {
    'in-D': { key: 'D', min: 2, max: 12 },
    'in-WL': { key: 'WL', min: 4.9, max: 8 },
    'in-gap': { key: 'gap', min: 0.25, max: 1.5 },   // room for the gutter and the downpipe
    'in-HH': { key: 'HH', min: 2.4, max: 3.6 },
    'in-HL': { key: 'HL', min: 1.8, max: 3.6 },
    'in-GW': { key: 'GW', min: N7.FIX.garage.minW, max: N7.FIX.garage.maxW },
    'in-sk': { key: 'sk', min: 0.5, max: 5 },
    'in-qp': { key: 'qp', min: 0.2, max: 2 },
    'in-DH': { key: 'doorH', min: 1.9, max: 2.5 }
  };

  function pressed(group, v) { group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); }

  function refresh(hl, light) {
    d = N7.derive(p, hl);
    scene.update(d);
    stlInfo();
    N7.renderElevation($('elev'), d, 'e', look);
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
    $('gx-out').textContent = f(d.gx - N7.FIX.door.x1) + ' m od ulaznih vrata' + (d.attached ? ' · na kutnom stupu' : '');
    syncHeight();
    if (light) return;
    const label = p.mode === 'high' ? 'Najviša' : p.mode === 'low' ? 'Najniža' : 'Vlastita';
    $('elev-note').textContent = `Prikazano: ${label} varijanta · kraj krova ${f(d.HL)} m · pad ${f(d.pitchDeg, 1)}° · garažna vrata ${f(d.GW)} × ${f(d.GH)} m${d.lowHeadroom ? ' (okov za nisku nadvisinu)' : ''}.`;
    $('pn-pitch').textContent = f(d.pitchDeg, 1) + '°';
    $('warn').innerHTML = d.warnings.map(w => `<li>${w}</li>`).join('');
    $('warn').hidden = !d.warnings.length;
    groups = N7.materials(d, p.roof, look, bomOpt);
    const stGroups = N7.staticsReport(d);
    renderStatics(stGroups);
    renderPrint(groups, stGroups);
    N7.renderMaterials($('bom'), groups, prices);
    $('bom-sum').textContent = N7.euro(N7.costs(groups, prices).total);
    Object.entries(INPUTS).forEach(([id, c]) => { if (document.activeElement !== $(id)) $(id).value = (c.key === 'HL' ? d.HL : p[c.key]).toFixed(2); });
    if (document.activeElement !== $('in-BR')) $('in-BR').value = brText();
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
  function statTable(groups) {
    const chip = s => s === 'ok' ? '<span class="chip ok">prolazi</span>' : s === 'fail' ? '<span class="chip bad">ne prolazi</span>' : '';
    return '<thead><tr><th scope="col">Provjera</th><th scope="col">Rezultat</th><th scope="col">Napomena</th><th scope="col"></th></tr></thead>' +
      groups.map(g => `<tbody><tr class="grp"><th colspan="4" scope="colgroup">${g.title}</th></tr>${g.rows.map(r => `<tr><td>${r[0]}</td><td class="q">${r[1]}</td><td class="n">${r[2]}</td><td>${chip(r[3])}</td></tr>`).join('')}</tbody>`).join('');
  }
  function renderStatics(stGroups) {
    $('st-table').innerHTML = statTable(stGroups);
    const st = d.st;
    $('st-summary').innerHTML = st.fail
      ? '<b>Neki element ne prolazi</b> ni s najvećim profilom iz popisa. Smanji razmak rogova ili pitaj statičara.'
      : `S ovim mjerama nosivi elementi prolaze uz rogove <b>${st.rafter.s.name}</b>${st.purlin ? `, ${st.nPurlins} podrožnice <b>${st.purlin.s.name}</b>` : ''}, bočnu gredu <b>${st.beam.s.name}</b> i stupove <b>${st.post.s.name}</b>. Najveće iskorištenje: ${Math.round(Math.max(st.rafter.uM, st.rafter.uW, st.rafter.uD || 0) * 100)} % (rogovi).`;
  }
  function renderPrint(groups, stGroups) {
    N7.renderElevation($('ps-front'), d, 'pf', look);
    N7.renderSection($('ps-section'), d);
    N7.renderPlan($('ps-plan'), d);
    N7.renderSide($('ps-side'), d);
    const label = p.mode === 'high' ? 'najviša' : p.mode === 'low' ? 'najniža' : 'vlastita';
    const today = new Date().toLocaleDateString('hr-HR');
    document.querySelectorAll('.ps-meta').forEach(m => { m.textContent = `${label} varijanta krova · ${today}`; });
    const rows = [
      ['Tlocrt nadstrešnice', `${f(d.WL)} × ${f(d.D)} m`], ['Širina krova', `${f(d.W)} m (${f(d.gap)} m od susjeda)`],
      ['Visina uz kuću / na kraju', `${f(d.HH)} / ${f(d.HL)} m`], ['Pad krova', `${f(d.pitchDeg, 1)}° (${Math.round(d.pitchPct)} %)`],
      ['Ulazna vrata', `${f(N7.FIX.door.x1 - N7.FIX.door.x0)} × ${f(d.doorH)} m, ${f(N7.FIX.door.x0)} m od kuće, šarke desno`],
      ['Garažna vrata', `${f(d.GW)} × ${f(d.GH)} m, ${f(d.gx)} m od kuće${d.lowHeadroom ? ', niska nadvisina' : ''}`],
      ['Stupovi / rogovi', `${d.nSide} uz susjeda + ${d.frontPosts.length} na pročelju · ${d.nRafters} rogova`]
    ];
    $('ps-specs').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const roofName = { sandwich: 'sendvič panel 40 mm', sandwich30: 'sendvič panel 30 mm', trap: 'trapezni lim' }[p.roof];
    const cost = N7.costs(groups, prices);
    $('ps-bom').innerHTML = `<p class="ps-bom-meta">Krov: ${roofName} · tlocrt ${f(d.WL)} × ${f(d.D)} m · kraj krova ${f(d.HL)} m · garažna vrata ${f(d.GW)} × ${f(d.GH)} m</p>` +
      groups.map((g, gi) => `<table><thead><tr><th colspan="3">${g.title}</th><th class="eur">${cost.groups[gi] ? N7.euro(cost.groups[gi]) : ''}</th></tr></thead><tbody>${g.rows.map(r => `<tr><td>${r[0]}</td><td class="q">${r[1]}</td><td class="n">${r[2]}</td><td class="eur">${r[3] ? N7.euro(N7.rowCost(r[3], prices)) : ''}</td></tr>`).join('')}</tbody></table>`).join('') +
      `<p class="ps-bom-total">Ukupno materijal, okvirno s PDV-om, bez rada i dostave: <b>${N7.euro(cost.total)}</b></p>`;
    const st = d.st;
    $('ps-static').innerHTML = `<p class="ps-bom-meta">Krov: ${roofName} · sₖ = ${f(st.sk)} kN/m² · qp = ${f(st.qp)} kN/m² · raspon rogova ${f(d.W)} m · pad ${f(d.pitchDeg, 1)}°</p>` +
      stGroups.map(g => `<table><thead><tr><th colspan="3">${g.title}</th></tr></thead><tbody>${g.rows.map(r => `<tr><td>${r[0]}</td><td class="q">${r[1]}${r[3] === 'fail' ? ' ✗' : r[3] === 'ok' ? ' ✓' : ''}</td><td class="n">${r[2]}</td></tr>`).join('')}</tbody></table>`).join('');
  }
  // Inside an embedded preview the browser blocks printing, so the button opens the published site instead.
  const embedded = window.self !== window.top;
  const pb = $('print-btn');
  if (embedded) { pb.href = 'https://nadstresnica.slobo.eu/#ispis'; pb.target = '_blank'; pb.rel = 'noopener'; pb.textContent = 'Ispiši crteže (otvara stranicu)'; }
  else pb.addEventListener('click', e => { e.preventDefault(); window.print(); });

  // ---------- controls
  // roof height: a slider from the lowest (1,90 m at the end) to the highest the 5° pitch allows
  function syncHeight() {
    const hs = $('in-height'), lo = Math.min(N7.FIX.lowHL, p.HH), hi = N7.maxHL(p);
    hs.min = lo.toFixed(2); hs.max = hi.toFixed(2);
    if (document.activeElement !== hs) hs.value = d.HL.toFixed(2);
    $('h-out').textContent = f(d.HL) + ' m';
    $('h-low-sub').textContent = f(lo) + ' m'; $('h-high-sub').textContent = f(hi) + ' m';
  }
  $('in-height').addEventListener('input', e => {
    const v = +e.target.value, lo = +e.target.min, hi = +e.target.max;
    if (anim) { cancelAnimationFrame(anim); anim = null; }
    p.mode = v >= hi - 1e-6 ? 'high' : v <= lo + 1e-6 ? 'low' : 'custom';
    p.HL = N7.resolveHL(Object.assign({}, p, { HL: v }));
    refresh(p.HL, true);
  });
  $('in-height').addEventListener('change', () => refresh());
  [['h-low', 'low'], ['h-high', 'high']].forEach(([id, mode]) => $(id).addEventListener('click', () => {
    const from = d.HL; p.mode = mode; p.HL = N7.resolveHL(p); animateHL(from, p.HL);
  }));
  [['o-view', v => scene.setFrameOnly(v === 'steel')]].forEach(([id, fn]) => {
    const g = $(id);
    g.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; pressed(g, b.dataset.v); fn(b.dataset.v); });
  });
  // STL of the steel for a 3D print: the info line follows the selection, the button downloads the file
  function stlOpts() { return { scale: +$('stl-scale').value, minMm: +$('stl-min').value, part: $('stl-part').value }; }
  function stlInfo() {
    const o = stlOpts(), r = scene.exportSTL(Object.assign({ dry: true }, o));
    if (!r || !r.members) { $('stl-info').textContent = ''; return; }
    const [x, y, z] = r.size.map(Math.round);
    const bed = x > 220 || y > 220 || z > 250;
    $('stl-info').textContent = `${r.members} dijelova · ${x} × ${y} × ${z} mm · najtanji dio ${N7.fmt(o.minMm, 1)} mm${bed ? (o.part === 'all' ? ' · ne stane na 220 × 220 × 250 mm: izvezi po sklopovima ili smanji mjerilo' : ' · ne stane na 220 × 220 × 250 mm: smanji mjerilo') : ''}`;
  }
  ['stl-scale', 'stl-min', 'stl-part'].forEach(id => $(id).addEventListener('change', stlInfo));
  $('stl-btn').addEventListener('click', () => {
    const o = stlOpts(), r = scene.exportSTL(o);
    if (!r || !r.blob) return;
    const url = URL.createObjectURL(r.blob), a = document.createElement('a');
    a.href = url; a.download = `nadstresnica-celik-${o.part}-1-${o.scale}.stl`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    stlInfo();
  });
  N7._scene = scene;
  // colour pickers are drop-downs
  [['o-garage', v => { look.garage = v; scene.setGarage(v); }], ['o-fence', v => { look.sheet = v; scene.setFence(v); }], ['o-door', v => { look.door = v; scene.setDoor(v); }], ['o-wall', v => { p.wallSupport = v; }], ['o-roof', v => { p.roof = v; scene.setRoof(v); }], ['o-beam', v => { p.beamType = v; }], ['o-purlin', v => { p.purlinType = v; }], ['o-rafter', v => { p.rafterType = v; }], ['o-skip', v => { p.skipDoor = v === 'skip'; }]].forEach(([id, fn]) => {
    $(id).addEventListener('change', e => { fn(e.target.value); refresh(); });
  });
  // ---------- prices: typing updates the sums in place, without re-rendering the table
  $('bom-copy').onclick = () => copyText(N7.materialsText(groups, prices));
  function updateSums() {
    const c = N7.costs(groups, prices);
    document.querySelectorAll('#bom td.eur[data-k]').forEach(td => { td.textContent = N7.euro(N7.rowCost({ k: td.dataset.k, q: +td.dataset.q }, prices)); });
    document.querySelectorAll('#bom th.eur[data-g]').forEach(th => { const v = c.groups[+th.dataset.g]; th.textContent = v ? N7.euro(v) : ''; });
    $('bom-total').textContent = $('bom-sum').textContent = N7.euro(c.total);
  }
  $('bom').addEventListener('input', e => {
    const k = e.target.dataset.k; if (!k) return;
    const v = parseFloat(e.target.value.replace(/\s/g, '').replace(',', '.'));
    if (isFinite(v) && v >= 0) prices[k] = v; else delete prices[k];
    // the same section can appear in several rows (posts and lintels)
    document.querySelectorAll(`#bom input[data-k="${CSS.escape(k)}"]`).forEach(i => { i.classList.toggle('own', prices[k] != null); if (i !== e.target) i.value = N7.fmt(prices[k] != null ? prices[k] : N7.priceDefault(k), 2); });
    savePrices(); updateSums();
  });
  $('bom').addEventListener('change', e => { const k = e.target.dataset.k; if (k) e.target.value = N7.fmt(prices[k] != null ? prices[k] : N7.priceDefault(k), 2); });
  window.addEventListener('beforeprint', () => refresh());
  $('price-reset').addEventListener('click', () => { prices = {}; savePrices(); refresh(); });
  $('in-slab').addEventListener('change', e => { bomOpt.slab = e.target.checked; refresh(); });
  $('in-mix').addEventListener('change', e => {
    const v = parseFloat(String(e.target.value).replace(',', '.'));
    bomOpt.mix = isFinite(v) ? Math.min(8, Math.max(1, v)) : 3;
    e.target.value = N7.fmt(bomOpt.mix, bomOpt.mix % 1 ? 1 : 0); refresh();
  });

  $('d-parapet').addEventListener('click', e => { p.parapet = !p.parapet; e.currentTarget.setAttribute('aria-pressed', p.parapet); refresh(); });
  Object.entries(INPUTS).forEach(([id, c]) => { $(id).min = c.min; $(id).max = c.max; });
  Object.entries(INPUTS).forEach(([id, c]) => {
    $(id).addEventListener('change', e => {
      const v = parseFloat(String(e.target.value).replace(',', '.'));
      if (!isFinite(v)) { refresh(); return; }
      p[c.key] = Math.min(c.max, Math.max(c.min, v));
      e.target.value = p[c.key].toFixed(2);
      if (c.key === 'HL') p.mode = 'custom';
      else if (p.mode !== 'custom') p.HL = N7.resolveHL(p);
      refresh();
    });
  });
  // existing wall brackets: a list of distances from the street
  const brText = () => (p.brackets || N7.MEASURED.brackets).map(z => f(z)).join('; ');
  $('in-BR').addEventListener('change', e => {
    const v = (e.target.value.match(/\d+(?:[.,]\d+)?/g) || []).map(t => parseFloat(t.replace(',', '.'))).filter(z => z >= 0 && z <= 12);
    if (v.length >= 2) p.brackets = [...new Set(v)].sort((a, b) => a - b);
    e.target.value = brText(); refresh();
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
  scene.setRoof(p.roof);
  N7.initGallery($('gallery'), $('lb'));
  if (!embedded && location.hash === '#ispis') setTimeout(() => window.print(), 800);
})(window.N7);
