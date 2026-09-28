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

  N7.materials = function (d, roofKind) {
    const FIX = N7.FIX, f = N7.fmt;
    const m = (v, dec) => f(v, dec == null ? 2 : dec) + ' m';
    const m2 = v => f(v, 1) + ' m²';
    const m3 = v => f(v, 2) + ' m³';
    const kom = n => n + ' kom';
    const groups = [];

    // ---------- steel
    const sidePostL = up(d.HL - 0.14);
    const frontPostL = up(d.roofY(d.post.x1) - FIX.rafterH);
    const fencePostL = up(d.tail + 0.6);
    const rafterL = up(d.slopeLen);
    const plates = d.nSide + 1;
    const posts100 = d.nSide * sidePostL + frontPostL;
    const steelKg = posts100 * KG.p100 + d.nRafters * rafterL * KG.p120x60 + d.D * KG.p100 + d.D * KG.p150x100 + fencePostL * KG.p80 + plates * 3.1;
    const paintArea = posts100 * 0.4 + d.nRafters * rafterL * 0.36 + d.D * 0.4 + d.D * 0.5 + fencePostL * 0.32;
    groups.push({
      title: 'Čelična konstrukcija', rows: [
        ['Stupovi □100×100×4', `${kom(d.nSide)} × ${m(sidePostL)} + ${kom(1)} × ${m(frontPostL)}`, `${d.nSide} uz susjeda, 1 uz garažna vrata · ukupno ${m(posts100, 1)}`],
        ['Rogovi □120×60×3', `${kom(d.nRafters)} × ${m(rafterL)}`, `razmak ≈ ${f(d.D / (d.nRafters - 1))} m · ukupno ${m(d.nRafters * rafterL, 1)}`],
        ['Bočna greda □100×100×4', m(d.D), 'na stupovima uz susjeda'],
        ['Zidna greda □150×100×4', m(d.D), `na zidu kuće, na ${f(d.HH)} m`],
        ['Stup ograde □80×80×3', `${kom(1)} × ${m(fencePostL)}`, 'na kraju ograde uz susjeda, 60 cm u betonu'],
        ['Podložne ploče 200×200×10 mm', kom(plates), 'ispod svakog stupa'],
        ['Sidreni vijci M12 (ploče)', kom(plates * 4), 'u betonske temelje'],
        ['Kemijska sidra M12 (zidna greda)', kom(Math.ceil(d.D / 0.5) + 1), 'svakih 50 cm'],
        ['Ukupno čelika', `≈ ${Math.round(steelKg / 10) * 10} kg`, 'orijentacijski, za ponudu bravara'],
        ['Temeljna boja + završna RAL 7016', `≈ ${f(paintArea * 2 * 0.12, 1)} L`, `${m2(paintArea)} površine, 2 sloja (ili plastifikacija)`]
      ]
    });

    // ---------- roof
    const roofLen = up(d.slopeLen + FIX.overhang);
    const roofDepth = d.D + 0.25;
    const roofArea = roofLen * roofDepth;
    const roofRows = [];
    if (roofKind === 'poly') {
      const n = Math.ceil(roofDepth / 2.1);
      roofRows.push(['Polikarbonat saćasti 16 mm', `${kom(n)} × 2,10 × ${m(roofLen)}`, `${m2(n * 2.1 * roofLen)} · UV zaštita gore`]);
      roofRows.push(['H-profili za spoj ploča', `${kom(n - 1)} × ${m(roofLen)}`, '']);
      roofRows.push(['Završni U-profil + antiprašna traka', m(roofDepth * 2 + roofLen * 2, 1), 'na sve rubove ploča']);
      roofRows.push(['Vijci s termo podloškom', kom(Math.ceil(roofArea * 4)), '≈ 4 po m²']);
    } else if (roofKind === 'trap') {
      const n = Math.ceil(roofDepth / 1.035);
      roofRows.push(['Trapezni lim T-35, 0,5 mm, s filcom', `${kom(n)} × ${m(roofLen)}`, `${m2(n * 1.1 * roofLen)} bruto (korisna širina 1,035 m)`]);
      roofRows.push(['Samourezni vijci s brtvom', kom(Math.ceil(roofArea * 6)), '≈ 6 po m²']);
      if (d.pitchDeg < FIX.trapMinPitchDeg) roofRows.push(['Upozorenje', '—', `pad ${f(d.pitchDeg, 1)}° je premalen za trapezni lim`]);
    } else {
      const n = Math.ceil(roofDepth / 1.0);
      roofRows.push(['Krovni sendvič panel 40 mm, RAL 7016', `${kom(n)} × ${m(roofLen)}`, `${m2(n * roofLen)} (korisna širina 1,00 m)`]);
      roofRows.push(['Samourezni vijci s kapicom', kom(Math.ceil(roofArea * 4)), '≈ 4 po m²']);
    }
    roofRows.push(['Zidni opšav (spoj s kućom)', m(d.D + 0.3, 1), 'lim + trajnoelastični kit']);
    roofRows.push(['Bočni opšavi (sprijeda i straga)', `2 × ${m(roofLen)}`, '']);
    roofRows.push(['Oluk polukružni 125 mm', m(d.D + 0.3, 1), `kuke ${kom(Math.ceil((d.D + 0.3) / 0.6) + 1)}, 2 čepa, 1 izljev`]);
    const pipeL = up(d.roofY(d.W + FIX.overhang) + 0.1, 0.1);
    roofRows.push(['Vertikala Ø80', m(pipeL, 1), `2 koljena + izljev, ${kom(Math.ceil(pipeL) + 1)} obujmica · sprijeda, voda ide prema ulici`]);
    groups.push({ title: `Krov · ${m2(roofArea)}`, rows: roofRows });

    // ---------- front sheet + fence
    const frontArea = polyArea(d.front);
    const fasciaW = d.post.x1;
    const railsM = 3 * (d.fenceW + FIX.door.x0 + Math.max(0, d.gx - FIX.pillar.x1)) + 2 * fasciaW + 2 * d.tail;
    groups.push({
      title: `Lim pročelja i ograda · ${m2(frontArea)}`, rows: [
        ['Fasadni lim s uspravnim spojem 300 mm, RAL 7016', m2(frontArea * 1.1), `${m2(frontArea)} + 10 % rezanja · ${kom(Math.ceil(d.WL / 0.3))} lamela`],
        ['Pocinčani profil 40×40 (potkonstrukcija)', m(railsM, 1), '3 reda na punim dijelovima, 2 iznad vrata'],
        ['Opšavi i okapnice', m(fasciaW + (d.WL - d.W) + d.tail + d.HH, 1), 'donji rub iznad vrata, rub uz susjeda, bočni rubovi'],
        ['Fasadni vijci u boji', kom(Math.ceil(frontArea * 8)), '≈ 8 po m²']
      ]
    });

    // ---------- doors + pillar
    groups.push({
      title: 'Vrata i stupić', rows: [
        ['Sekcijska garažna vrata s motorom', `${f(d.GW)} × ${f(d.GH)} m`, d.lowHeadroom ? 'okov za nisku nadvisinu' : 'standardni okov'],
        ['Ulazna vrata, aluminij, antracit', `${f(FIX.door.x1 - FIX.door.x0)} × ${f(FIX.door.h)} m`, 'šarke desno, otvaranje prema unutra'],
        ['Stupić 25×25 cm', `${kom(Math.ceil(d.GH / 0.2))} betonskih blokova`, `visina ${f(d.GH)} m, žbuka + fasada`],
        ['Interfon s kamerom', '1 kpl', 'kabel do kuće'],
        ['Kućni broj i sandučić', 'postojeći', 'premjestiti na stupić']
      ]
    });

    // ---------- concrete
    const footings = d.nSide + 2; // side posts + garage post + fence post
    const fVol = footings * 0.4 * 0.4 * 0.8;
    const driveA = d.post.x1 * FIX.drivewayLen;
    const slabA = d.WL * d.D;
    groups.push({
      title: 'Beton', rows: [
        ['Temelji stupova 40×40×80 cm', `${kom(footings)} · ${m3(fVol)}`, 'C25/30'],
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
