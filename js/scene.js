// Three.js model of the house, the neighbour and the carport.
// N7.createScene(stage) builds the static surroundings once; update(d) rebuilds the carport
// from the derived dimensions in config.js.
window.N7 = window.N7 || {};
(function (N7) {
  N7.createScene = function (stage) {
    const FIX = N7.FIX;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let d = null;
    let target = null;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    stage.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcfd8dd);
    scene.fog = new THREE.Fog(0xcfd8dd, 30, 70);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 3; controls.maxDistance = 40;

    scene.add(new THREE.HemisphereLight(0xeef3f7, 0x7a7466, 0.75));
    const sun = new THREE.DirectionalLight(0xfff4e2, 0.95);
    sun.position.set(9, 14, 11); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 50 });
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    // ---------- helpers
    function tex(w, h, draw, rx, ry) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); t.anisotropy = 8; return t; }
    const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .8, metalness: 0 }, o || {}));
    function B(x0, x1, y0, y1, z0, z1, mat, cast) { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = cast !== false; m.receiveShadow = true; (target || scene).add(m); return m; }
    function slopeX(xa, ya, xb, yb, z0, z1, h, mat) { const L = Math.hypot(xb - xa, yb - ya); const m = new THREE.Mesh(new THREE.BoxGeometry(L, h, z1 - z0), mat); m.position.set((xa + xb) / 2, (ya + yb) / 2, (z0 + z1) / 2); m.rotation.z = Math.atan2(yb - ya, xb - xa); m.castShadow = m.receiveShadow = true; (target || scene).add(m); return m; }
    function plane(w, h, mat, x, y, z, ry) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; m.receiveShadow = true; scene.add(m); return m; }
    function grain(g, w, h, base, dark, dir) {
      g.fillStyle = base; g.fillRect(0, 0, w, h); let s = 7; const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      for (let i = 0; i < 260; i++) {
        g.strokeStyle = dark; g.globalAlpha = .08 + r() * .18; g.lineWidth = .6 + r() * 1.6; g.beginPath();
        if (dir === 'v') { const x = r() * w; g.moveTo(x, 0); g.bezierCurveTo(x + r() * 6 - 3, h * .3, x + r() * 6 - 3, h * .6, x + r() * 4 - 2, h); }
        else { const y = r() * h; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + r() * 6 - 3, w * .6, y + r() * 6 - 3, w, y + r() * 4 - 2); }
        g.stroke();
      }
      g.globalAlpha = 1;
    }

    // ---------- ground
    const gnd = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), M(0x9a9178)); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; scene.add(gnd);
    B(-30, 30, 0, 0.02, -40, 0.3, M(0x8f8a70), false); // yard
    B(-30, 30, 0, 0.06, 0.3, 1.6, M(0xc3c1b9, { roughness: .95 }), false); // sidewalk
    B(-30, 30, 0, 0.04, 1.6, 4.2, M(0x6f8a4b), false); // grass
    B(-30, 30, 0, 0.03, 4.2, 12, M(0x4b4e52, { roughness: .95 }), false); // road

    // ---------- green house (x -8..0)
    const HL_ = FIX.houseLen;
    const houseMat = M(0xaab7a3, { roughness: .95 });
    B(-8, 0, 0, 4.4, -HL_, 0, houseMat);
    B(-8.03, 0.03, 0, 0.45, -HL_ - 0.03, 0.03, M(0x86937f, { roughness: .95 }));
    {
      const s = new THREE.Shape(); s.moveTo(-8, 4.4); s.lineTo(0, 4.4); s.lineTo(-4, 7.2); s.lineTo(-8, 4.4);
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: HL_, bevelEnabled: false }), houseMat); m.position.z = -HL_; m.castShadow = m.receiveShadow = true; scene.add(m);
    }
    {
      const tile = M(0xae5536, { roughness: .85 });
      const ang = Math.atan2(2.8, 4), rl = Math.hypot(4, 2.8) + 0.55;
      const cx = -4 + Math.cos(ang) * rl / 2, cy = 7.2 - Math.sin(ang) * rl / 2 + 0.08;
      const r1 = new THREE.Mesh(new THREE.BoxGeometry(rl, 0.16, HL_ + 0.8), tile); r1.position.set(cx, cy, -HL_ / 2); r1.rotation.z = -ang; r1.castShadow = true; scene.add(r1);
      const r2 = r1.clone(); r2.position.x = -8 - cx; r2.rotation.z = ang; scene.add(r2);
    }
    B(0.36, 0.5, 4.0, 4.12, -HL_ - 0.4, 0.4, M(0xb7bcbf, { metalness: .5, roughness: .4 })); // house gutter
    { // side door + steps
      const sd = FIX.sideDoor, st = FIX.stairs;
      plane(sd.z1 - sd.z0, sd.y1 - sd.y0, M(0xf3f3ef, { roughness: .5 }), 0.012, (sd.y0 + sd.y1) / 2, (sd.z0 + sd.z1) / 2, Math.PI / 2);
      st.widths.forEach((w, i) => B(0, w, i * st.rise, (i + 1) * st.rise, st.z0 + i * st.inset, st.z1 - i * st.inset, M(0xa8a79f, { roughness: 1 })));
    }
    plane(1.0, 0.36, M(0xd6dde0, { roughness: .2, metalness: .1 }), 0.012, 3.72, -1.8, Math.PI / 2); // glass block window
    plane(0.34, 0.5, M(0xe6e2d6), 0.012, 1.55, -0.75, Math.PI / 2); // meter box

    // ---------- neighbour house
    B(6.4, 14, 0, 6.3, -13, -2.6, M(0xecebe6, { roughness: .9 }));
    B(6.38, 14.02, 0, 1.1, -13.02, -2.58, M(0x6c7073, { roughness: .9 }));
    {
      const rise = 2.3, half = 5.2, a = Math.atan2(rise, half), L = Math.hypot(half, rise) + 0.5, dark = M(0x4f3d36, { roughness: .9 });
      const r1 = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.16, L), dark); r1.position.set(10.2, 6.3 + rise / 2 + 0.02, -2.6 - half / 2 + 0.2); r1.rotation.x = -a; r1.castShadow = true; scene.add(r1);
      const r2 = r1.clone(); r2.position.z = -13 + half / 2 - 0.2; r2.rotation.x = a; scene.add(r2);
    }
    const rBrick = M(0x9a5a44, { roughness: 1 });

    // ---------- materials of the carport
    const steel = M(0x363b3f, { metalness: .55, roughness: .45 });
    const floorMat = M(0xbdbcb5, { roughness: .95 });
    function ribTex(base, rib, px) { const t = tex(8, 64, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = rib; g.fillRect(0, h * .42, w, h * .16); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, h * .4, w, h * .03); }); t.userData = { px }; return t; }
    const roofMats = {
      sandwich: M(0xffffff, { map: ribTex('#3b4146', '#2c3134', 0.33), roughness: .55, metalness: .25 }),
      trap: M(0xffffff, { map: ribTex('#7d8286', '#5f6468', 0.2), roughness: .4, metalness: .6 }),
      poly: new THREE.MeshStandardMaterial({ color: 0xe7e2d4, map: ribTex('#ffffff', '#d9d6cc', 0.032), transparent: true, opacity: .42, roughness: .25, depthWrite: false, side: THREE.DoubleSide })
    };
    let roofKind = 'sandwich', roof = null;
    const gutMat = M(0x3a3f43, { metalness: .5, roughness: .4, side: THREE.DoubleSide });
    function seamTex(base, seam) { return tex(128, 32, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = seam; for (let i = 0; i < 4; i++) g.fillRect(i * 32, 0, 3, h); g.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 4; i++) g.fillRect(i * 32 + 3, 0, 1, h); }); }
    function woodSeamTex() { return tex(256, 256, (g, w, h) => { grain(g, w, h, '#9a6a3e', '#4d2e17', 'v'); g.fillStyle = 'rgba(40,22,10,.55)'; for (let i = 0; i < 2; i++) g.fillRect(i * 128, 0, 3, h); }, 0.5, 0.5); }
    const fasciaMat = M(0xffffff, { map: seamTex('#3b4146', '#2b3033'), roughness: .5, metalness: .3 });
    const pillarMat = M(0xe3e3dc, { roughness: .9 });

    // ---------- entrance door (hinged on the right, opens inwards)
    const doorTex = tex(200, 420, (g, w, h) => {
      g.fillStyle = '#33393d'; g.fillRect(0, 0, w, h); g.strokeStyle = '#23272a'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
      g.fillStyle = '#9aabb3'; g.fillRect(w * .62, h * .08, w * .1, h * .84); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(w * .62, h * .08, w * .02, h * .84);
      g.fillStyle = '#c9ccce'; g.fillRect(w * .13, h * .3, w * .035, h * .4); g.fillStyle = '#23272a'; for (let i = 1; i < 4; i++) g.fillRect(w * .22, h * i / 4, w * .34, 2);
    });
    const dw = FIX.door.x1 - FIX.door.x0, dh = FIX.door.h;
    const doorPivot = new THREE.Group(); doorPivot.position.set(FIX.door.x1, 0, -0.05); scene.add(doorPivot);
    {
      // the texture has its handle on the left, away from the hinge
      const dm = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh), M(0xffffff, { map: doorTex, roughness: .5, metalness: .2, side: THREE.DoubleSide }));
      dm.position.set(-dw / 2, dh / 2 + 0.05, 0); dm.castShadow = true; doorPivot.add(dm);
    }
    B(FIX.door.x0 - 0.05, FIX.door.x0, 0.05, dh + 0.05, -0.12, 0.02, steel); B(FIX.door.x0 - 0.05, FIX.door.x1, dh, dh + 0.05, -0.12, 0.02, steel);

    // ---------- intercom + house number on the pillar
    const pc = (FIX.pillar.x0 + FIX.pillar.x1) / 2;
    B(pc - 0.075, pc + 0.075, 1.3, 1.52, 0.02, 0.05, M(0x2a2e31, { metalness: .4, roughness: .4 }));
    B(pc - 0.045, pc + 0.045, 1.42, 1.49, 0.05, 0.052, M(0x7fa0b3, { roughness: .2, emissive: 0x1b2a33 }));
    {
      const nt = tex(128, 128, (g, w, h) => { g.fillStyle = '#2c4f9e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#fff'; g.font = 'bold 84px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('7', w / 2, h / 2 + 4); });
      plane(0.16, 0.16, M(0xffffff, { map: nt, roughness: .5 }), pc, 1.75, 0.025);
    }

    // ---------- sectional garage door
    function garageTex(kind) {
      return tex(512, 382, (g, w, h) => {
        const base = kind === 'wood' ? '#9a6a3e' : kind === 'white' ? '#eceee9' : '#3f454a';
        if (kind === 'wood') grain(g, w, h, base, '#4d2e17', 'h'); else { g.fillStyle = base; g.fillRect(0, 0, w, h); }
        const sec = 5;
        for (let i = 0; i < sec; i++) {
          const y = i * h / sec;
          g.fillStyle = kind === 'white' ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.45)'; g.fillRect(0, y, w, 3);
          g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, y + 3, w, 1.5);
          if (kind !== 'wood') { g.fillStyle = kind === 'white' ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.04)'; for (let k = 8; k < h / sec; k += 8) g.fillRect(0, y + k, w, 1); }
        }
        g.fillStyle = kind === 'white' ? '#b8bcbe' : '#222'; g.fillRect(w * .47, h * .9, w * .06, h * .02);
      });
    }
    const GZ = -0.08, NP = 5, TR = 0.04;
    let garageBase = garageTex('anth');
    const gPanels = [];
    for (let i = 0; i < NP; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.4), M(0xffffff, { roughness: .55, metalness: .15, side: THREE.DoubleSide })); m.castShadow = m.receiveShadow = true; scene.add(m); gPanels.push(m); }
    function mapPanels() { gPanels.forEach((m, i) => { if (m.material.map) m.material.map.dispose(); const t = garageBase.clone(); t.needsUpdate = true; t.repeat.set(1, 1 / NP); t.offset.set(0, i / NP); m.material.map = t; m.material.needsUpdate = true; }); }
    mapPanels();
    // the panels run up the vertical track, round a small bend and continue back under the roof
    function track(t, GH) {
      const arc = Math.PI * TR / 2;
      if (t <= GH) return [t, GZ, 0];
      if (t <= GH + arc) { const th = (t - GH) / TR; return [GH + TR * Math.sin(th), GZ - TR + TR * Math.cos(th), th]; }
      return [GH + TR, GZ - TR - (t - GH - arc), Math.PI / 2];
    }
    function placeGarage(o) { const GH = d.GH, PH = GH / NP; gPanels.forEach((m, i) => { const [y, z, th] = track(i * PH + PH / 2 + o * GH, GH); m.position.set(d.gx + d.GW / 2, y, z); m.rotation.x = -th; }); }

    // ---------- car parked inside (centred on the garage door in build())
    const car = new THREE.Group();
    {
      const paint = M(0xb4bac0, { metalness: .75, roughness: .3 }), glass = M(0x1d2830, { metalness: .3, roughness: .08 }), tyre = M(0x1b1c1e, { roughness: .9 }), rim = M(0xcfd3d6, { metalness: .8, roughness: .25 });
      const ext = (pts, depth, mat, bev) => {
        const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => sh.lineTo(p[0], p[1]));
        const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: !!bev, bevelThickness: bev || 0, bevelSize: bev || 0, bevelSegments: 3, steps: 1 }); g.translate(0, 0, -depth / 2);
        const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; car.add(m); return m;
      };
      ext([[0.02, 0.32], [0, 0.6], [0.12, 0.74], [1.25, 0.88], [3.9, 0.96], [4.62, 0.94], [4.72, 0.7], [4.7, 0.36], [4.55, 0.3], [0.15, 0.3]], 1.72, paint, 0.05);
      ext([[1.28, 0.9], [2.05, 1.36], [3.28, 1.38], [4.05, 0.97]], 1.54, glass, 0.03);
      ext([[2.0, 1.37], [3.3, 1.39], [3.3, 1.43], [2.05, 1.42]], 1.5, paint, 0.02);
      ext([[2.6, 0.92], [2.7, 0.92], [2.7, 1.38], [2.6, 1.38]], 1.58, paint);
      [0.95, 3.72].forEach(u => [-0.8, 0.8].forEach(w => {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.23, 28), tyre); t.rotation.x = Math.PI / 2; t.position.set(u, 0.33, w); t.castShadow = true; car.add(t);
        const h = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.24, 20), rim); h.rotation.x = Math.PI / 2; h.position.set(u, 0.33, w); car.add(h);
      }));
      [-0.6, 0.6].forEach(w => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.34), M(0xe8eef2, { emissive: 0x777b80, roughness: .2 })); hl.position.set(0.08, 0.68, w); car.add(hl);
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.4), M(0xa5161b, { emissive: 0x3a0507, roughness: .3 })); tl.position.set(4.68, 0.84, w); car.add(tl);
      });
      car.rotation.y = Math.PI / 2; scene.add(car);
    }

    // ---------- concrete driveway texture (the slab itself follows the garage in build())
    const driveMat = (() => {
      const ct = tex(256, 256, (g, w, h) => {
        g.fillStyle = '#c7c6bf'; g.fillRect(0, 0, w, h); let s = 3; const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
        for (let i = 0; i < 1800; i++) { g.fillStyle = r() > .5 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.07)'; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
        g.fillStyle = 'rgba(60,60,55,.45)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
      }, 2, 2);
      return M(0xffffff, { map: ct, roughness: .95 });
    })();

    // ---------- everything that follows the dimensions (rebuilt on every change)
    let dyn = null;
    function build() {
      if (dyn) { scene.remove(dyn); dyn.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
      dyn = new THREE.Group(); scene.add(dyn); target = dyn;
      const { HH, HL, W, WL, D, GH, GW, gx, post, roofY } = d, T = FIX.T;

      B(-0.02, WL, 0.02, 0.05, -D, 0.02, floorMat, false); // concrete floor under the carport
      B(WL, 14, 0, 1.25, -0.3, 0, rBrick);                 // neighbour's low brick wall
      B(0, 0.1, HH - 0.15, HH, -D, 0, steel);              // wall ledger
      B(-0.02, 0.08, HH + T, HH + T + 0.12, -D - 0.1, 0.14, steel); // wall flashing

      d.rafterZ.forEach(z => slopeX(0, HH - 0.06, W, HL - 0.06, z - 0.03, z + 0.03, FIX.rafterH, steel));
      B(W - 0.1, W, HL - 0.14, HL - 0.02, -D, 0, steel); // side beam
      d.sideZ.forEach(z => B(W - 0.1, W, 0.05, HL - 0.14, z - 0.05, z + 0.05, steel));
      d.sideZ.forEach(z => B(W - 0.14, W + 0.04, 0.05, 0.07, z - 0.09, z + 0.09, steel)); // base plates
      B(post.x0, post.x1, 0.05, roofY(post.x1) - FIX.rafterH, -0.1, 0, steel); // front post (garage jamb)
      B(0, post.x1, 0.02, 0.08, 0.03, FIX.drivewayLen + 0.05, driveMat, false); // driveway
      car.position.set(gx + GW / 2, 0.05, -0.6);

      const x0 = -0.02, x1 = W + FIX.overhang;
      Object.values(roofMats).forEach(m => { m.map.repeat.set(1, (D + 0.25) / m.map.userData.px); });
      roof = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(x1 - x0, roofY(x0) - roofY(x1)), T, D + 0.25), roofMats[roofKind]);
      roof.position.set((x0 + x1) / 2, (roofY(x0) + roofY(x1)) / 2 + T / 2, -D / 2 + 0.02);
      roof.rotation.z = -Math.atan2(HH - HL, W); roof.castShadow = roofKind !== 'poly'; roof.receiveShadow = true; dyn.add(roof);
      // gutter falls towards the street and drains through a downpipe on the front, away from the yard
      const gz0 = -D - 0.1, gz1 = 0.14, gy = roofY(x1) - 0.02;
      const gut = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, gz1 - gz0, 16, 1, true, 0, Math.PI), gutMat);
      gut.rotation.x = Math.PI / 2; gut.rotation.y = Math.PI; gut.position.set(x1 + 0.04, gy, (gz0 + gz1) / 2); dyn.add(gut);
      const dpz = 0.13, dph = gy - 0.2;
      const dp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, dph, 12), gutMat); dp.position.set(x1 + 0.04, 0.2 + dph / 2, dpz); dp.castShadow = true; dyn.add(dp);
      const shoe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12), gutMat); shoe.rotation.x = Math.PI / 2 - 0.5; shoe.position.set(x1 + 0.04, 0.14, dpz + 0.12); dyn.add(shoe);

      // front sheet: above the doors and the whole fence (same outline as the elevation drawing)
      const sh = new THREE.Shape();
      d.front.forEach(([x, y], i) => {
        const yy = (x === 0 && y === HH) || (x >= W && Math.abs(y - roofY(W)) < 1e-9) ? y + T : Math.max(y, 0.05);
        if (i === 0) sh.moveTo(x, yy); else sh.lineTo(x, yy);
      });
      const fm = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }), fasciaMat); fm.position.z = 0.02; fm.castShadow = fm.receiveShadow = true; dyn.add(fm);

      B(FIX.pillar.x0, FIX.pillar.x1, 0.05, GH, -0.22, 0.02, pillarMat); // pillar as tall as the garage door
      gPanels.forEach(m => { m.geometry.dispose(); m.geometry = new THREE.PlaneGeometry(GW, GH / NP); });
      [gx - 0.03, gx + GW + 0.01].forEach(x => { B(x, x + 0.02, 0.05, GH, GZ - 0.05, GZ - 0.02, steel, false); B(x, x + 0.02, GH + TR, GH + TR + 0.02, GZ - 2.2, GZ - 0.02, steel, false); });
      target = null;
    }

    // ---------- views
    const views = () => ({
      street: [[1.0, 1.7, 13], [2.9, 2.1, 0]],
      angle: [[-4.5, 3.4, 9], [2.8, 1.8, -3.5]],
      yard: [[3.2, 1.9, -d.D - 7.2], [2.6, 1.8, -3]],
      top: [[13, 13, 9], [2.8, 1, -d.D / 2]],
      inside: [[4.5, 1.75, -d.D + 0.4], [2.2, 1.0, -1.2]]
    });
    let anim = null;
    function go(name, instant) {
      const [p, t] = views()[name]; const from = { p: camera.position.clone(), t: controls.target.clone() };
      if (instant || reduce) { camera.position.set(...p); controls.target.set(...t); anim = null; return; }
      anim = { from, p: new THREE.Vector3(...p), t: new THREE.Vector3(...t), s: performance.now() };
    }

    // ---------- doors
    const doors = { garage: { cur: 0, tgt: 0, speed: 1 / 3.2 }, entry: { cur: 0, tgt: 0, speed: 1 / 1.1 } };
    const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

    function resize() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px'; camera.aspect = w / h; camera.updateProjectionMatrix(); }
    new ResizeObserver(resize).observe(stage); resize();

    let last = performance.now(), started = false;
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      for (const k in doors) { const st = doors[k]; if (st.cur !== st.tgt) { const s = st.speed * dt; st.cur = st.tgt > st.cur ? Math.min(st.tgt, st.cur + s) : Math.max(st.tgt, st.cur - s); } }
      placeGarage(ease(doors.garage.cur)); doorPivot.rotation.y = -1.5 * ease(doors.entry.cur); // hinge on the right, swings into the yard
      if (anim) {
        const k = ease(Math.min(1, (now - anim.s) / 900));
        camera.position.lerpVectors(anim.from.p, anim.p, k); controls.target.lerpVectors(anim.from.t, anim.t, k); if (k >= 1) anim = null;
      }
      controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop);
    }

    const fasciaAnth = fasciaMat.map; let fasciaWood = null;
    return {
      update(next) {
        d = next; build();
        if (!started) { started = true; go('street', true); requestAnimationFrame(loop); }
      },
      go,
      setRoof(v) { roofKind = v; roof.material = roofMats[v]; roof.castShadow = v !== 'poly'; },
      setGarage(v) { garageBase.dispose(); garageBase = garageTex(v); mapPanels(); },
      setFence(v) {
        if (v === 'wood') { fasciaWood = fasciaWood || woodSeamTex(); fasciaMat.map = fasciaWood; fasciaMat.metalness = 0; fasciaMat.roughness = .8; }
        else { fasciaMat.map = fasciaAnth; fasciaMat.metalness = .3; fasciaMat.roughness = .5; }
        fasciaMat.needsUpdate = true;
      },
      toggleDoor(key) { const st = doors[key]; st.tgt = st.tgt ? 0 : 1; if (reduce) st.cur = st.tgt; return !!st.tgt; }
    };
  };
})(window.N7);
