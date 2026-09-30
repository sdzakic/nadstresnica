// Simplified static check of the carport (idejni nivo, EN 1990/1991/1993 style).
// It picks the smallest steel sections from a short catalogue that pass bending, deflection and buckling,
// and sizes the purlin spacing from the chosen roof panel. It is an estimate for talking to a
// bravar/statičar, not a replacement for a signed calculation.
window.N7 = window.N7 || {};
(function (N7) {
  // roof coverings: self weight g [kN/m²] and allowed multi-span panel span at 1,5 kN/m² characteristic load [m]
  const ROOFS = {
    sandwich: { name: 'Sendvič panel 40 mm', g: 0.13, spanRef: 2.5 },
    sandwich30: { name: 'Sendvič panel 30 mm', g: 0.115, spanRef: 2.1 },
    trap: { name: 'Trapezni lim T-35, 0,5 mm', g: 0.05, spanRef: 1.8 }
  };
  const FY = 235, E = 210000, GAMMA_M = 1.0; // S235, MPa

  // cold-formed rectangular hollow sections h × b × t [mm]; properties with sharp corners (slightly conservative)
  function rhs(h, b, t) {
    const A = h * b - (h - 2 * t) * (b - 2 * t);
    const I = (b * h ** 3 - (b - 2 * t) * (h - 2 * t) ** 3) / 12;
    const Iz = (h * b ** 3 - (h - 2 * t) * (b - 2 * t) ** 3) / 12;
    return { name: `□${h}×${b}×${t}`, h, b, t, A, I, W: 2 * I / h, i: Math.sqrt(Math.min(I, Iz) / A), kg: A * 7.85e-3 };
  }
  const PURLINS = [rhs(60, 40, 2), rhs(60, 40, 3), rhs(80, 40, 3), rhs(100, 50, 3), rhs(120, 60, 3)];
  const RAFTERS = [rhs(120, 60, 3), rhs(120, 60, 4), rhs(140, 80, 4), rhs(160, 80, 4), rhs(180, 100, 4), rhs(200, 100, 5)];
  const BEAMS = [rhs(100, 100, 4), rhs(120, 120, 4), rhs(140, 140, 5), rhs(160, 160, 5)];
  const POSTS = [rhs(100, 100, 4), rhs(120, 120, 4), rhs(140, 140, 5)];
  // lattice girder ("zmija"): two chords and one zig-zag round bar welded between them at 45°
  const BEAM_TRUSS_DEPTHS = [300, 350, 400, 450, 500];
  const CHORDS = [rhs(40, 40, 3), rhs(50, 50, 3), rhs(60, 60, 3), rhs(60, 60, 4), rhs(80, 80, 4), rhs(100, 100, 4)];
  const BARS = [12, 14, 16, 20];
  function roundBar(d) { const A = Math.PI * d * d / 4; return { d, A, i: d / 4, kg: A * 7.85e-3 }; }
  function chi(lam) { const phi = 0.5 * (1 + 0.49 * (lam - 0.2) + lam * lam); return Math.min(1, 1 / (phi + Math.sqrt(phi * phi - lam * lam))); }
  // check one truss for the bending moment, end shear and deflection of the rafter; Lout = purlin spacing (top chord bracing)
  function checkTruss(h, ch, bar, M, V, deflPerEI, L, Lout) {
    const he = h - ch.h;                                   // distance between chord axes, mm
    const N = M * 1e6 / he;                                 // chord force, N
    const uT = N / (ch.A * FY);
    const LcrC = Math.max(2 * he, Lout * 1000);             // top chord: between nodes in plane, between purlins out of plane
    const uC = N / (chi(LcrC / ch.i / 93.9) * ch.A * FY);
    const Nd = V * 1000 * Math.SQRT2;                       // diagonal force at the support
    const uD = Nd / (chi(he * Math.SQRT2 / bar.i / 93.9) * bar.A * FY);
    const I = 2 * ch.A * (he / 2) ** 2;
    const w = deflPerEI / (E * I) * 1000 * 1.15;            // +15 % for shear deformation of the lattice
    const uW = w / (L * 1000 / 200);
    const kg = 2 * ch.kg + Math.SQRT2 * bar.kg;
    return { uM: Math.max(uT, uC), uT, uC, uD, uW, w, kg };
  }

  // pick the first section whose bending stress and deflection pass
  function pickBeam(list, M_Ed, deflPerEI, L) {
    for (const s of list) {
      const uM = M_Ed * 1e6 / s.W / (FY / GAMMA_M);
      const w = deflPerEI / (E * s.I) * 1000; // mm
      const uW = w / (L * 1000 / 200);
      if (uM <= 1 && uW <= 1) return { s, uM, uW, w };
    }
    const s = list[list.length - 1];
    const w = deflPerEI / (E * s.I) * 1000;
    return { s, uM: M_Ed * 1e6 / s.W / FY, uW: w / (L * 1000 / 200), w, fail: true };
  }
  // flexural buckling, curve c (cold-formed hollow sections)
  function buckling(s, N_Ed, Lcr) {
    const lam = (Lcr * 1000 / s.i) / (93.9 * Math.sqrt(235 / FY));
    const phi = 0.5 * (1 + 0.49 * (lam - 0.2) + lam * lam);
    const chi = Math.min(1, 1 / (phi + Math.sqrt(phi * phi - lam * lam)));
    const Nb = chi * s.A * FY / GAMMA_M / 1000; // kN
    return { chi, Nb, u: N_Ed / Nb, lam };
  }

  // c: { HH, HL, W, D, slopeLen, pitchDeg, sideZ, nRafters, roof, sk, qp, houseEave, houseRoofRun }
  N7.statics = function (c) {
    const roof = ROOFS[c.roof] || ROOFS.sandwich;
    const L = c.W;                                   // rafter span (horizontal projection)
    const sR = c.D / (c.nRafters - 1);               // rafter spacing
    const gm = 9.81e-3;                              // kg/m → kN/m

    // ---------- snow: μ1 on the canopy plus drift against the taller house wall (EN 1991-1-3, 5.3.6)
    const mu1 = c.pitchDeg <= 30 ? 0.8 : 0.8 * (60 - c.pitchDeg) / 30;
    const s1 = mu1 * c.sk;
    const h = Math.max(0, c.houseEave - c.HH);
    let muW = mu1, ls = 5;
    if (h > 0.05) {
      muW = Math.max(0.8, Math.min(4, (c.houseRoofRun + L) / (2 * h), 2 * h / c.sk));
      ls = Math.min(15, Math.max(5, 2 * h));
    }
    const sWall = Math.max(s1, muW * c.sk);
    const sAt = x => x >= ls ? s1 : sWall - (sWall - s1) * x / ls;
    const sEnd = sAt(L);

    // ---------- wind: suction on the roof lifts it; cp,net = 1,2 conservatively
    const cpUp = 1.2, wUp = cpUp * c.qp;

    // ---------- panel span → purlin spacing
    const qPanel = roof.g + sWall;                   // characteristic, worst strip at the wall
    const spanAllow = roof.spanRef * Math.sqrt(1.5 / qPanel);
    const nSpans = Math.max(1, Math.ceil(c.slopeLen / spanAllow - 1e-6));
    const nPurlins = nSpans - 1;                    // intermediate purlins (the wall beam and side beam are the end supports)
    const a = c.slopeLen / nSpans;

    // ---------- purlins between the rafters, loaded by the strip a at the wall.
    // Continuous purlins (one piece over all rafters, welded to each) have ≈ qL²/10 and much less deflection
    // than purlins cut between rafters (qL²/8, 5/384).
    let purlin = null;
    const contP = (c.purlinType || 'cont') === 'cont';
    if (nPurlins > 0) {
      const gP = roof.g + 0.03;
      const qd = (1.35 * gP + 1.5 * sWall) * a, qk = (gP + sWall) * a;
      const kM = contP ? 1 / 10 : 1 / 8, kW = contP ? 2.6 / 384 : 5 / 384;
      purlin = pickBeam(PURLINS, qd * sR * sR * kM, kW * qk * (sR * 1000) ** 4 / 1000, sR);
      purlin.qd = qd; purlin.cont = contP;
    }

    // ---------- rafters: simply supported between the wall beam and the side beam, trapezoidal snow
    const gRoof = roof.g + (purlin ? purlin.s.kg * gm * nPurlins / c.slopeLen : 0);
    function rafterLoads(kg) {
      const g = gRoof + kg * gm / sR * (c.slopeLen / L);
      const qdEnd = (1.35 * g + 1.5 * sEnd) * sR, qdTri = 1.5 * (sWall - sEnd) * sR;
      const qkEnd = (g + sEnd) * sR, qkTri = (sWall - sEnd) * sR;
      return {
        g, qdEnd, qdTri,
        M: qdEnd * L * L / 8 + qdTri * L * L * 0.0642,
        defl: (5 / 384 * qkEnd + 0.00652 * qkTri) * (L * 1000) ** 4 / 1000,
        Rwall: qdEnd * L / 2 + qdTri * L / 3, Rbeam: qdEnd * L / 2 + qdTri * L / 6
      };
    }
    let rafter = null, rl = null;
    for (const s of RAFTERS) { // self weight depends on the section, so check each one with its own weight
      rl = rafterLoads(s.kg);
      const r = pickBeam([s], rl.M, rl.defl, L);
      if (!r.fail) { rafter = r; break; }
    }
    if (!rafter) { const s = RAFTERS[RAFTERS.length - 1]; rl = rafterLoads(s.kg); rafter = pickBeam([s], rl.M, rl.defl, L); }

    // ---------- side beam on the posts by the neighbour
    const zs = c.sideZ.map(z => -z), spans = zs.slice(1).map((z, i) => z - zs[i]);
    const Lb = Math.max(...spans);
    const wb = rl.Rbeam / sR;                        // ULS line load from the rafters [kN/m]
    const wbk = wb / 1.45;                           // ≈ SLS
    const beamTruss = c.beamType === 'truss';
    let beam;
    if (beamTruss) {
      // lattice girder ("zmija") over the whole length on the two corner posts; top chord held by the rafters
      const M = wb * Lb * Lb / 8, V = wb * Lb / 2, defl = 5 * wbk * (Lb * 1000) ** 4 / 384 / 1000;
      for (const h of BEAM_TRUSS_DEPTHS) {
        let best = null;
        for (const ch of CHORDS) for (const d of BARS) {
          const bar = roundBar(d), r = checkTruss(h, ch, bar, M, V, defl, Lb, sR);
          if (r.uM <= 0.9 && r.uD <= 0.9 && r.uW <= 1 && (!best || r.kg < best.r.kg)) best = { r, ch, bar };
        }
        if (best) { beam = Object.assign({ s: { name: `rešetka ${h / 10} cm (pojasnice ${best.ch.name}, zmija Ø${best.bar.d})`, h, b: best.ch.b, kg: best.r.kg, truss: { h, chord: best.ch, bar: best.bar } } }, best.r); break; }
      }
      if (!beam) {
        const h = BEAM_TRUSS_DEPTHS[BEAM_TRUSS_DEPTHS.length - 1], ch = CHORDS[CHORDS.length - 1], bar = roundBar(BARS[BARS.length - 1]);
        beam = Object.assign({ fail: true, s: { name: `rešetka ${h / 10} cm (pojasnice ${ch.name}, zmija Ø${bar.d})`, h, b: ch.b, kg: 0, truss: { h, chord: ch, bar } } }, checkTruss(h, ch, bar, M, V, defl, Lb, sR));
        beam.s.kg = beam.kg;
      }
    } else beam = pickBeam(BEAMS, wb * Lb * Lb / 8, 5 * wbk * (Lb * 1000) ** 4 / 384 / 1000, Lb);

    // ---------- posts: axial load, pinned at both ends (the frame is held by the house through the rafters)
    const trib = beamTruss ? Lb / 2 : Lb;            // corner posts of a lattice girder carry half its span
    const N = wb * trib + beam.s.kg * gm * trib * 1.35;
    let post = null;
    for (const s of POSTS) { const b = buckling(s, N, c.HL); if (b.u <= 1) { post = Object.assign({ s }, b); break; } }
    if (!post) { const s = POSTS[POSTS.length - 1]; post = Object.assign({ s, fail: true }, buckling(s, N, c.HL)); }

    // ---------- wall anchors of the wall beam (every 0,5 m) and uplift
    const anchorStep = 0.5;
    const Vwall = rl.Rwall / sR;                     // kN per metre of wall
    const gAll = rl.g;
    const netUp = Math.max(0, 1.5 * wUp - 1.0 * gAll);   // kN/m² upward
    const Twall = netUp * L / 2;                      // kN per metre of wall
    const Tpost = netUp * (L / 2) * trib;             // kN per post
    // footing weight must hold the uplift (γc = 24 kN/m³, favourable factor 0,9), depth 0,80 m
    const Vreq = Tpost / (0.9 * 24);
    const footing = Math.max(0.40, Math.ceil(Math.sqrt(Vreq / 0.8) / 0.05 - 1e-6) * 0.05);

    const fail = [purlin, rafter, beam].some(r => r && r.fail) || post.fail;
    return {
      roof, sk: c.sk, qp: c.qp, mu1, s1, muW, ls, sWall, sEnd, h, wUp, netUp, beamType: c.beamType || 'box', purlinType: c.purlinType || 'cont',
      spanAllow, nSpans, nPurlins, a, sR, purlin, rafter, rl, Lb, wb, beam, N, post,
      anchorStep, Vwall, Twall, Vanchor: Vwall * anchorStep, Tanchor: Twall * anchorStep, Tpost, footing, fail
    };
  };

  N7.ROOFS = ROOFS;

  // table groups for the page and the print sheet
  N7.staticsReport = function (d) {
    const st = d.st, f = N7.fmt, kN = v => f(v, 2) + ' kN', pct = u => Math.round(u * 100) + ' %';
    const ok = u => u <= 1 ? 'ok' : 'fail';
    const groups = [];
    groups.push({
      title: 'Opterećenja', rows: [
        ['Krov', st.roof.name, `vlastita težina ${f(st.roof.g, 3)} kN/m²`, ''],
        ['Snijeg na tlu sₖ', f(st.sk) + ' kN/m²', 'provjeri za lokaciju (karta snijega)', ''],
        ['Snijeg na krovu μ₁·sₖ', f(st.s1) + ' kN/m²', `μ₁ = ${f(st.mu1)} za pad ${f(d.pitchDeg, 1)}°`, ''],
        ['Nanos snijega uz zid kuće', f(st.sWall) + ' kN/m²', st.h > 0.05 ? `μw = ${f(st.muW)}, visinska razlika ${f(st.h)} m, dužina nanosa ${f(st.ls, 1)} m` : 'nema višeg zida', ''],
        ['Vjetar, podizanje krova', f(st.wUp) + ' kN/m²', `qp = ${f(st.qp)} kN/m², cp = 1,2`, '']
      ]
    });
    const rows = [];
    rows.push(['Razmak podrožnica', `${f(st.a)} m (${st.nPurlins} kom)`, `dozvoljeni raspon panela ≈ ${f(st.spanAllow)} m uz ${f(st.roof.g + st.sWall)} kN/m²`, 'ok']);
    if (st.purlin) rows.push([`Podrožnice ${st.purlin.s.name}`, `savijanje ${pct(st.purlin.uM)} · progib ${pct(st.purlin.uW)}`, `${st.purlin.cont ? 'kontinuirane preko svih rogova' : 'po poljima'}, raspon ${f(st.sR)} m između rogova`, st.purlin.fail ? 'fail' : 'ok']);
    rows.push([`Rogovi ${st.rafter.s.name}`, `savijanje ${pct(st.rafter.uM)} · progib ${pct(st.rafter.uW)}`, `raspon ${f(d.W)} m, razmak ${f(st.sR)} m, M = ${f(st.rl.M, 1)} kNm, progib ${Math.round(st.rafter.w)} mm (dop. ${Math.round(d.W * 1000 / 200)})`, st.rafter.fail ? 'fail' : 'ok']);
    if (st.beam.s.truss) rows.push([`Bočna greda: ${st.beam.s.name}`, `pojasnice ${pct(st.beam.uM)} · zmija ${pct(st.beam.uD)} · progib ${pct(st.beam.uW)}`, `jedan raspon ${f(st.Lb)} m na 2 kutna stupa, opterećenje ${f(st.wb)} kN/m, ${f(st.beam.s.kg, 1)} kg/m`, st.beam.fail ? 'fail' : 'ok']);
    else rows.push([`Bočna greda ${st.beam.s.name}`, `savijanje ${pct(st.beam.uM)} · progib ${pct(st.beam.uW)}`, `raspon ${f(st.Lb)} m, opterećenje ${f(st.wb)} kN/m`, st.beam.fail ? 'fail' : 'ok']);
    rows.push([`Stupovi ${st.post.s.name}`, `izvijanje ${pct(st.post.u)}`, `N = ${kN(st.N)}, duljina izvijanja ${f(d.HL)} m, χ = ${f(st.post.chi)}`, st.post.fail ? 'fail' : 'ok']);
    groups.push({ title: 'Nosivi elementi (S235)', rows });
    groups.push({
      title: 'Spojevi i temelji', rows: [
        ['Zidna greda: smicanje po sidru', kN(st.Vanchor), `sidra svakih ${f(st.anchorStep)} m; provjeriti nosivost zida i postojećih nosača`, ''],
        ['Zidna greda: čupanje po sidru (vjetar)', kN(st.Tanchor), st.netUp > 0 ? `neto podizanje ${f(st.netUp)} kN/m²` : 'vlastita težina drži krov', ''],
        ['Podizanje po stupu', kN(st.Tpost), 'temelj ga mora držati svojom težinom', ''],
        ['Temelj stupa', `${Math.round(st.footing * 100)} × ${Math.round(st.footing * 100)} × 80 cm`, 'beton C25/30, sidreni vijci M12', 'ok'],
        ['Stabilnost u smjeru dužine', 'dijagonale', 'na bočnoj strani (između 2 stupa) ili upeti stupovi', '']
      ]
    });
    return groups;
  };
})(window.N7);
