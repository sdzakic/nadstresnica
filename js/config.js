// Dimensions and the rules every other module derives its geometry from.
// All lengths are in metres. x runs along the street from the house wall (0)
// towards the neighbour, y is height, z runs from the street line (0) into the yard (negative).
window.N7 = window.N7 || {};
(function (N7) {
  const FIX = {
    houseLen: 7.8,            // measured length of the side wall
    T: 0.06,                  // roof panel thickness in the model
    overhang: 0.20,           // roof overhang past the side beam, over the gutter
    door: { x0: 0.30, x1: 1.30, h: 2.10 },   // 30 cm from the house wall, hinged on the right, a post on each side
    intercomMinGap: 0.20,                      // sheet between the door post and the garage post, carries the intercom
    garage: { w: 2.68, minW: 2.2, maxW: 3.6, maxH: 2.50, minH: 2.00, cornerMinH: 2.10 },
    postW: 0.10,                               // steel posts on the pročelje, up to the front rafter
    cornerClear: 0.20,                         // keep a separate garage post clear of the corner post
    rafterH: 0.12,
    rafterMaxSpacing: 1.3,
    sidePostMaxSpacing: 2.7,
    minPitchDeg: 5,           // lowest pitch for sandwich panel / polycarbonate
    trapMinPitchDeg: 8,       // below this a trapezoidal sheet is not recommended
    lowHL: 1.90,              // measured height for the "lower" variant
    headroomStd: 0.25,        // lintel needed by a standard sectional door
    headroomLow: 0.06,        // lintel needed with a low-headroom kit
    drivewayLen: 4.2,
    // existing side entrance of the house under the carport: door on the wall + three concrete steps
    sideDoor: { z0: -4.45, z1: -3.45, y0: 0.55, y1: 2.60 },
    stairs: { z0: -4.60, z1: -3.30, rise: 0.18, inset: 0.05, widths: [1.30, 1.10, 0.90] }
  };

  const MEASURED = { HH: 3.25, D: 7.8, WL: 5.52, gap: 0.50 };
  const DEFAULTS = Object.assign({ mode: 'high', HL: 2.80, GW: FIX.garage.w, gx: null }, MEASURED); // gx null = as far from the entrance as possible

  const fmt = (n, dec = 2) => n.toFixed(dec).replace('.', ',');
  const floorTo = (v, step) => Math.floor(v / step + 1e-6) * step;
  const ceilTo = (v, step) => Math.ceil(v / step - 1e-6) * step;

  function roofWidth(p) { return p.WL - p.gap; }
  function maxHL(p) {
    return floorTo(p.HH - roofWidth(p) * Math.tan(FIX.minPitchDeg * Math.PI / 180), 0.05);
  }
  function resolveHL(p) {
    if (p.mode === 'low') return Math.min(FIX.lowHL, p.HH);
    if (p.mode === 'high') return maxHL(p);
    return p.HL;
  }
  function spread(n, a, b) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(n === 1 ? a : a + (b - a) * i / (n - 1));
    return out;
  }

  // p: {HH, D, WL, gap, mode, HL}; hlOverride is used while the roof height animates.
  function derive(p, hlOverride) {
    const W = roofWidth(p);
    const HH = p.HH;
    const HL = hlOverride != null ? hlOverride : resolveHL(p);
    const drop = HH - HL;
    const roofY = x => HH - drop * x / W;
    const pitchDeg = Math.atan2(drop, W) * 180 / Math.PI;
    const slopeLen = Math.hypot(W, drop);

    // garage door hangs between a post on its left and either the corner post by the neighbour
    // (when the roof there still leaves at least 2,10 m of door) or its own post on the right
    const GW = p.GW, pw = FIX.postW;
    const minH = FIX.garage.minH;
    const doorH = xr => {
      const under = roofY(xr) - FIX.rafterH;
      const std = floorTo(under - FIX.headroomStd, 0.05);
      if (std >= minH) return { GH: Math.min(FIX.garage.maxH, std), low: false };
      return { GH: Math.min(minH, floorTo(under - FIX.headroomLow, 0.05)), low: true };
    };
    const cornerIn = W - pw;                  // inner face of the corner post
    const gxMin = FIX.door.x1 + pw + FIX.intercomMinGap + pw; // door post, sheet with intercom, garage post
    const cornerH = doorH(cornerIn);
    const canAttach = !cornerH.low && cornerH.GH >= FIX.garage.cornerMinH - 1e-6 && cornerIn - GW >= gxMin;
    let gx, gxMax, attached, xrMax;
    if (canAttach) {
      gxMax = cornerIn - GW; xrMax = cornerIn;
      gx = Math.min(gxMax, Math.max(gxMin, p.gx == null ? gxMax : p.gx));
      if (gx > gxMax - pw - 0.05) gx = gxMax;   // too close for its own post: snap onto the corner post
      attached = gx >= gxMax - 1e-6;
    } else {
      const needY = minH + FIX.rafterH + FIX.headroomLow;
      const xrRoof = drop > 0 ? (HH - needY) * W / drop : W;
      xrMax = Math.min(W - FIX.cornerClear - pw, xrRoof);
      gxMax = Math.max(gxMin, xrMax - GW);
      gx = Math.min(gxMax, Math.max(gxMin, p.gx == null ? gxMax : p.gx));
      attached = false;
    }
    const gRight = gx + GW;
    const post = attached ? { x0: cornerIn, x1: W } : { x0: gRight, x1: gRight + pw }; // right jamb
    const { GH, low: lowHeadroom } = doorH(post.x0);

    // posts on the pročelje, all up to the underside of the front rafter
    const dr = FIX.door;
    const intercomX = (dr.x1 + pw + gx - pw) / 2; // intercom + house number, centred on the sheet between the posts
    const topAt = x => roofY(x) - FIX.rafterH;
    const frontPosts = [
      { x0: dr.x0 - pw, x1: dr.x0, role: 'ulazna vrata lijevo' },
      { x0: dr.x1, x1: dr.x1 + pw, role: 'ulazna vrata desno' },
      { x0: gx - pw, x1: gx, role: 'garažna vrata lijevo' }
    ];
    if (!attached) frontPosts.push({ x0: post.x0, x1: post.x1, role: 'garažna vrata desno' });
    frontPosts.forEach(q => { q.h = topAt(q.x1); });

    const tail = HL; // the sheet by the neighbour goes up to the roof edge
    const fenceW = p.WL - post.x1;
    const nSide = Math.ceil(p.D / FIX.sidePostMaxSpacing) + 1;
    const nRafters = Math.ceil(p.D / FIX.rafterMaxSpacing) + 1;

    // outline of the front sheet: it comes down to the ground everywhere except over the openings
    // (door with its posts, garage with its posts), where it stops at the opening's top
    const spans = [[dr.x0 - pw, dr.x1 + pw, dr.h], [gx - pw, post.x1, GH]];
    const front = [[0, 0]];
    let lastX = 0;
    spans.forEach(([a, b, h]) => {
      if (a - lastX > 0.005) front.push([a, 0]);
      front.push([a, h], [b, h]);
      lastX = b;
      front.push([b, 0]);
    });
    front.push([p.WL, 0]);
    // where two spans touch, drop the dip to the ground between them and any repeated point
    for (let k = front.length - 2; k > 0; k--) {
      const [a, b, c] = [front[k - 1], front[k], front[k + 1]];
      if (b[1] === 0 && Math.abs(a[0] - b[0]) < 0.005 && Math.abs(c[0] - b[0]) < 0.005 && a[1] > 0 && c[1] > 0) front.splice(k, 1);
    }
    for (let k = front.length - 1; k > 0; k--) if (Math.abs(front[k][0] - front[k - 1][0]) < 1e-6 && Math.abs(front[k][1] - front[k - 1][1]) < 1e-6) front.splice(k, 1);
    front.push([p.WL, tail], [W, roofY(W)], [0, HH]);

    const warnings = [];
    if (drop <= 0) warnings.push('Kraj krova mora biti niži od visine uz kuću.');
    else if (pitchDeg < FIX.minPitchDeg - 0.05) warnings.push('Pad je manji od 5°, što je premalo za sendvič panel i polikarbonat.');
    if (GH < minH - 0.001) warnings.push(`Garažna vrata od ${fmt(GW)} m ne stanu uz visinu od 2,00 m. Suzi ih na najviše ${fmt(Math.max(0, floorTo(xrMax - gxMin, 0.05)))} m ili podigni kraj krova.`);
    if (fenceW < 0.3) warnings.push('Za ogradu ostaje manje od 30 cm. Proširi širinu do susjeda.');
    if (p.D > FIX.houseLen + 0.001) warnings.push('Nadstrešnica je duža od bočnog zida kuće (7,80 m).');
    if (HH > 3.30) warnings.push('Iznad 3,25 m uz kuću je prozor od staklene opeke.');

    return {
      HH, HL, D: p.D, WL: p.WL, gap: p.gap, W, drop, roofY, pitchDeg, pitchPct: drop / W * 100, slopeLen,
      intercomX, GW, gx, gxMin, gxMax, gRight, attached, post, frontPosts, GH, lowHeadroom, tail, fenceW, front,
      nSide, sideZ: spread(nSide, -0.05, -p.D + 0.05),
      nRafters, rafterZ: spread(nRafters, -0.04, -p.D + 0.04),
      warnings, FIX
    };
  }

  N7.FIX = FIX;
  N7.MEASURED = MEASURED;
  N7.DEFAULTS = DEFAULTS;
  N7.derive = derive;
  N7.maxHL = maxHL;
  N7.resolveHL = resolveHL;
  N7.fmt = fmt;
  N7.ceilTo = ceilTo;
})(window.N7);
