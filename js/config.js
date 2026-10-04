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
    houseEave: 4.4,           // eave of the house above the carport (for snow drift)
    houseRoofRun: 4.0,        // horizontal run of the house roof slope that drains towards the carport
    rafterMaxSpacing: { simple: 1.3, cont: 2.0 },   // continuous purlins carry over the rafters, so the rafters can be further apart
    sidePostMaxSpacing: 2.7,
    minPitchDeg: 5,           // lowest pitch for a sandwich roof panel
    trapMinPitchDeg: 8,       // below this a trapezoidal sheet is not recommended
    lowHL: 1.90,              // measured height for the "lower" variant
    headroomStd: 0.25,        // lintel needed by a standard sectional door
    headroomLow: 0.06,        // lintel needed with a low-headroom kit
    drivewayLen: 9.45,        // measured: front line to the road edge
    // existing side entrance of the house under the carport: door on the wall + three concrete steps
    sideDoor: { z0: -4.45, z1: -3.45, y0: 0.55, y1: 2.60 },
    stairs: { z0: -4.60, z1: -3.30, rise: 0.18, inset: 0.05, widths: [1.30, 1.10, 0.90] }
  };

  // HH: measured to the existing wall brackets; WL: measured from the house wall to the neighbour's stone plinth
  // colour options for the sheet, garage door and entrance door (hex used by the model and the drawings)
  const COLORS = {
    sheet: { anth: ['Antracit', '#3b4146'], house: ['Kao kuća', '#a9b6a2'], wood: ['Dekor drvo', '#9a6a3e'] },
    garage: { anth: ['Antracit', '#3f454a'], white: ['Bijela', '#eceee9'], silver: ['Srebrna', '#a9aeb2'], brown: ['Smeđa', '#5b4232'], wood: ['Dekor drvo', '#9a6a3e'], house: ['Kao kuća', '#a9b6a2'] },
    door: { anth: ['Antracit', '#33393d'], white: ['Bijela', '#eef0ec'], brown: ['Smeđa', '#5b4232'], wood: ['Dekor drvo', '#9a6a3e'], house: ['Kao kuća', '#a9b6a2'] }
  };

  const MEASURED = { HH: 3.18, D: 7.8, WL: 5.41, gap: 0.50 };
  const DEFAULTS = Object.assign({ mode: 'high', HL: 2.70, GW: FIX.garage.w, gx: null, roof: 'sandwich', sk: 1.25, qp: 0.50, doorH: 2.10, parapet: false, beamType: 'box', purlinType: 'cont', rafterType: 'box', skipDoor: false }, MEASURED); // gx null = as far from the entrance as possible

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
    // a lattice side beam spans the whole length on the two corner posts
    const nSide = p.beamType === 'truss' ? 2 : Math.ceil(p.D / FIX.sidePostMaxSpacing) + 1;
    // rafters evenly spread, or one on each side of the house side door with even spacing in between
    const maxSp = FIX.rafterMaxSpacing[p.purlinType === 'simple' ? 'simple' : 'cont'];
    const seg = (a, b) => spread(Math.ceil((a - b) / maxSp - 1e-6) + 1, a, b);
    const zA = -0.04, zB = -p.D + 0.04, sd = FIX.sideDoor, rClear = 0.13; // half a rafter + 8 cm from the door frame
    const doorSkip = !!p.skipDoor && sd.z1 + rClear < zA - 0.3 && sd.z0 - rClear > zB + 0.3;
    const rafterZ = doorSkip ? seg(zA, sd.z1 + rClear).concat(seg(sd.z0 - rClear, zB)) : seg(zA, zB);
    const nRafters = rafterZ.length;
    const sideZ = spread(nSide, -0.05, -p.D + 0.05);

    // static check first: it picks the rafter section, whose depth sets the headroom under the roof
    const st = N7.statics({ HH, HL, W, D: p.D, slopeLen, pitchDeg, sideZ, nRafters, rafterZ, rafterType: p.rafterType || 'box', roof: p.roof || 'sandwich', beamType: p.beamType || 'box', purlinType: p.purlinType || 'cont', sk: p.sk, qp: p.qp, houseEave: FIX.houseEave, houseRoofRun: FIX.houseRoofRun });
    const rafterH = st.rafter.s.h / 1000;
    // underside of the rafters: a lattice rafter has its level bottom tube there, a box rafter follows the slope
    const tr = st.rafter.s.truss, rt = tr ? N7.rafterTrussGeom(W, HH, HL, tr) : null;
    const underAt = x => rt ? rt.yB : roofY(x) - rafterH;

    // garage door hangs between a post on its left and either the corner post by the neighbour
    // (when the roof there still leaves at least 2,10 m of door) or its own post on the right
    const GW = p.GW, pw = FIX.postW;
    const minH = FIX.garage.minH;
    const doorH = xr => {
      const under = underAt(xr);
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
      const needY = minH + rafterH + FIX.headroomLow;
      const xrRoof = rt ? (rt.yB + rafterH >= needY ? W : 0) : drop > 0 ? (HH - needY) * W / drop : W;
      xrMax = Math.min(W - FIX.cornerClear - pw, xrRoof);
      gxMax = Math.max(gxMin, xrMax - GW);
      gx = Math.min(gxMax, Math.max(gxMin, p.gx == null ? gxMax : p.gx));
      attached = false;
    }
    const gRight = gx + GW;
    const post = attached ? { x0: cornerIn, x1: W } : { x0: gRight, x1: gRight + pw }; // right jamb
    let { GH, low: lowHeadroom } = doorH(post.x0);
    // on the corner post the garage door runs under the side beam: a deep lattice girder lowers it
    const beamDepth = st.beam.s.h / 1000;
    if (attached && st.beam.s.truss) GH = Math.min(GH, floorTo(HL - 0.02 - beamDepth - 0.06, 0.05));

    // posts on the pročelje, all up to the underside of the front rafter
    const dr = FIX.door;
    // entrance door height, limited by the lintel under the front rafter
    const topAt = underAt;
    const doorMax = floorTo(topAt(dr.x1 + pw) - 0.08 - 0.02, 0.05);
    const entryH = Math.min(p.doorH || dr.h, doorMax);
    const intercomX = (dr.x1 + pw + gx - pw) / 2; // intercom + house number, centred on the sheet between the posts
    const frontPosts = [
      { x0: dr.x0 - pw, x1: dr.x0, role: 'ulazna vrata lijevo' },
      { x0: dr.x1, x1: dr.x1 + pw, role: 'ulazna vrata desno' },
      { x0: gx - pw, x1: gx, role: 'garažna vrata lijevo' }
    ];
    if (!attached) frontPosts.push({ x0: post.x0, x1: post.x1, role: 'garažna vrata desno' });
    frontPosts.forEach(q => { q.h = topAt(q.x1); });

    const tail = HL; // the sheet by the neighbour goes up to the roof edge
    const fenceW = p.WL - post.x1;

    // outline of the front sheet: it comes down to the ground everywhere except over the openings
    // (door with its posts, garage with its posts), where it stops at the opening's top
    const spans = [[dr.x0 - pw, dr.x1 + pw, entryH], [gx - pw, post.x1, GH]];
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
    // with the parapet option the sheet goes up to the roof height at the house over the whole front,
    // so from the street the roof looks flat
    if (p.parapet) front.push([p.WL, HH], [0, HH]);
    else front.push([p.WL, tail], [W, roofY(W)], [0, HH]);

    const warnings = [];
    if (drop <= 0) warnings.push('Kraj krova mora biti niži od visine uz kuću.');
    else if (pitchDeg < FIX.minPitchDeg - 0.05) warnings.push('Pad je manji od 5°, što je premalo za sendvič panel.');
    const gwFit = floorTo(xrMax - gxMin, 0.05);
    if (GH < minH - 0.001) warnings.push(gwFit >= FIX.garage.minW ? `Garažna vrata od ${fmt(GW)} m ne stanu uz visinu od 2,00 m. Suzi ih na najviše ${fmt(gwFit)} m ili podigni kraj krova.` : 'Uz ovu visinu krova garažna vrata ne mogu biti visoka 2,00 m. Podigni kraj krova.');
    if ((p.doorH || dr.h) > doorMax + 1e-6) warnings.push(`Ulazna vrata mogu biti visoka najviše ${fmt(doorMax)} m ispod nadvoja.`);
    if (fenceW < 0.25 - 1e-6) warnings.push('Za ogradu ostaje manje od 25 cm. Proširi širinu do susjeda.');
    if (p.D > FIX.houseLen + 0.001) warnings.push('Nadstrešnica je duža od bočnog zida kuće (7,80 m).');
    if (HH > 3.30) warnings.push('Iznad postojećih nosača (3,18 m) uz kuću je prozor od staklene opeke.');
    if (p.roof === 'trap' && pitchDeg < FIX.trapMinPitchDeg) warnings.push(`Pad ${fmt(pitchDeg, 1)}° je premalen za trapezni lim (treba barem 8°).`);
    if (rt && rt.yB < 2.2) warnings.push(`Donja cijev rešetke rogova je na samo ${fmt(rt.yB)} m. Uz ovu visinu krova rešetka s vodoravnom donjom cijevi nema smisla.`);
    if (rt && !doorSkip && rafterZ.some(z => z < sd.z1 + 0.06 && z > sd.z0 - 0.06)) warnings.push(`Jedna rešetka roga pada točno na bočna vrata kuće: donja cijev je na ${fmt(rt.yB)} m, a vrh vrata na ${fmt(sd.y1)} m. Uključi "Zaobiđi bočna vrata".`);
    if (st.fail) warnings.push('Statički proračun: neki element ne prolazi ni s najvećim profilom iz popisa.');

    return {
      HH, HL, D: p.D, WL: p.WL, gap: p.gap, W, drop, roofY, pitchDeg, pitchPct: drop / W * 100, slopeLen,
      intercomX, GW, gx, gxMin, gxMax, gRight, attached, post, frontPosts, GH, lowHeadroom, tail, fenceW, front,
      st, rafterH, beamDepth, doorH: entryH, doorMax, parapet: !!p.parapet, roof: p.roof || 'sandwich',
      nSide, sideZ, nRafters, rafterZ, doorSkip, underAt, rt,
      warnings, FIX
    };
  }

  N7.FIX = FIX;
  N7.COLORS = COLORS;
  N7.MEASURED = MEASURED;
  N7.DEFAULTS = DEFAULTS;
  N7.derive = derive;
  N7.maxHL = maxHL;
  N7.resolveHL = resolveHL;
  N7.fmt = fmt;
  N7.ceilTo = ceilTo;
})(window.N7);
