// Dimensions and the rules every other module derives its geometry from.
// All lengths are in metres. x runs along the street from the house wall (0)
// towards the neighbour, y is height, z runs from the street line (0) into the yard (negative).
window.N7 = window.N7 || {};
(function (N7) {
  const FIX = {
    houseLen: 7.8,            // measured length of the side wall
    T: 0.06,                  // roof panel thickness in the model
    overhang: 0.20,           // roof overhang past the side beam, over the gutter
    door: { x0: 0.05, x1: 1.05, h: 2.10 },
    pillar: { x0: 1.05, x1: 1.30 },
    garage: { x0: 1.30, w: 2.68, maxH: 2.50, minH: 1.90 },
    post: { x0: 3.98, x1: 4.08 },
    rafterH: 0.12,
    rafterMaxSpacing: 1.3,
    sidePostMaxSpacing: 2.7,
    minPitchDeg: 5,           // lowest pitch for sandwich panel / polycarbonate
    trapMinPitchDeg: 8,       // below this a trapezoidal sheet is not recommended
    lowHL: 1.90,              // measured height for the "lower" variant
    fenceMax: 2.00,
    headroomStd: 0.25,        // lintel needed by a standard sectional door
    headroomLow: 0.06,        // lintel needed with a low-headroom kit
    drivewayLen: 4.2
  };

  const MEASURED = { HH: 3.25, D: 7.8, WL: 5.52, gap: 0.50 };
  const DEFAULTS = Object.assign({ mode: 'high', HL: 2.80 }, MEASURED);

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

    // garage door: as tall as the roof above its right jamb allows
    const under = roofY(FIX.post.x0) - FIX.rafterH;
    let GH, lowHeadroom = false;
    const std = floorTo(under - FIX.headroomStd, 0.05);
    if (std >= 2.0) GH = Math.min(FIX.garage.maxH, std);
    else { GH = Math.min(2.0, floorTo(under - FIX.headroomLow, 0.05)); lowHeadroom = true; }

    const tail = Math.min(FIX.fenceMax, HL);
    const fenceW = p.WL - FIX.post.x1;
    const nSide = Math.ceil(p.D / FIX.sidePostMaxSpacing) + 1;
    const nRafters = Math.ceil(p.D / FIX.rafterMaxSpacing) + 1;

    // outline of the front sheet (above the doors + fence), in front-elevation metres
    const front = [[0, FIX.door.h], [FIX.door.x1, FIX.door.h], [FIX.door.x1, GH], [FIX.post.x1, GH],
      [FIX.post.x1, 0], [p.WL, 0], [p.WL, tail], [W, tail], [W, roofY(W)], [0, HH]];

    const warnings = [];
    if (drop <= 0) warnings.push('Kraj krova mora biti niži od visine uz kuću.');
    else if (pitchDeg < FIX.minPitchDeg - 0.05) warnings.push('Pad je manji od 5°, što je premalo za sendvič panel i polikarbonat.');
    if (GH < FIX.garage.minH) warnings.push('Garažna vrata ispadaju niža od 1,90 m. Podigni kraj krova.');
    if (fenceW < 0.3) warnings.push('Za ogradu ostaje manje od 30 cm. Proširi širinu do susjeda.');
    if (p.D > FIX.houseLen + 0.001) warnings.push('Nadstrešnica je duža od bočnog zida kuće (7,80 m).');
    if (HH > 3.30) warnings.push('Iznad 3,25 m uz kuću je prozor od staklene opeke.');

    return {
      HH, HL, D: p.D, WL: p.WL, gap: p.gap, W, drop, roofY, pitchDeg, pitchPct: drop / W * 100, slopeLen,
      GH, lowHeadroom, tail, fenceW, front,
      nSide, sideZ: spread(nSide, -0.05, -p.D + 0.05),
      nRafters, rafterZ: spread(nRafters, -0.04, -p.D + 0.04),
      warnings, FIX
    };
  }

  const fmt = (n, dec = 2) => n.toFixed(dec).replace('.', ',');

  N7.FIX = FIX;
  N7.MEASURED = MEASURED;
  N7.DEFAULTS = DEFAULTS;
  N7.derive = derive;
  N7.maxHL = maxHL;
  N7.resolveHL = resolveHL;
  N7.fmt = fmt;
  N7.ceilTo = ceilTo;
})(window.N7);
