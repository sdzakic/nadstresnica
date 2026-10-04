// Bill of materials derived from the same dimensions as the model and the drawing.
window.N7 = window.N7 || {};
(function (N7) {
  const KG = { p100: 11.7, p120x60: 8.0, p150x100: 14.9, p80: 7.0 }; // kg per metre of hollow section
  const up = (v, step) => N7.ceilTo(v, step || 0.05);

  // Default unit prices in € with VAT, rough Croatian retail prices from web shops (autumn 2026), without labour and delivery.
  // Steel sections are priced from their weight: black S235 hollow sections cost ≈ 1,40 €/kg (100×100×3, 6 m ≈ 74 €).
  const STEEL_EUR_KG = 1.45;
  const steelPrice = kg => Math.round(kg * STEEL_EUR_KG * 10) / 10;
  const PRICES = {
    plate: 5, bolt: 1.2, chem: 3.5, paint: 15,
    sandwich: 22, sandwich30: 20, trap: 10, roofScrew: 0.25, facScrew: 0.15,
    flash: 9, gutter: 12, downpipe: 10,
    'facade-anth': 16, 'facade-house': 18, 'facade-wood': 24, rail: 2.5,
    garage: 1200, door: 1500, intercom: 250,
    cement: 5.5, gravel: 40, tampon: 22, mesh: 3.3
  };
  const KGM = {};   // weight per metre of every steel section seen so far, keyed by its name
  N7.priceDefault = k => k.startsWith('kg:') ? steelPrice(KGM[k.slice(3)] || 0) : PRICES[k];
  // a priced row: key, numeric quantity, unit; one price per section name, wherever it is used
  const P = (k, q, u) => ({ k, q, u });
  const sec = (name, kg, q) => { if (!KGM[name]) KGM[name] = kg; return P('kg:' + name, q, 'm'); };
  const steel = (s_, q) => sec(s_.name, s_.kg, q);

  function polyArea(pts) {
    let a = 0;
    for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; }
    return Math.abs(a) / 2;
  }

  N7.materials = function (d, roofKind, lk = {}, opt = {}) {
    const mix = opt.mix || 3, slab = opt.slab !== false;
    const C = N7.COLORS, look = { garage: C.garage[lk.garage || 'anth'][0].toLowerCase(), door: C.door[lk.door || 'anth'][0].toLowerCase(), sheet: C.sheet[lk.sheet || 'anth'] };
    const FIX = N7.FIX, f = N7.fmt;
    const m = (v, dec) => f(v, dec == null ? 2 : dec) + ' m';
    const m2 = v => f(v, 1) + ' m²';
    const m3 = v => f(v, 2) + ' m³';
    const kom = n => n + ' kom';
    const groups = [];

    // ---------- steel (sections from the static check)
    const st = d.st, gm = 1;
    const sidePostL = up(d.HL - st.beam.s.h / 1000 - 0.02);
    const frontL = d.frontPosts.map(q => up(q.h));
    const frontSum = frontL.reduce((a, b) => a + b, 0);
    const lintelDoor = up(FIX.door.x1 - FIX.door.x0 + 2 * FIX.postW), lintelGar = up(d.post.x1 - d.gx + FIX.postW);
    const fencePostL = up(d.tail + 0.6);
    const rafterL = up(d.slopeLen);
    const plates = d.nSide + d.frontPosts.length;
    const posts100 = d.nSide * sidePostL + frontSum + lintelDoor + lintelGar;
    const kgPost = st.post.s.kg, kgFront = 11.7, kgBeam = st.beam.s.kg, kgRafter = st.rafter.s.kg;
    const purlinM = st.purlin ? st.nPurlins * d.D : 0;
    const tr = st.rafter.s.truss, botL = up(d.W - 0.12);
    const rafterKg = tr ? d.nRafters * tr.kg + d.D * tr.bot.kg : d.nRafters * rafterL * kgRafter;
    const steelKg = d.nSide * sidePostL * kgPost + (frontSum + lintelDoor + lintelGar) * kgFront + rafterKg
      + d.D * kgBeam + d.D * 14.9 + fencePostL * KG.p80 + plates * 3.1 + (st.purlin ? purlinM * st.purlin.s.kg : 0);
    const perim = s_ => 2 * (s_.h + s_.b) / 1000;
    const rafterPerim = perim(st.rafter.s);
    const bt = st.beam.s.truss, beamPerim = bt ? 2 * perim(bt.chord) + Math.SQRT2 * Math.PI * bt.bar.d / 1000 : perim(st.beam.s);
    const rafterPaint = tr ? d.nRafters * (rafterL * perim(tr.top) + botL * perim(tr.bot) + tr.webLen * (tr.web.round ? Math.PI * tr.web.h / 1000 : perim(tr.web))) + d.D * perim(tr.bot) : d.nRafters * rafterL * rafterPerim;
    const paintArea = d.nSide * sidePostL * perim(st.post.s) + (frontSum + lintelDoor + lintelGar) * 0.4 + rafterPaint
      + d.D * beamPerim + d.D * 0.5 + fencePostL * 0.32 + (st.purlin ? purlinM * perim(st.purlin.s) : 0);
    const nChem = Math.ceil(d.D / st.anchorStep) + 1;
    const diagL = up(Math.hypot(d.sideZ[0] - d.sideZ[1], d.HL - 0.3));
    const FRONT = sec('□100×100×4', kgFront, 0).k;
    const steelRows = [
      [`Stupovi uz susjeda ${st.post.s.name}`, `${kom(d.nSide)} × ${m(sidePostL)}`, d.attached ? 'prvi (kutni) nosi i garažna vrata' : 'nose bočnu gredu', steel(st.post.s, d.nSide * sidePostL)],
      ['Stupovi na pročelju □100×100×4', `${kom(frontL.length)}: ${frontL.map(v => f(v)).join(' + ')} m`, d.frontPosts.map(q => q.role).join(', ') + ' · svi do roga', P(FRONT, frontSum, 'm')],
      ['Nadvoji □100×100×4', `${m(lintelDoor)} + ${m(lintelGar)}`, 'iznad ulaznih i garažnih vrata', P(FRONT, lintelDoor + lintelGar, 'm')],
    ];
    const spacing = d.doorSkip ? `razmak do ${f(st.sR)} m, zaobilaze bočna vrata kuće` : `razmak ≈ ${f(st.sR)} m`;
    if (tr) steelRows.push(
      [`Rogovi: ${st.rafter.s.name}`, kom(d.nRafters), `${f(tr.hWall)} m visoki uz kuću, ${f(tr.de)} m na kraju · ${spacing} · ≈ ${Math.round(tr.kg)} kg po rogu`],
      [`  gornja pojasnica (rog) ${tr.top.name}`, `${kom(d.nRafters)} × ${m(rafterL)}`, 'kosa, nosi podrožnice u čvorovima', steel(tr.top, d.nRafters * rafterL)],
      [`  donja cijev ${tr.bot.name}`, `${kom(d.nRafters)} × ${m(botL)}`, `vodoravna, donji rub na ${f(d.rt.yB)} m`, steel(tr.bot, d.nRafters * botL)],
      [`  zmija ${tr.web.name}`, m(d.nRafters * tr.webLen, 1), `${2 * tr.nP} kosih štapova + 2 vertikale po rogu`, steel(tr.web, d.nRafters * tr.webLen)],
      [`Uzdužna veza donjih cijevi ${tr.bot.name}`, m(d.D), 'na sredini raspona; drži donje cijevi kad vjetar podiže krov', steel(tr.bot, d.D)]
    );
    else steelRows.push([`Rogovi ${st.rafter.s.name}`, `${kom(d.nRafters)} × ${m(rafterL)}`, `${spacing} · ukupno ${m(d.nRafters * rafterL, 1)} · prema statici`, steel(st.rafter.s, d.nRafters * rafterL)]);
    if (st.purlin) steelRows.push([`Podrožnice ${st.purlin.s.name}`, `${kom(st.nPurlins)} × ${m(d.D)}`, `preko rogova, razmak ${f(st.a)} m (za ${st.roof.name.toLowerCase()})`, steel(st.purlin.s, st.nPurlins * d.D)]);
    steelRows.push(
      ...(bt ? [
        [`Bočna greda: rešetka ${bt.h / 10} cm (zmija)`, m(d.D), 'jedan raspon na 2 kutna stupa, bez srednjih stupova'],
        [`  pojasnice ${bt.chord.name}`, m(2 * d.D, 1), 'gornja i donja', steel(bt.chord, 2 * d.D)],
        [`  zmija, šipka Ø${bt.bar.d}`, m(Math.SQRT2 * d.D * 1.05, 1), 'savijena u cik-cak pod 45°, zavarena na pojasnice', sec(`šipka Ø${bt.bar.d}`, bt.bar.kg, Math.SQRT2 * d.D * 1.05)]
      ] : [[`Bočna greda ${st.beam.s.name}`, m(d.D), 'na stupovima uz susjeda', steel(st.beam.s, d.D)]]),
      ['Zidna greda □150×100×4', m(d.D), `na postojećim nosačima na zidu, na ${f(d.HH)} m`, sec('□150×100×4', 14.9, d.D)],
      ['Stup ograde □80×80×3', `${kom(1)} × ${m(fencePostL)}`, 'na kraju ograde uz susjeda, 60 cm u betonu', sec('□80×80×3', KG.p80, fencePostL)],
      ['Dijagonale □40×40×3', `2 × ${m(diagL)}`, d.nSide > 2 ? 'ukruta u smjeru dužine, između prva dva stupa uz susjeda' : 'ukruta u smjeru dužine, kutni stup – rešetkasta greda', sec('□40×40×3', 3.49, 2 * diagL)],
      ['Podložne ploče 200×200×10 mm', kom(plates), `ispod svakog stupa (${d.nSide} + ${d.frontPosts.length})`, P('plate', plates, 'kom')],
      ['Sidreni vijci M12 (ploče)', kom(plates * 4), 'u betonske temelje', P('bolt', plates * 4, 'kom')],
      ['Kemijska sidra M12 (zidna greda)', kom(nChem), `svakih ${Math.round(st.anchorStep * 100)} cm · ≈ ${f(st.Vanchor)} kN po sidru`, P('chem', nChem, 'kom')],
      ['Ukupno čelika', `≈ ${Math.round(steelKg / 10) * 10} kg`, 'orijentacijski, za ponudu bravara'],
      ['Temeljna boja + završna RAL 7016', `≈ ${f(paintArea * 2 * 0.12, 1)} L`, `${m2(paintArea)} površine, 2 sloja (ili plastifikacija)`, P('paint', Math.ceil(paintArea * 2 * 0.12), 'L')]
    );
    groups.push({ title: 'Čelična konstrukcija', rows: steelRows });

    // ---------- roof
    const roofLen = up(d.slopeLen + FIX.overhang);
    const roofDepth = d.D + 0.25;
    const roofArea = roofLen * roofDepth;
    const roofRows = [];
    if (roofKind === 'trap') {
      const n = Math.ceil(roofDepth / 1.035);
      roofRows.push(['Trapezni lim T-35, 0,5 mm, s filcom', `${kom(n)} × ${m(roofLen)}`, `${m2(n * 1.1 * roofLen)} bruto (korisna širina 1,035 m)`, P('trap', n * 1.1 * roofLen, 'm²')]);
      roofRows.push(['Samourezni vijci s brtvom', kom(Math.ceil(roofArea * 6)), '≈ 6 po m²', P('roofScrew', Math.ceil(roofArea * 6), 'kom')]);
      if (d.pitchDeg < FIX.trapMinPitchDeg) roofRows.push(['Upozorenje', '—', `pad ${f(d.pitchDeg, 1)}° je premalen za trapezni lim`]);
    } else {
      const n = Math.ceil(roofDepth / 1.0), mm = roofKind === 'sandwich30' ? 30 : 40;
      roofRows.push([`Krovni sendvič panel ${mm} mm, RAL 7016`, `${kom(n)} × ${m(roofLen)}`, `${m2(n * roofLen)} (korisna širina 1,00 m)`, P(roofKind === 'sandwich30' ? 'sandwich30' : 'sandwich', n * roofLen, 'm²')]);
      roofRows.push(['Samourezni vijci s kapicom', kom(Math.ceil(roofArea * 4)), '≈ 4 po m²', P('roofScrew', Math.ceil(roofArea * 4), 'kom')]);
    }
    roofRows.push(['Zidni opšav (spoj s kućom)', m(d.D + 0.3, 1), 'lim + trajnoelastični kit', P('flash', d.D + 0.3, 'm')]);
    roofRows.push(d.parapet ? ['Bočni opšav (straga)', `1 × ${m(roofLen)}`, 'sprijeda ga zamjenjuje lim atike', P('flash', roofLen, 'm')] : ['Bočni opšavi (sprijeda i straga)', `2 × ${m(roofLen)}`, '', P('flash', 2 * roofLen, 'm')]);
    roofRows.push(['Oluk polukružni 125 mm', m(d.D + 0.3, 1), `kuke ${kom(Math.ceil((d.D + 0.3) / 0.6) + 1)}, 2 čepa, 1 izljev · cijena s kukama`, P('gutter', d.D + 0.3, 'm')]);
    const pipeL = up(d.roofY(d.W + FIX.overhang) + 0.1, 0.1);
    roofRows.push(['Vertikala Ø80', m(pipeL, 1), `2 koljena + izljev, ${kom(Math.ceil(pipeL) + 1)} obujmica · sprijeda, voda ide prema ulici`, P('downpipe', pipeL, 'm')]);
    groups.push({ title: `Krov · ${m2(roofArea)}`, rows: roofRows });

    // ---------- front sheet + fence
    const frontArea = polyArea(d.front);
    const fasciaW = d.post.x1;
    const railsM = 3 * (d.fenceW + FIX.door.x0 + Math.max(0, d.gx - FIX.door.x1 - 2 * FIX.postW)) + 2 * fasciaW + 2 * d.tail;
    groups.push({
      title: `Lim pročelja i ograda · ${m2(frontArea)}`, rows: [
        [`Fasadni lim s uspravnim spojem 300 mm, ${lk.sheet === 'house' ? 'u boji fasade kuće' : lk.sheet === 'wood' ? 'dekor drvo' : 'RAL 7016'}`, m2(frontArea * 1.1), `${m2(frontArea)} + 10 % rezanja · ${kom(Math.ceil(d.WL / 0.3))} lamela`, P('facade-' + (lk.sheet || 'anth'), frontArea * 1.1, 'm²')],
        ['Pocinčani profil 40×40 (potkonstrukcija)', m(railsM, 1), '3 reda na punim dijelovima, 2 iznad vrata', P('rail', railsM, 'm')],
        ['Opšavi i okapnice', m(fasciaW + (d.WL - d.W) + d.tail + d.HH, 1), 'donji rub iznad vrata, rub uz susjeda, bočni rubovi', P('flash', fasciaW + (d.WL - d.W) + d.tail + d.HH, 'm')],
        ['Fasadni vijci u boji', kom(Math.ceil(frontArea * 8)), '≈ 8 po m²', P('facScrew', Math.ceil(frontArea * 8), 'kom')],
        ...(d.parapet ? [['Pokrovni opšav atike', m(d.WL + 0.1, 1), 'vrh lima u visini krova uz kuću', P('flash', d.WL + 0.1, 'm')]] : [])
      ]
    });

    // ---------- doors + intercom
    groups.push({
      title: 'Vrata i interfon', rows: [
        [`Sekcijska garažna vrata s motorom, ${look.garage}`, `${f(d.GW)} × ${f(d.GH)} m`, (d.lowHeadroom ? 'okov za nisku nadvisinu' : 'standardni okov') + (d.attached ? ' · desno na kutni stup' : ''), P('garage', 1, 'kpl')],
        [`Ulazna vrata, aluminij, ${look.door}`, `${f(FIX.door.x1 - FIX.door.x0)} × ${f(d.doorH)} m`, 'šarke desno, otvaranje prema unutra', P('door', 1, 'kpl')],
        ['Interfon s kamerom', '1 kpl', 'na limu između stupova vrata, kabel do kuće', P('intercom', 1, 'kpl')],
        ['Kućni broj i sandučić', 'postojeći', 'premjestiti na lim uz interfon']
      ]
    });

    // ---------- concrete
    const footings = d.nSide + d.frontPosts.length + 1; // side posts + pročelje posts + fence post
    const fs = st.footing, fVol = footings * fs * fs * 0.8;
    const driveA = d.post.x1 * FIX.drivewayLen;
    const slabA = slab ? d.WL * d.D : 0;
    const flatA = driveA + slabA, vol = fVol + flatA * 0.12;
    // cement : aggregate by volume; the dry mix shrinks by about a third when mixed, so dry volume ≈ 1,54 × wet
    const dry = vol * 1.54, cementKg = dry / (1 + mix) * 1440, bags = Math.ceil(cementKg / 25);
    const gravelM3 = dry * mix / (1 + mix), water = cementKg * 0.5;
    const r = v => Math.round(v * 100) / 100;
    groups.push({
      title: `Beton · ${m3(vol)}`, rows: [
        [`Temelji stupova ${Math.round(fs * 100)}×${Math.round(fs * 100)}×80 cm`, `${kom(footings)} · ${m3(fVol)}`, 'veličina iz statike (vjetar podiže krov)'],
        ['Betonski prilaz, 12 cm', `${m2(driveA)} · ${m3(driveA * 0.12)}`, `${f(d.post.x1)} × ${f(FIX.drivewayLen)} m do ceste`],
        slab ? ['Ploča ispod nadstrešnice, 12 cm', `${m2(slabA)} · ${m3(slabA * 0.12)}`, `${f(d.WL)} × ${f(d.D)} m`] : ['Ploča ispod nadstrešnice', 'ne radi se', 'uključi je iznad tablice'],
        [`Cement CEM II 42,5, vreće 25 kg (1 : ${f(mix, 1)})`, `${bags} × 25 kg = ${Math.round(bags * 25)} kg`, `za ${m3(vol)} betona, ≈ ${Math.round(cementKg / vol)} kg/m³`, P('cement', bags, 'vreća')],
        [`Šljunak separirani 0–16 mm (${f(mix, 1)} dijela)`, `${m3(gravelM3)} · ≈ ${f(gravelM3 * 1.65, 1)} t`, 'mješavina pijeska i šljunka za beton', P('gravel', r(gravelM3), 'm³')],
        ['Voda', `≈ ${Math.round(water / 10) * 10} L`, 'v/c ≈ 0,5; manje ako je šljunak mokar'],
        ['Armaturna mreža Q-188', m2(flatA * 1.1), `${slab ? 'prilaz + ploča' : 'prilaz'}, s preklopima · ploča 2,15 × 6 m = 12,9 m²`, P('mesh', flatA * 1.1, 'm²')],
        ['Tampon šljunak 0–63, 15 cm', m3(flatA * 0.15), 'ispod betona, nabijeni', P('tampon', r(flatA * 0.15), 'm³')]
      ]
    });
    return groups;
  };

  // ---------- prices: optional unit prices next to each row, totals per group and overall
  const euro = v => v.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  N7.euro = euro;
  N7.rowCost = (pr, prices) => { const u = prices[pr.k] != null ? prices[pr.k] : N7.priceDefault(pr.k); return isFinite(u) ? u * pr.q : 0; };
  N7.costs = (groups, prices) => {
    const g = groups.map(gr => gr.rows.reduce((a, r) => a + (r[3] ? N7.rowCost(r[3], prices) : 0), 0));
    return { groups: g, total: g.reduce((a, b) => a + b, 0) };
  };
  const unitPrice = (k, prices) => prices[k] != null ? prices[k] : N7.priceDefault(k);

  N7.renderMaterials = function (el, groups, prices = {}) {
    const c = N7.costs(groups, prices);
    el.innerHTML = '<thead><tr><th scope="col">Stavka</th><th scope="col">Količina</th><th scope="col">Napomena</th><th scope="col">Jed. cijena</th><th scope="col" class="eur">Iznos</th></tr></thead>' + groups.map((g, gi) => `
      <tbody>
        <tr class="grp"><th colspan="4" scope="colgroup">${g.title}</th><th class="eur" data-g="${gi}">${c.groups[gi] ? euro(c.groups[gi]) : ''}</th></tr>
        ${g.rows.map(r => `<tr><td>${r[0]}</td><td class="q">${r[1]}</td><td class="n">${r[2]}</td>${r[3] ? `<td class="pr"><label><input type="text" inputmode="decimal" data-k="${r[3].k}" value="${N7.fmt(unitPrice(r[3].k, prices), 2)}" aria-label="Cijena: ${r[0]}"${prices[r[3].k] != null ? ' class="own"' : ''}><span>€/${r[3].u}</span></label></td><td class="eur" data-q="${r[3].q}" data-k="${r[3].k}">${euro(N7.rowCost(r[3], prices))}</td>` : '<td></td><td></td>'}</tr>`).join('')}
      </tbody>`).join('') + `<tfoot><tr><th colspan="4" scope="row">Ukupno materijal, okvirno s PDV-om, bez rada i dostave</th><th class="eur" id="bom-total">${euro(c.total)}</th></tr></tfoot>`;
  };

  N7.materialsText = function (groups, prices = {}) {
    const c = N7.costs(groups, prices);
    return groups.map((g, gi) => g.title + (c.groups[gi] ? ` · ${euro(c.groups[gi])}` : '') + '\n' + g.rows.map(r => `- ${r[0]}: ${r[1]}${r[2] ? ' (' + r[2] + ')' : ''}${r[3] ? ` · ${N7.fmt(unitPrice(r[3].k, prices), 2)} €/${r[3].u} = ${euro(N7.rowCost(r[3], prices))}` : ''}`).join('\n')).join('\n\n')
      + `\n\nUkupno materijal (okvirno, s PDV-om, bez rada i dostave): ${euro(c.total)}`;
  };
})(window.N7);
