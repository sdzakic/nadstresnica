// Bill of materials derived from the same dimensions as the model and the drawing.
window.N7 = window.N7 || {};
(function (N7) {
  const KG = { p100: 11.7, p120x60: 8.0, p150x100: 14.9, p80: 7.0 }; // kg per metre of hollow section
  const up = (v, step) => N7.ceilTo(v, step || 0.05);

  function polyArea(pts) {
    let a = 0;
    for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; }
    return Math.abs(a) / 2;
  }

  N7.materials = function (d, roofKind, lk = {}) {
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
    const steelKg = d.nSide * sidePostL * kgPost + (frontSum + lintelDoor + lintelGar) * kgFront + d.nRafters * rafterL * kgRafter
      + d.D * kgBeam + d.D * 14.9 + fencePostL * KG.p80 + plates * 3.1 + (st.purlin ? purlinM * st.purlin.s.kg : 0);
    const perim = s_ => 2 * (s_.h + s_.b) / 1000;
    const paintArea = d.nSide * sidePostL * perim(st.post.s) + (frontSum + lintelDoor + lintelGar) * 0.4 + d.nRafters * rafterL * perim(st.rafter.s)
      + d.D * perim(st.beam.s) + d.D * 0.5 + fencePostL * 0.32 + (st.purlin ? purlinM * perim(st.purlin.s) : 0);
    const steelRows = [
      [`Stupovi uz susjeda ${st.post.s.name}`, `${kom(d.nSide)} × ${m(sidePostL)}`, d.attached ? 'prvi (kutni) nosi i garažna vrata' : 'nose bočnu gredu'],
      ['Stupovi na pročelju □100×100×4', `${kom(frontL.length)}: ${frontL.map(v => f(v)).join(' + ')} m`, d.frontPosts.map(q => q.role).join(', ') + ' · svi do roga'],
      ['Nadvoji □100×100×4', `${m(lintelDoor)} + ${m(lintelGar)}`, 'iznad ulaznih i garažnih vrata'],
      [`Rogovi ${st.rafter.s.name}`, `${kom(d.nRafters)} × ${m(rafterL)}`, `razmak ≈ ${f(st.sR)} m · ukupno ${m(d.nRafters * rafterL, 1)} · prema statici`]
    ];
    if (st.purlin) steelRows.push([`Podrožnice ${st.purlin.s.name}`, `${kom(st.nPurlins)} × ${m(d.D)}`, `preko rogova, razmak ${f(st.a)} m (za ${st.roof.name.toLowerCase()})`]);
    steelRows.push(
      [`Bočna greda ${st.beam.s.name}`, m(d.D), 'na stupovima uz susjeda'],
      ['Zidna greda □150×100×4', m(d.D), `na postojećim nosačima na zidu, na ${f(d.HH)} m`],
      ['Stup ograde □80×80×3', `${kom(1)} × ${m(fencePostL)}`, 'na kraju ograde uz susjeda, 60 cm u betonu'],
      ['Dijagonale □40×40×3', `2 × ${m(up(Math.hypot(d.sideZ[0] - d.sideZ[1], d.HL - 0.3)))}`, 'ukruta u smjeru dužine, između prva dva stupa uz susjeda'],
      ['Podložne ploče 200×200×10 mm', kom(plates), `ispod svakog stupa (${d.nSide} + ${d.frontPosts.length})`],
      ['Sidreni vijci M12 (ploče)', kom(plates * 4), 'u betonske temelje'],
      ['Kemijska sidra M12 (zidna greda)', kom(Math.ceil(d.D / st.anchorStep) + 1), `svakih ${Math.round(st.anchorStep * 100)} cm · ≈ ${f(st.Vanchor)} kN po sidru`],
      ['Ukupno čelika', `≈ ${Math.round(steelKg / 10) * 10} kg`, 'orijentacijski, za ponudu bravara'],
      ['Temeljna boja + završna RAL 7016', `≈ ${f(paintArea * 2 * 0.12, 1)} L`, `${m2(paintArea)} površine, 2 sloja (ili plastifikacija)`]
    );
    groups.push({ title: 'Čelična konstrukcija', rows: steelRows });

    // ---------- roof
    const roofLen = up(d.slopeLen + FIX.overhang);
    const roofDepth = d.D + 0.25;
    const roofArea = roofLen * roofDepth;
    const roofRows = [];
    if (roofKind === 'trap') {
      const n = Math.ceil(roofDepth / 1.035);
      roofRows.push(['Trapezni lim T-35, 0,5 mm, s filcom', `${kom(n)} × ${m(roofLen)}`, `${m2(n * 1.1 * roofLen)} bruto (korisna širina 1,035 m)`]);
      roofRows.push(['Samourezni vijci s brtvom', kom(Math.ceil(roofArea * 6)), '≈ 6 po m²']);
      if (d.pitchDeg < FIX.trapMinPitchDeg) roofRows.push(['Upozorenje', '—', `pad ${f(d.pitchDeg, 1)}° je premalen za trapezni lim`]);
    } else {
      const n = Math.ceil(roofDepth / 1.0), mm = roofKind === 'sandwich30' ? 30 : 40;
      roofRows.push([`Krovni sendvič panel ${mm} mm, RAL 7016`, `${kom(n)} × ${m(roofLen)}`, `${m2(n * roofLen)} (korisna širina 1,00 m)`]);
      roofRows.push(['Samourezni vijci s kapicom', kom(Math.ceil(roofArea * 4)), '≈ 4 po m²']);
    }
    roofRows.push(['Zidni opšav (spoj s kućom)', m(d.D + 0.3, 1), 'lim + trajnoelastični kit']);
    roofRows.push(d.parapet ? ['Bočni opšav (straga)', `1 × ${m(roofLen)}`, 'sprijeda ga zamjenjuje lim atike'] : ['Bočni opšavi (sprijeda i straga)', `2 × ${m(roofLen)}`, '']);
    roofRows.push(['Oluk polukružni 125 mm', m(d.D + 0.3, 1), `kuke ${kom(Math.ceil((d.D + 0.3) / 0.6) + 1)}, 2 čepa, 1 izljev`]);
    const pipeL = up(d.roofY(d.W + FIX.overhang) + 0.1, 0.1);
    roofRows.push(['Vertikala Ø80', m(pipeL, 1), `2 koljena + izljev, ${kom(Math.ceil(pipeL) + 1)} obujmica · sprijeda, voda ide prema ulici`]);
    groups.push({ title: `Krov · ${m2(roofArea)}`, rows: roofRows });

    // ---------- front sheet + fence
    const frontArea = polyArea(d.front);
    const fasciaW = d.post.x1;
    const railsM = 3 * (d.fenceW + FIX.door.x0 + Math.max(0, d.gx - FIX.door.x1 - 2 * FIX.postW)) + 2 * fasciaW + 2 * d.tail;
    groups.push({
      title: `Lim pročelja i ograda · ${m2(frontArea)}`, rows: [
        [`Fasadni lim s uspravnim spojem 300 mm, ${lk.sheet === 'house' ? 'u boji fasade kuće' : lk.sheet === 'wood' ? 'dekor drvo' : 'RAL 7016'}`, m2(frontArea * 1.1), `${m2(frontArea)} + 10 % rezanja · ${kom(Math.ceil(d.WL / 0.3))} lamela`],
        ['Pocinčani profil 40×40 (potkonstrukcija)', m(railsM, 1), '3 reda na punim dijelovima, 2 iznad vrata'],
        ['Opšavi i okapnice', m(fasciaW + (d.WL - d.W) + d.tail + d.HH, 1), 'donji rub iznad vrata, rub uz susjeda, bočni rubovi'],
        ['Fasadni vijci u boji', kom(Math.ceil(frontArea * 8)), '≈ 8 po m²'],
        ...(d.parapet ? [['Pokrovni opšav atike', m(d.WL + 0.1, 1), 'vrh lima u visini krova uz kuću']] : [])
      ]
    });

    // ---------- doors + intercom
    groups.push({
      title: 'Vrata i interfon', rows: [
        [`Sekcijska garažna vrata s motorom, ${look.garage}`, `${f(d.GW)} × ${f(d.GH)} m`, (d.lowHeadroom ? 'okov za nisku nadvisinu' : 'standardni okov') + (d.attached ? ' · desno na kutni stup' : '')],
        [`Ulazna vrata, aluminij, ${look.door}`, `${f(FIX.door.x1 - FIX.door.x0)} × ${f(d.doorH)} m`, 'šarke desno, otvaranje prema unutra'],
        ['Interfon s kamerom', '1 kpl', 'na limu između stupova vrata, kabel do kuće'],
        ['Kućni broj i sandučić', 'postojeći', 'premjestiti na lim uz interfon']
      ]
    });

    // ---------- concrete
    const footings = d.nSide + d.frontPosts.length + 1; // side posts + pročelje posts + fence post
    const fs = st.footing, fVol = footings * fs * fs * 0.8;
    const driveA = d.post.x1 * FIX.drivewayLen;
    const slabA = d.WL * d.D;
    groups.push({
      title: 'Beton', rows: [
        [`Temelji stupova ${Math.round(fs * 100)}×${Math.round(fs * 100)}×80 cm`, `${kom(footings)} · ${m3(fVol)}`, 'C25/30 · veličina iz statike (vjetar podiže krov)'],
        ['Betonski prilaz, 12 cm', `${m2(driveA)} · ${m3(driveA * 0.12)}`, `${f(d.post.x1)} × ${f(FIX.drivewayLen)} m do ceste`],
        ['Ploča ispod nadstrešnice, 12 cm', `${m2(slabA)} · ${m3(slabA * 0.12)}`, 'ako se radi i pod'],
        ['Armaturna mreža Q-188', m2((driveA + slabA) * 1.1), 'prilaz + ploča, s preklopima'],
        ['Tampon šljunak 15 cm', m3((driveA + slabA) * 0.15), 'ispod betona'],
        ['Ukupno betona', m3(fVol + (driveA + slabA) * 0.12), 'temelji + prilaz + ploča']
      ]
    });
    return groups;
  };

  N7.renderMaterials = function (el, groups) {
    el.innerHTML = '<thead><tr><th scope="col">Stavka</th><th scope="col">Količina</th><th scope="col">Napomena</th></tr></thead>' + groups.map(g => `
      <tbody>
        <tr class="grp"><th colspan="3" scope="colgroup">${g.title}</th></tr>
        ${g.rows.map(r => `<tr><td>${r[0]}</td><td class="q">${r[1]}</td><td class="n">${r[2]}</td></tr>`).join('')}
      </tbody>`).join('');
  };

  N7.materialsText = function (groups) {
    return groups.map(g => g.title + '\n' + g.rows.map(r => `- ${r[0]}: ${r[1]}${r[2] ? ' (' + r[2] + ')' : ''}`).join('\n')).join('\n\n');
  };
})(window.N7);
