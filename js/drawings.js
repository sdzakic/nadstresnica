// Technical drawings for the print sheet: plan (tlocrt), side view (bokocrt) and cross-section A–A.
// Everything is drawn from the derived dimensions in config.js at 100 px per metre.
window.N7 = window.N7 || {};
(function (N7) {
  const S = 100;
  N7.sectionZ = d => -d.D / 2 - 0.4; // where section A–A cuts the carport
  const f = n => N7.fmt(n);

  // styles are scoped to each drawing: <style> inside inline SVG applies to the whole page
  const STYLE = (k, id) => { const q = `#${id}-svg`; return `<style>
    ${q} .ln{stroke:#1e1e1e;stroke-width:1.4}
    ${q} .ln:not([fill]){fill:none}
    ${q} .thin{stroke-width:.8}
    ${q} .bold{stroke-width:3.2}
    ${q} .dash{stroke-dasharray:8 5}
    ${q} .dot{stroke-dasharray:2 4}
    ${q} .axis{stroke-dasharray:18 4 3 4;stroke-width:1.6}
    ${q} .t{font:${15 * k}px "IBM Plex Mono",ui-monospace,monospace;fill:#111}
    ${q} .s{font:${12 * k}px "IBM Plex Mono",ui-monospace,monospace;fill:#555}
    ${q} .b{font:700 ${18 * k}px "Archivo",Arial,sans-serif;fill:#111}
  </style>`; };
  const defs = id => `<defs>
    <pattern id="${id}-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fff"/><line x1="0" y1="0" x2="0" y2="8" stroke="#444" stroke-width="1.2"/></pattern>
    <pattern id="${id}-conc" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#efefec"/><circle cx="3" cy="4" r="1.1" fill="#999"/><circle cx="10" cy="10" r=".9" fill="#999"/><circle cx="11" cy="3" r=".6" fill="#aaa"/></pattern>
  </defs>`;
  const wrap = (id, vb, body, label, k) =>
    `<svg id="${id}-svg" viewBox="${vb.map(v => Math.round(v)).join(' ')}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${STYLE(k || 1, id)}${defs(id)}${body}</svg>`;

  // ---------- dimension helpers (pixel coordinates)
  const tick = (x, y) => `<path d="M${x - 4} ${y + 4}L${x + 4} ${y - 4}" class="ln"/>`;
  function dimH(x0, x1, y, label, o = {}) {
    let s = `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" class="ln thin"/>${tick(x0, y)}${tick(x1, y)}`;
    if (o.ext != null) s += `<line x1="${x0}" y1="${o.ext}" x2="${x0}" y2="${y + (y > o.ext ? 6 : -6)}" class="ln thin dot"/><line x1="${x1}" y1="${o.ext}" x2="${x1}" y2="${y + (y > o.ext ? 6 : -6)}" class="ln thin dot"/>`;
    if (label) s += `<text x="${(x0 + x1) / 2}" y="${o.below ? y + 18 : y - 6}" text-anchor="middle" class="${o.cls || 't'}">${label}</text>`;
    return s;
  }
  function dimV(x, y0, y1, label, o = {}) {
    let s = `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" class="ln thin"/>${tick(x, y0)}${tick(x, y1)}`;
    if (o.ext != null) s += `<line x1="${o.ext}" y1="${y0}" x2="${x + (x > o.ext ? 6 : -6)}" y2="${y0}" class="ln thin dot"/><line x1="${o.ext}" y1="${y1}" x2="${x + (x > o.ext ? 6 : -6)}" y2="${y1}" class="ln thin dot"/>`;
    if (label) {
      const my = (y0 + y1) / 2, lx = o.right ? x + 16 : x - 7;
      s += `<text x="${lx}" y="${my}" text-anchor="middle" transform="rotate(-90 ${lx} ${my})" class="${o.cls || 't'}">${label}</text>`;
    }
    return s;
  }
  const rect = (x, y, w, h, attrs) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${attrs}/>`;
  const txt = (x, y, t, cls = 's', anchor = 'middle', extra = '') => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}" ${extra}>${t}</text>`;

  // ======================================================================= TLOCRT (plan)
  N7.renderPlan = function (el, d) {
    const FIX = N7.FIX, dr = FIX.door, oh = FIX.overhang;
    const X = x => x * S, Y = z => z * S;          // street at z = 0, yard is negative z (up on the sheet)
    const { D, W, WL, gx, GW, post } = d;
    const x1 = W + oh, gc = gx + GW / 2;
    const top = Y(-D - 1.3), bottom = Y(FIX.drivewayLen + 1.9);
    const vb = [X(-2.4), top, X(WL) + 240 + 320, bottom - top];
    let b = '';

    // surroundings
    b += rect(X(-2.2), Y(-FIX.houseLen), 220, FIX.houseLen * S, 'fill="#e7e9e4" class="ln"');
    b += `<path d="M${X(-2.2)} ${Y(-FIX.houseLen) - 10}l12 20l-12 20" class="ln thin"/>`;
    b += txt(X(-1.1), Y(-D / 2), 'kuća', 'b');
    b += rect(X(WL + 0.03), Y(-D - 1.2), 120, (D + 1.2 - 2.6) * S, 'fill="#e7e9e4" class="ln thin"');
    b += `<path d="M${X(WL + 0.03) + 120} ${Y(-D - 1.2)} v${(D + 1.2 - 2.6) * S}" class="ln thin dash"/>`;
    b += rect(X(WL), Y(-2.6), 5, 2.3 * S, 'fill="#555"') + txt(X(WL) + 8, Y(-1.45), 'siva ograda', 's', 'start', `transform="rotate(-90 ${X(WL) + 8} ${Y(-1.45)})"`);
    b += txt(X(WL + 0.63), Y(-D + 0.4), 'susjedova kuća', 's', 'end', `transform="rotate(-90 ${X(WL + 0.63)} ${Y(-D + 0.4)})"`);
    b += rect(X(WL), Y(-0.3), 200, 30, `fill="url(#pl-hatch)" class="ln thin"`);
    b += txt(X(WL) + 100, Y(-0.3) - 8, 'susjedov zid', 's');
    b += rect(X(0), Y(-D), WL * S, D * S, 'fill="#f6f6f3"');
    b += rect(X(0), Y(0.03), post.x1 * S, (FIX.drivewayLen - 0.03) * S, `fill="url(#pl-conc)" class="ln thin"`);
    b += txt(X(post.x1 / 2), Y(FIX.drivewayLen / 2 + 0.6), 'betonski prilaz', 't');
    b += `<line x1="${X(-2.2)}" y1="${Y(0.3)}" x2="${X(WL + 2.2)}" y2="${Y(0.3)}" class="ln thin dot"/><line x1="${X(-2.2)}" y1="${Y(1.6)}" x2="${X(WL + 2.2)}" y2="${Y(1.6)}" class="ln thin dot"/>`;
    b += txt(X(WL + 1.2), Y(0.95) + 5, 'pločnik', 's');
    b += `<line x1="${X(-2.2)}" y1="${Y(FIX.drivewayLen)}" x2="${X(WL + 2.2)}" y2="${Y(FIX.drivewayLen)}" class="ln"/>`;
    b += txt(X(WL + 1.2), Y(FIX.drivewayLen) + 20, 'cesta', 's');
    b += dimV(X(-1.6), Y(0), Y(FIX.drivewayLen), f(FIX.drivewayLen) + ' do ceste', { ext: X(0) });

    // side entrance of the house and its steps
    {
      const sd = FIX.sideDoor, st = FIX.stairs;
      b += rect(X(-0.14), Y(sd.z0), 14, (sd.z1 - sd.z0) * S, 'fill="#fff" class="ln thin"');
      st.widths.forEach((w, i) => { b += rect(X(0), Y(st.z0 + i * st.inset), w * S, (st.z1 - st.z0 - 2 * i * st.inset) * S, `fill="${i ? 'none' : '#e2e2dc'}" class="ln thin"`); });
      b += `<path d="M${X(1.2)} ${Y((st.z0 + st.z1) / 2)} h-80 m12 -6 l-12 6 l12 6" class="ln thin"/>`;
      b += txt(X(1.4), Y(st.z1) + 22, 'stepenice (3 × 18 cm)', 's', 'start');
    }

    // roof, frame
    b += rect(X(-0.02), Y(-D - 0.105), (x1 + 0.02) * S, (D + 0.25) * S, 'class="ln dash"');
    b += txt(X(W / 2), Y(-D - 0.105) - 8, 'rub krova', 's');
    d.rafterZ.forEach(z => { b += `<line x1="${X(0.1)}" y1="${Y(z)}" x2="${X(W - 0.1)}" y2="${Y(z)}" class="ln thin dot"/>`; });
    if (d.st.purlin) for (let k = 1; k <= d.st.nPurlins; k++) { const x = k * W / d.st.nSpans; b += `<line x1="${X(x)}" y1="${Y(-D)}" x2="${X(x)}" y2="${Y(0)}" class="ln thin dash"/>`; }
    b += rect(X(d.wallX0), Y(-D), 10, D * S, 'fill="#2a2a2a"');
    { // existing wall brackets through the insulation, with their distances from the street
      const zs = [0, ...d.brZ.filter(z => z <= D), D], xk = X(-0.55);
      d.brZ.forEach(z => { if (z <= D) b += rect(X(-0.15), Y(-z - 0.03), (d.wallX0 + 0.15) * S, 6, 'fill="#7b2f2a"'); });
      for (let i = 0; i < zs.length - 1; i++) if (zs[i + 1] - zs[i] > 0.01) b += dimV(xk, Y(-zs[i]), Y(-zs[i + 1]), f(zs[i + 1] - zs[i]), { cls: 's' });
      b += txt(xk - 22, Y(-D) - 10, 'nosači na zidu', 's', 'start');
      if (d.st.wallPosts) d.wallPostZ.forEach(z => { b += rect(X(d.wallX0), Y(-z - 0.05), 10, 10, 'fill="#111"'); });
    }
    b += rect(X(W - 0.1), Y(-D), 10, D * S, 'class="ln thin" fill="#fff"');
    d.sideZ.forEach(z => { b += rect(X(W - 0.1), Y(z - 0.05), 10, 10, 'fill="#111"'); });
    d.frontPosts.forEach(q => { b += rect(X(q.x0), Y(-0.1), 10, 10, 'fill="#111"'); });
    b += `<line x1="${X(x1 + 0.04)}" y1="${Y(-D - 0.1)}" x2="${X(x1 + 0.04)}" y2="${Y(0.14)}" class="ln" stroke-width="4"/>`;
    b += `<circle cx="${X(x1 + 0.04)}" cy="${Y(0.13)}" r="6" fill="#111"/>`;
    b += `<path d="M${X(W) - 22} ${Y(-6.4)} v70 m-6 -12 l6 12 l6 -12" class="ln thin"/>`;
    b += txt(X(W) - 32, Y(-6.4) + 22, 'oluk, pad', 's', 'end');
    b += txt(X(W) - 32, Y(-6.4) + 40, 'prema ulici', 's', 'end');

    // front line: sheet, door with swing, intercom, garage door and its tracks
    const seg = (a, c) => `<line x1="${X(a)}" y1="${Y(0.03)}" x2="${X(c)}" y2="${Y(0.03)}" class="ln" stroke-width="5"/>`;
    b += seg(0, dr.x0 - FIX.postW);
    b += seg(dr.x1 + FIX.postW, gx - FIX.postW);
    b += seg(post.x1, WL);
    const dw = dr.x1 - dr.x0;
    b += `<line x1="${X(dr.x1)}" y1="${Y(0)}" x2="${X(dr.x1)}" y2="${Y(-dw)}" class="ln" stroke-width="2.4"/>`;
    b += `<path d="M${X(dr.x0)} ${Y(0)} A${dw * S} ${dw * S} 0 0 1 ${X(dr.x1)} ${Y(-dw)}" class="ln thin dash"/>`;
    b += txt(X(dr.x0 + dw / 2) - 8, Y(-0.35), 'ulaz', 't');
    b += rect(X(d.intercomX - 0.075), Y(0.05), 15, 4, 'fill="#111"') + txt(X(d.intercomX), Y(0.05) + 18, 'interfon', 's');
    b += rect(X(gx), Y(-0.1), GW * S, 5, 'fill="#333"');
    b += rect(X(gx), Y(-2.2), GW * S, 2.1 * S, 'class="ln thin dash"');
    b += txt(X(gc), Y(-1.6), 'vodilice garažnih vrata', 's');
    b += `<rect x="${X(gc - 0.87)}" y="${Y(-5.33)}" width="174" height="472" rx="28" class="ln thin dash"/>`;
    b += txt(X(gc), Y(-3.2), 'auto', 't');

    // section line A–A
    const za = N7.sectionZ(d);
    b += `<line x1="${X(-0.5)}" y1="${Y(za)}" x2="${X(WL + 0.5)}" y2="${Y(za)}" class="ln axis"/>`;
    [-0.5, WL + 0.5].forEach(x => { b += `<path d="M${X(x)} ${Y(za)} v24 m-6 -10 l6 10 l6 -10" class="ln"/>` + txt(X(x), Y(za) - 10, 'A', 'b'); });

    // dimensions
    const y1 = Y(FIX.drivewayLen) + 60, y2 = y1 + 50;
    const chain = [[0, dr.x0], [dr.x0, dr.x1], [dr.x1, gx]];
    chain.push([gx, d.gRight], [d.gRight, WL]);
    chain.forEach(([a, c]) => { const w = c - a; b += dimH(X(a), X(c), y1, f(w), { below: w < 0.45 }); });
    b += dimH(X(0), X(WL), y2, f(WL), { ext: Y(0.03) });
    const yt = Y(-D - 0.105) - 50;
    b += dimH(X(0), X(W), yt, f(W) + ' krov') + dimH(X(W), X(WL), yt, f(d.gap), { cls: 's' });
    const xr = X(WL) + 175, xr2 = xr + 70;
    const zs = [0, ...d.sideZ.map(z => -z).slice(1, -1), D];
    for (let i = 0; i < zs.length - 1; i++) b += dimV(xr, Y(-zs[i]), Y(-zs[i + 1]), f(zs[i + 1] - zs[i]), { right: true });
    b += dimV(xr2, Y(0), Y(-D), f(D), { right: true, ext: X(W) });
    b += txt(xr - 12, Y(-D) - 14, 'razmak stupova', 's', 'start');

    el.innerHTML = wrap('pl', vb, b, 'Tlocrt nadstrešnice s kotama', 1.35);
  };

  // ======================================================================= BOKOCRT (side view from the neighbour)
  N7.renderSide = function (el, d) {
    const FIX = N7.FIX, oh = FIX.overhang;
    const { D, HH, HL, W } = d, x1 = W + oh, T = FIX.T;
    const G = (HH + 1.0) * S;
    const U = u => u * S, Y = y => G - y * S;          // u = distance from the street line into the yard
    const ye = d.roofY(x1);
    const vb = [U(-2.4), -10, U(D + 1.8) - U(-2.4) + 40, G + 1.55 * S + 10];
    let b = '';

    b += rect(U(0), Y(4.4), FIX.houseLen * S, 4.4 * S, 'fill="#eef0ec" class="ln thin"');
    b += txt(U(FIX.houseLen / 2), Y(4.1), 'kuća (u pozadini)', 's');
    {
      const sd = FIX.sideDoor, st = FIX.stairs;
      b += rect(U(-sd.z1), Y(sd.y1), (sd.z1 - sd.z0) * S, (sd.y1 - sd.y0) * S, 'fill="#fff" class="ln thin"');
      b += txt(U(-(sd.z0 + sd.z1) / 2), Y(sd.y1) - 8, 'bočni ulaz', 's');
      st.widths.forEach((w, i) => { b += rect(U(-st.z1 + i * st.inset), Y((i + 1) * st.rise), (st.z1 - st.z0 - 2 * i * st.inset) * S, st.rise * S, 'fill="#e2e2dc" class="ln thin"'); });
    }
    b += `<line x1="${U(-2.4)}" y1="${G}" x2="${U(D + 1.6)}" y2="${G}" class="ln bold"/>`;
    b += rect(U(-2.2), G - 5, 2.2 * S, 5, `fill="url(#sd-conc)"`) + txt(U(-1.1), G - 12, 'prilaz', 's');
    // roof surface rising away from the viewer, gutter, beam, posts
    b += `<polygon points="${U(-0.145)},${Y(ye + T)} ${U(D + 0.105)},${Y(ye + T)} ${U(D + 0.105)},${Y(HH + T)} ${U(-0.145)},${Y(HH + T)}" fill="#c9ccce" class="ln"/>`;
    for (let u = 0.2; u < D; u += 0.33) b += `<line x1="${U(u)}" y1="${Y(HH + T)}" x2="${U(u)}" y2="${Y(ye + T)}" class="ln thin" stroke="#8a8f93"/>`;
    b += txt(U(D / 2), Y((HH + ye) / 2 + T) + 5, 'krov (pad prema promatraču)', 's', 'middle', 'style="fill:#333"');
    b += rect(U(-0.14), Y(ye + 0.03), (D + 0.24) * S, 13, 'fill="#333"');
    if (d.st.beam.s.truss) { // lattice side beam seen from the neighbour
      const bt = d.st.beam.s.truss, ch = bt.chord.h / 1000, h = bt.h / 1000, yt = HL - 0.02, he = h - ch, n = Math.max(2, Math.round(D / he));
      b += rect(U(0), Y(yt), D * S, ch * S, 'fill="#222"') + rect(U(0), Y(yt - h + ch), D * S, ch * S, 'fill="#222"');
      let path = ''; for (let k = 0; k <= n; k++) { const u = k * D / n, y = k % 2 ? yt - ch / 2 : yt - h + ch / 2; path += (k ? 'L' : 'M') + U(u) + ' ' + Y(y); }
      b += `<path d="${path}" class="ln" stroke="#222" stroke-width="2.5"/>`;
    } else b += rect(U(0), Y(HL - 0.02), D * S, 12, 'fill="#222"');
    d.sideZ.forEach(z => {
      const u = -z;
      b += rect(U(u - 0.05), Y(HL - 0.02 - d.beamDepth), 10, (HL - 0.07 - d.beamDepth) * S, 'fill="#2a2a2a"');
      b += rect(U(u - 0.1), Y(0.07), 20, 2, 'fill="#111"');
      b += rect(U(u - d.st.footing / 2), G, d.st.footing * S, 80, 'class="ln thin dash" fill="none"');
    });
    b += rect(U(-0.18), Y(ye - 0.05), 10, (ye - 0.25) * S, 'fill="#333"') + `<path d="M${U(-0.13)} ${Y(0.22)} l-18 12" class="ln" stroke-width="9" stroke="#333"/>`;
    b += txt(U(-0.3), Y(0.6), 'vertikala', 's', 'end');
    b += `<line x1="${U(-0.02)}" y1="${G}" x2="${U(-0.02)}" y2="${Y(d.parapet ? HH + T : HL)}" class="ln" stroke-width="4"/>`;
    b += txt(U(-0.1), Y(HL + 0.25), 'lim pročelja', 's', 'end');
    { // existing wall brackets on the house wall (behind the roof edge) and their positions
      const bk = FIX.bracket, yk = Y(HH + T) - 34, zs = [0, ...d.brZ.filter(z => z <= D), D];
      d.brZ.forEach(z => { if (z <= D) b += rect(U(z - bk.plateW / 2), Y(HH), bk.plateW * S, bk.plateH * S, 'fill="#7b2f2a" stroke="#fff" stroke-width="1"'); });
      for (let i = 0; i < zs.length - 1; i++) if (zs[i + 1] - zs[i] > 0.01) b += dimH(U(zs[i]), U(zs[i + 1]), yk, f(zs[i + 1] - zs[i]), { cls: 's' });
      if (d.st.braces) d.brZ.forEach(z => { if (z <= D) b += rect(U(z - 0.03), Y(HH - 0.15), 6, d.st.braces.drop * S, 'fill="#666"'); });
      if (d.st.wallPosts) d.wallPostZ.forEach(z => { b += rect(U(z - 0.05), Y(HH - 0.15), 10, (HH - 0.2) * S, 'fill="#666"'); });
      b += txt(U(0), yk - 26, `postojeći nosači na zidu, vrh na ${f(HH)} m (zidna greda na njima)`, 's', 'start');
    }

    // dimensions
    const yb = G + 1.0 * S, yb2 = yb + 45;
    const zs = [0, ...d.sideZ.map(z => -z).slice(1, -1), D];
    for (let i = 0; i < zs.length - 1; i++) b += dimH(U(zs[i]), U(zs[i + 1]), yb, f(zs[i + 1] - zs[i]));
    b += dimH(U(0), U(D), yb2, f(D), { ext: G });
    b += dimV(U(-1.6), G, Y(HL), f(HL), { ext: U(-0.02) });
    b += dimV(U(D + 0.8), G, Y(HH), f(HH), { right: true, ext: U(D) });
    b += dimV(U(D + 0.8) + 60, G, G + 80, '0,80', { right: true, cls: 's' });
    b += txt(U(D + 0.8) + 92, G + 40, 'temelj', 's', 'start');
    b += txt(U(-2.3), G + 26, '← ulica', 't', 'start');
    b += txt(U(D + 1.5), G + 26, 'dvorište →', 't', 'end');

    el.innerHTML = wrap('sd', vb, b, 'Bokocrt nadstrešnice s kotama');
  };

  // ---------- detail A: one existing wall bracket with the wall beam and a rafter, scale 1:5 (500 px/m)
  function detailA(x0, y0, d) {
    const bk = N7.FIX.bracket, K = 500, top = y0 + 90;
    const X = x => x0 + 140 + x * K, Y = y => top + (d.HH - y) * K;    // x = 0 on the face of the insulation
    const HH = d.HH, yb = HH - bk.plateH;
    const fill = c => `style="fill:${c}"`;
    let b = txt(x0, y0 + 14, 'Detalj A · postojeći nosač na zidu, 1 : 5', 't', 'start');
    // masonry, insulation, roof panel
    const wallH = d.st.braces ? 0.80 : 0.30;
    b += rect(X(-bk.eps - 0.12), Y(HH + 0.08), 0.12 * K, wallH * K, `fill="url(#sc-hatch)" class="ln thin"`);
    b += rect(X(-bk.eps), Y(HH + 0.08), bk.eps * K, wallH * K, `class="ln thin" ${fill('#f1f1ea')}`);
    b += txt(X(-bk.eps - 0.06), Y(HH + 0.08) - 6, 'zid', 's') + txt(X(-bk.eps / 2), Y(HH + 0.08) - 6, 'stiropor', 's');
    b += rect(X(-0.02), Y(HH + N7.FIX.T), 0.38 * K, N7.FIX.T * K, `class="ln thin" ${fill('#d5d8da')}`);
    b += txt(X(0.17), Y(HH + N7.FIX.T) - 6, 'krovni panel', 's');
    // wall plate with 4 anchors, tube through the insulation, end plate
    b += rect(X(-bk.eps - bk.plateT), Y(HH), bk.plateT * K, bk.plateH * K, fill('#7b2f2a'));
    [0.03, bk.plateH - 0.03].forEach(o => { b += `<line x1="${X(-bk.eps - 0.11)}" y1="${Y(HH - o)}" x2="${X(-bk.eps)}" y2="${Y(HH - o)}" class="ln" stroke-width="3"/>`; });
    b += rect(X(-bk.eps), Y(HH - (bk.plateH - bk.tubeH) / 2), bk.tubeL * K, bk.tubeH * K, `class="ln thin" ${fill('#b5625a')}`);
    b += rect(X(d.wallX0 - bk.plateT), Y(HH), bk.plateT * K, bk.plateH * K, fill('#7b2f2a'));
    // wall beam bolted to the end plate, rafter flush with its top
    b += rect(X(d.wallX0), Y(HH), 0.10 * K, 0.15 * K, `class="ln" ${fill('#fff')}`) + rect(X(d.wallX0) + 3, Y(HH) + 3, 0.10 * K - 6, 0.15 * K - 6, 'class="ln thin"');
    [0.04, 0.11].forEach(o => { b += `<line x1="${X(d.wallX0 - 0.025)}" y1="${Y(HH - o)}" x2="${X(d.wallX0 + 0.03)}" y2="${Y(HH - o)}" class="ln" stroke-width="3"/>`; });
    if (d.st.braces) { // knee brace into the wall, new plate with 2 anchors
      const k = d.st.braces, xm = (d.wallX0 + d.wallX1) / 2, y1 = HH - 0.15 - k.drop;
      b += `<line x1="${X(xm)}" y1="${Y(HH - 0.15)}" x2="${X(-bk.eps)}" y2="${Y(y1)}" stroke="#555" stroke-width="${k.s.b / 1000 * K * 0.6}"/>`;
      b += rect(X(-bk.eps - bk.plateT), Y(y1 + bk.plateH / 2), bk.plateT * K, bk.plateH * K, fill('#333'));
      [0.04, -0.04].forEach(o => { b += `<line x1="${X(-bk.eps - 0.10)}" y1="${Y(y1 + o)}" x2="${X(-bk.eps)}" y2="${Y(y1 + o)}" class="ln" stroke-width="3"/>`; });
      b += txt(X(0.05), Y(y1) + 4, `kosnik ${k.s.name}, nova pločica s 2 sidra, ${Math.round(k.drop * 100)} cm niže`, 's', 'start');
    }
    if (d.st.wallPosts) {
      b += rect(X(d.wallX0), Y(HH - 0.15), 0.10 * K, 0.18 * K, `class="ln" ${fill('#bbb')}`);
      b += txt(X(d.wallX1) + 8, Y(HH - 0.27), `stup uz kuću ${d.st.wallPosts.s.name} ispod grede`, 's', 'start');
    }
    const rh = Math.min(d.rafterH, 0.2);
    b += rect(X(d.wallX1), Y(HH), 0.16 * K, rh * K, fill('#6b6f72')) + txt(X(d.wallX1 + 0.08), Y(HH - rh) + 14, d.rt ? 'rešetka' : 'rog', 's');
    // dimensions and labels
    const yd = d.st.braces ? Y(HH - 0.72) + 30 : Y(yb) + 70;
    b += dimH(X(-bk.eps), X(0), yd, Math.round(bk.eps * 100) + '', { cls: 's' });
    b += dimH(X(d.wallX0), X(d.wallX1), yd, '10', { cls: 's' });
    b += dimH(X(-bk.eps), X(-bk.eps + bk.tubeL), yd + 36, `cijev ${Math.round(bk.tubeH * 100)}×${Math.round(bk.tubeW * 100)}, ≥ ${Math.round(bk.tubeL * 100)}`, { cls: 's' });
    b += dimV(X(d.wallX1 + 0.21), Y(HH), Y(yb), Math.round(bk.plateH * 100) + '', { right: true, cls: 's' });
    const lx = X(d.wallX1 + 0.27);
    b += txt(lx, Y(HH) + 4, `vrh nosača i grede ${N7.fmt(HH)} m`, 's', 'start');
    b += txt(lx, Y(HH) + 22, 'zidna greda 150×100 na ploči nosača', 's', 'start');
    b += txt(lx, Y(HH) + 40, 'ploče 15×10, svaka s 4 vijka', 's', 'start');
    // front view of the end plate with its 4 bolt holes
    const fx = lx + 330, fy = Y(HH);
    b += rect(fx, fy, bk.plateW * K, bk.plateH * K, fill('#7b2f2a')) + rect(fx + (bk.plateW - bk.tubeW) / 2 * K, fy + (bk.plateH - bk.tubeH) / 2 * K, bk.tubeW * K, bk.tubeH * K, 'class="ln thin" stroke="#e8c9c4"');
    [[0.02, 0.025], [0.08, 0.025], [0.02, 0.125], [0.08, 0.125]].forEach(([a, c]) => { b += `<circle cx="${fx + a * K}" cy="${fy + c * K}" r="4" fill="#fff"/>`; });
    b += txt(fx + bk.plateW * K / 2, fy - 8, 'ploča', 's');
    b += dimH(fx, fx + bk.plateW * K, fy + bk.plateH * K + 22, Math.round(bk.plateW * 100) + '', { cls: 's' });
    return b;
  }

  // ======================================================================= PRESJEK A–A (cross-section, looking towards the street)
  N7.renderSection = function (el, d) {
    const FIX = N7.FIX, oh = FIX.overhang, T = FIX.T;
    const { HH, HL, W, WL, gx, GW, GH, post, roofY } = d;
    const x1 = W + oh, gc = gx + GW / 2;
    const G = (HH + 1.1) * S;
    const X = x => x * S, Y = y => G - y * S;
    const DET = G + 1.95 * S;                         // top of the band with detail A below the dimensions
    const vb = [X(-1.5), -10, X(WL + 1.9) - X(-1.5), DET + (d.st.braces ? 4.4 : 3.0) * S];
    let b = '';

    // house: cut wall + the part beyond, glass block window above the carport
    b += rect(X(-1.5), Y(4.4), 110, 4.4 * S, 'fill="#eef0ec" class="ln thin"');
    const zc = N7.sectionZ(d), sd = FIX.sideDoor, st = FIX.stairs;
    if (zc > sd.z0 && zc < sd.z1) {
      // the cut runs through the side door: wall below and above the opening, door leaf in the opening
      b += rect(X(-0.4), Y(sd.y0), 40, sd.y0 * S, `fill="url(#sc-hatch)" class="ln"`);
      b += rect(X(-0.4), Y(4.4), 40, (4.4 - sd.y1) * S, `fill="url(#sc-hatch)" class="ln"`);
      b += rect(X(-0.12), Y(sd.y1), 6, (sd.y1 - sd.y0) * S, 'fill="#fff" class="ln thin"');
      b += txt(X(-0.45), Y((sd.y0 + sd.y1) / 2), 'bočni ulaz', 's', 'end');
    } else b += rect(X(-0.4), Y(4.4), 25, 4.4 * S, `fill="url(#sc-hatch)" class="ln"`) + rect(X(-0.15), Y(4.4), 15, 4.4 * S, 'class="ln thin" style="fill:#f4f4ef"');
    {
      const cut = zc > st.z0 && zc < st.z1;
      const pts = [[0, 0]];
      st.widths.forEach((w, i) => { pts.push([w, i * st.rise], [w, (i + 1) * st.rise]); });
      pts.push([0, st.widths.length * st.rise]);
      b += `<polygon points="${pts.map(([x, y]) => X(x) + ',' + Y(y)).join(' ')}" fill="${cut ? 'url(#sc-hatch)' : '#e2e2dc'}" class="ln"/>`;
      b += txt(X(st.widths[0]) + 8, Y(st.rise) - 4, 'stepenice', 's', 'start');
    }
    b += rect(X(-0.4), Y(3.9), 40, 35, 'fill="#fff" class="ln thin"');
    b += txt(X(-0.45), Y(3.72) + 4, 'prozor', 's', 'end');
    b += txt(X(-0.95), Y(2.2), 'kuća', 'b');
    // ground, slab, gravel, footing
    b += `<line x1="${X(-1.5)}" y1="${G}" x2="${X(WL + 1.8)}" y2="${G}" class="ln bold"/>`;
    b += rect(X(0), G, WL * S, 12, `fill="url(#sc-conc)" class="ln thin"`);
    b += rect(X(0), G + 12, WL * S, 15, 'class="ln thin dot" fill="none"');
    b += rect(X(W - 0.05 - d.st.footing / 2), G, d.st.footing * S, 80, `fill="url(#sc-hatch)" class="ln"`);
    // neighbour boundary and wall beyond
    { // neighbour's house right behind the boundary, cut by the section (wall hatched, clipped at the top of the sheet)
      const top = Math.min(6.0, HH + 1.0);
      b += rect(X(WL + 0.05), Y(top), 1.8 * S, top * S, 'fill="#eef0ec" class="ln thin"');
      b += rect(X(WL + 0.05), Y(top), 35, top * S, `fill="url(#sc-hatch)" class="ln"`);
      b += rect(X(WL + 0.03), Y(0.85), 4, 85, 'fill="#777"');
      b += `<path d="M${X(WL + 0.05) - 6} ${Y(top) + 8} l12 -8 l0 16 l12 -8" class="ln thin"/>`;
      b += txt(X(WL + 1.0), Y(top) + 26, 'susjedova kuća', 's');
    }
    b += `<line x1="${X(WL)}" y1="${G + 60}" x2="${X(WL)}" y2="${Y(HH + 0.3)}" class="ln axis"/>`;
    b += txt(X(WL) + 8, Y(HH + 0.2), 'međa', 't', 'start');
    // garage door (beyond, dashed) and car
    b += rect(X(gx), Y(GH), GW * S, GH * S, 'class="ln thin dash" fill="none"');
    b += txt(X(gc), Y(GH) + 18, 'garažna vrata (iza)', 's');
    b += `<rect x="${X(gc - 0.9)}" y="${Y(1.43)}" width="180" height="${(1.43 - 0.3) * S}" rx="30" class="ln thin dot" fill="none"/>`;
    [-0.62, 0.62].forEach(o => { b += rect(X(gc + o - 0.12), Y(0.66), 24, 66, 'class="ln thin dot" fill="none"'); });
    b += txt(X(gc), Y(0.95), 'auto', 's');
    // structure
    b += rect(X(W - 0.1), Y(HL - 0.02 - d.beamDepth), 10, (HL - 0.07 - d.beamDepth) * S, 'fill="#333"');
    b += rect(X(W - 0.15), Y(0.05), 20, 3, 'fill="#111"');
    const rh = d.rafterH;
    const tr = d.st.rafter.s.truss;
    if (tr) { // lattice rafter beyond the cut: top chord, level bottom tube and the zig-zag web
      const tv = tr.top.h / 1000 * d.slopeLen / W, rt = d.rt;
      b += `<polygon points="${X(d.wallX1)},${Y(roofY(d.wallX1))} ${X(W)},${Y(HL)} ${X(W)},${Y(HL - tv)} ${X(d.wallX1)},${Y(roofY(d.wallX1) - tv)}" fill="#6b6f72"/>`;
      b += rect(X(d.wallX1), Y(rt.botTop), (W - 0.1 - d.wallX1) * S, (rt.botTop - rt.yB) * S, 'fill="#6b6f72"');
      b += rt.web.map(([xa, ya, xb, yb]) => `<line x1="${X(xa)}" y1="${Y(ya)}" x2="${X(xb)}" y2="${Y(yb)}" stroke="#6b6f72" stroke-width="${Math.max(1.5, tr.web.b / 10)}"/>`).join('');
      b += dimV(X(0.25), Y(rt.yB), Y(HH - 0.0), f(rt.hWall), { cls: 's' });
    } else b += `<polygon points="${X(d.wallX1)},${Y(roofY(d.wallX1))} ${X(W)},${Y(HL)} ${X(W)},${Y(HL - rh)} ${X(d.wallX1)},${Y(roofY(d.wallX1) - rh)}" fill="#6b6f72"/>`;
    if (d.st.purlin) { // purlins cut by the section, flush with the rafter top
      const ph = d.st.purlin.s.h / 1000, pb = d.st.purlin.s.b / 1000;
      for (let k = 1; k <= d.st.nPurlins; k++) { const x = k * W / d.st.nSpans; b += rect(X(x - pb / 2), Y(roofY(x)), pb * S, ph * S, 'fill="#111"'); }
    }
    if (d.st.beam.s.truss) { const bt = d.st.beam.s.truss, ch = bt.chord.h / 1000, h = bt.h / 1000;
      b += rect(X(W - 0.05 - ch / 2), Y(HL - 0.02), ch * S, ch * S, 'fill="#111"') + rect(X(W - 0.05 - ch / 2), Y(HL - 0.02 - h + ch), ch * S, ch * S, 'fill="#111"');
      b += `<line x1="${X(W - 0.05)}" y1="${Y(HL - 0.02 - ch)}" x2="${X(W - 0.05)}" y2="${Y(HL - 0.02 - h + ch)}" class="ln" stroke-width="2"/>`;
    } else b += rect(X(W - 0.1), Y(HL - 0.02), 10, 12, 'fill="#111"');
    { // wall beam on the existing brackets (the nearest one beyond the cut is drawn), detail A below
      const bk = FIX.bracket;
      b += rect(X(0), Y(HH - (bk.plateH - bk.tubeH) / 2), (d.wallX0 - bk.plateT) * S, bk.tubeH * S, 'fill="#7b2f2a"');
      b += rect(X(d.wallX0 - bk.plateT), Y(HH), bk.plateT * S + 1, bk.plateH * S, 'fill="#7b2f2a"');
      b += rect(X(d.wallX0), Y(HH), 10, 15, 'fill="#111"');
      if (d.st.braces) b += `<line x1="${X((d.wallX0 + d.wallX1) / 2)}" y1="${Y(HH - 0.15)}" x2="${X(0)}" y2="${Y(HH - 0.15 - d.st.braces.drop * ((d.wallX0 + d.wallX1) / 2 / ((d.wallX0 + d.wallX1) / 2 + bk.eps)))}" stroke="#333" stroke-width="6"/>`;
      if (d.st.wallPosts) b += rect(X(d.wallX0), Y(HH - 0.15), 10, (HH - 0.2) * S, 'fill="#555"');
      b += `<circle cx="${X(0.08)}" cy="${Y(HH - 0.07)}" r="22" class="ln thin"/>` + txt(X(0.08) + 20, Y(HH - 0.07) + 34, 'A', 'b', 'start');
      b += detailA(X(-1.4), DET, d);
    }
    b += `<polygon points="${X(-0.02)},${Y(roofY(-0.02) + T)} ${X(x1)},${Y(roofY(x1) + T)} ${X(x1)},${Y(roofY(x1))} ${X(-0.02)},${Y(roofY(-0.02))}" fill="#aeb3b6" class="ln"/>`;
    b += rect(X(-0.02), Y(HH + T + 0.12), 10, 12, 'fill="#111"');
    const gy = Y(roofY(x1) - 0.02);
    b += `<path d="M${X(x1 + 0.04) - 7.5} ${gy} a7.5 7.5 0 0 0 15 0" class="ln" stroke-width="3"/>`;
    b += rect(X(post.x0), Y(d.underAt(post.x1)), 10, d.underAt(post.x1) * S, 'class="ln thin dash" fill="none"');

    // labels along the roof
    const ang = -Math.atan2(HH - HL, W) * 180 / Math.PI;
    const mx = X(W * 0.45), my = Y(roofY(W * 0.45) + T) - 16;
    b += `<text x="${mx}" y="${my}" text-anchor="middle" class="t" transform="rotate(${ang} ${mx} ${my})">pad ${N7.fmt(d.pitchDeg, 1)}° (${Math.round(d.pitchPct)} %) · panel ${f(d.slopeLen + oh)} m</text>`;
    const rx = tr ? X(W * 0.5) : X(W * 0.3), ry = tr ? Y(d.rt.yB) + 18 : Y(roofY(W * 0.3) - rh) + 34;
    b += tr ? `<text x="${rx}" y="${ry}" text-anchor="middle" class="s">rog: ${d.st.rafter.s.name}</text><text x="${rx}" y="${ry + 15}" text-anchor="middle" class="s">${tr.top.name} / ${tr.bot.name} / zmija ${tr.web.name}${d.st.purlin ? ` · podrožnice ${d.st.purlin.s.name}` : ''}</text>` : `<text x="${rx}" y="${ry}" text-anchor="middle" class="s" transform="rotate(${ang} ${rx} ${ry})">rog ${d.st.rafter.s.name} · ${f(d.slopeLen)} m${d.st.purlin ? ` · ${d.st.nPurlins} podrožnice ${d.st.purlin.s.name}` : ''}</text>`;

    // dimensions
    const yb = G + 1.05 * S, yb2 = yb + 45;
    b += dimH(X(0), X(W), yb, f(W) + ' krov') + dimH(X(W), X(WL), yb, f(d.gap));
    b += dimH(X(W), X(x1), Y(HL) - 70, f(oh), { cls: 's' });
    b += dimH(X(0), X(WL), yb2, f(WL), { ext: G });
    b += dimV(X(-1.2), G, Y(HH), f(HH), { ext: X(0) });
    b += dimV(X(WL + 1.5), G, Y(HL), f(HL), { right: true, ext: X(W) });
    const clear = d.underAt(post.x0);
    b += dimV(X(post.x0) - 16, G, Y(clear), f(clear), { cls: 's' });
    b += txt(X(post.x0) - 26, Y(clear * 0.62), tr ? 'slobodno ispod rešetke' : 'slobodno ispod roga', 's', 'end');
    b += dimV(X(W + 0.3), G, G + 80, '0,80', { right: true, cls: 's' });

    el.innerHTML = wrap('sc', vb, b, 'Poprečni presjek A–A s kotama');
  };
})(window.N7);
