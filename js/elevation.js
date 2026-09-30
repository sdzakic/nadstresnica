// Front elevation (street view) with dimensions, drawn as SVG from the derived dimensions.
window.N7 = window.N7 || {};
(function (N7) {
  const S = 100; // px per metre

  N7.renderElevation = function (el, d, pfx = 'e') {
    const FIX = N7.FIX, f = N7.fmt;
    const G = Math.round((d.HH + 0.5) * S);     // ground line
    const X = m => +(m * S).toFixed(1);
    const Y = m => +(G - m * S).toFixed(1);
    const pts = arr => arr.map(([x, y]) => X(x) + ',' + Y(y)).join(' ');
    const right = X(d.WL);
    const vbW = right + 230, vbH = G + 130;
    const GH = d.GH, secH = GH / 5 * S;
    const roofEnd = d.W + FIX.overhang;
    const t = 0.08;
    const pc = (FIX.pillar.x0 + FIX.pillar.x1) / 2, gc = d.gx + d.GW / 2, gap = d.gx - FIX.pillar.x1;

    const dimH = (x0, x1, y, label, sub, below) => `
      <line x1="${X(x0)}" y1="${y}" x2="${X(x1)}" y2="${y}" marker-start="url(#${pfx}-tick)" marker-end="url(#${pfx}-tick)"/>
      <text x="${(X(x0) + X(x1)) / 2}" y="${below ? y + 20 : y - 6}" text-anchor="middle" class="t">${label}</text>
      ${sub ? `<text x="${(X(x0) + X(x1)) / 2}" y="${y - 20}" text-anchor="middle" class="s">${sub}</text>` : ''}`;
    const dimV = (x, y0, y1, label, anchor) => `
      <line x1="${x}" y1="${Y(y0)}" x2="${x}" y2="${Y(y1)}" marker-start="url(#${pfx}-tick)" marker-end="url(#${pfx}-tick)"/>
      <text x="${anchor === 'end' ? x - 6 : x + 8}" y="${(Y(y0) + Y(y1)) / 2 + 4}" text-anchor="${anchor || 'start'}" class="t">${label}</text>`;

    el.innerHTML = `
<svg viewBox="-100 -40 ${vbW} ${vbH}" role="img" aria-label="Nacrt pročelja nadstrešnice s kotama">
  <defs>
    <pattern id="${pfx}-seams" width="30" height="10" patternUnits="userSpaceOnUse">
      <rect width="30" height="10" fill="var(--d-sheet)"/><rect x="0" width="1.6" height="10" fill="var(--d-seam)"/>
    </pattern>
    <pattern id="${pfx}-garage" width="10" height="${secH}" patternUnits="userSpaceOnUse" y="${Y(GH)}">
      <rect width="10" height="${secH}" fill="var(--d-garage)"/><rect y="${secH - 1.4}" width="10" height="1.4" fill="var(--d-seam)"/>
    </pattern>
    <marker id="${pfx}-tick" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M2 8 L8 2" stroke="var(--d-dim)" stroke-width="1.4"/>
    </marker>
  </defs>
  <style>
    .t{font:12.5px var(--mono);fill:var(--ink)} .s{font:10.5px var(--mono);fill:var(--muted)}
    .dim line{stroke:var(--d-dim);stroke-width:1;fill:none}
  </style>
  <rect x="-100" y="-40" width="100" height="${G + 40}" fill="var(--d-house)"/>
  <text x="-50" y="${Y(d.HH) + 40}" text-anchor="middle" class="t">kuća</text>

  <polygon points="${pts(d.front)}" fill="url(#${pfx}-seams)"/>
  <polygon points="${pts([[0, d.HH + t], [roofEnd, d.roofY(roofEnd) + t], [roofEnd, d.roofY(roofEnd)], [0, d.HH]])}" fill="var(--d-dim)"/>
  <circle cx="${X(roofEnd + 0.04)}" cy="${Y(d.roofY(roofEnd) - 0.02)}" r="7.5" fill="var(--d-dim)"/>
  <rect x="${X(roofEnd + 0.04) - 5}" y="${Y(d.roofY(roofEnd) - 0.02)}" width="10" height="${X(d.roofY(roofEnd) - 0.02 - 0.14)}" fill="var(--d-dim)"/>
  <rect x="${X(roofEnd + 0.04) - 7}" y="${Y(0.2)}" width="14" height="${X(0.14)}" rx="3" fill="var(--d-dim)"/>
  <text x="${(X(d.post.x1) + right) / 2}" y="${Y(d.tail / 2)}" text-anchor="middle" class="t" style="fill:#fff">lim</text>

  <rect x="${X(FIX.door.x0)}" y="${Y(FIX.door.h)}" width="${X(FIX.door.x1 - FIX.door.x0)}" height="${X(FIX.door.h)}" fill="var(--d-door)"/>
  <rect x="${X(FIX.door.x0 + 0.62)}" y="${Y(1.9)}" width="10" height="${X(1.7)}" fill="var(--d-seam)" opacity=".9"/>
  <rect x="${X(FIX.door.x0 + 0.13)}" y="${Y(1.35)}" width="3" height="80" fill="var(--d-pillar)"/>

  <rect x="${X(FIX.pillar.x0)}" y="${Y(GH)}" width="${X(FIX.pillar.x1 - FIX.pillar.x0)}" height="${X(GH)}" fill="var(--d-pillar)" stroke="var(--line)"/>
  <rect x="${X(pc) - 7.5}" y="${Y(1.55)}" width="15" height="22" fill="var(--d-door)"/>
  <rect x="${X(pc) - 8.5}" y="${Y(1.82)}" width="17" height="17" fill="#2c4f9e"/>
  <text x="${X(pc)}" y="${Y(1.82) + 13}" text-anchor="middle" style="font:700 12px var(--display);fill:#fff">7</text>

  <rect x="${X(d.gx)}" y="${Y(GH)}" width="${X(d.GW)}" height="${X(GH)}" fill="url(#${pfx}-garage)"/>
  <rect x="${X(d.post.x0)}" y="${Y(d.roofY(d.post.x1))}" width="${X(FIX.postW)}" height="${X(d.roofY(d.post.x1))}" fill="var(--d-dim)"/>

  <rect x="${right}" y="${Y(1.25)}" width="108" height="${X(1.25)}" fill="var(--d-brick)"/>
  <text x="${right + 14}" y="${Y(1.25) - 10}" class="s">susjed</text>
  <line x1="-100" y1="${G}" x2="${right + 120}" y2="${G}" stroke="var(--d-dim)" stroke-width="2"/>

  <g class="dim">
    ${dimH(0, FIX.door.x0, G + 42, f(FIX.door.x0), '', true)}
    ${dimH(FIX.door.x0, FIX.door.x1, G + 42, f(FIX.door.x1 - FIX.door.x0), 'vrata')}
    ${dimH(FIX.pillar.x0, FIX.pillar.x1, G + 42, f(FIX.pillar.x1 - FIX.pillar.x0), '', true)}
    ${gap > 0.01 ? dimH(FIX.pillar.x1, d.gx, G + 42, f(gap), '', gap < 0.45) : ''}
    ${dimH(d.gx, d.post.x0, G + 42, f(d.GW), 'garažna vrata')}
    ${dimH(d.post.x0, d.WL, G + 42, f(d.WL - d.post.x0), d.WL - d.post.x0 > 0.9 ? 'ograda (lim) + stup' : '', d.WL - d.post.x0 < 0.45)}
    ${dimH(0, d.WL, G + 90, `<tspan font-weight="500">${f(d.WL)}</tspan>`)}
    <line x1="0" y1="${G + 6}" x2="0" y2="${G + 98}" stroke-dasharray="2 3"/>
    <line x1="${right}" y1="${G + 6}" x2="${right}" y2="${G + 98}" stroke-dasharray="2 3"/>

    ${dimH(0, d.W, -12, f(d.W) + ' krov')}
    <text x="${(X(d.W) + right) / 2}" y="-18" text-anchor="middle" class="s">${f(d.gap)}</text>
    <line x1="${X(d.W)}" y1="-18" x2="${X(d.W)}" y2="${Y(d.HL)}" stroke-dasharray="2 3"/>

    ${dimV(-30, 0, d.HH, f(d.HH), 'end')}
    ${dimV(right + 78, 0, d.HL, f(d.HL))}
    <line x1="${X(d.W) + 8}" y1="${Y(d.HL)}" x2="${right + 84}" y2="${Y(d.HL)}" stroke-dasharray="2 3"/>
    ${dimV(X(gc), 0, GH, '').replace(/<text[^]*<\/text>/, '')}
  </g>
  <text x="${X(gc) + 6}" y="${Y(GH / 2)}" class="t" style="fill:#fff;font-size:11.5px">${f(GH)}</text>
</svg>`;
  };
})(window.N7);
