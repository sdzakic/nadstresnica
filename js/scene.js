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
    controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 3; controls.maxDistance = 60;

    scene.add(new THREE.HemisphereLight(0xeef3f7, 0x7a7466, 0.75));
    const sun = new THREE.DirectionalLight(0xfff4e2, 0.95);
    sun.position.set(11, 18, 6); sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 70 });
    sun.shadow.mapSize.set(4096, 4096);
    sun.target.position.set(2, 0, -10); scene.add(sun.target);
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    // ---------- helpers
    function tex(w, h, draw, rx, ry) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); t.anisotropy = 8; return t; }
    const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .8, metalness: 0 }, o || {}));
    // steel members remember which assembly they belong to (roof, front, side) for the STL export
    let curPart = '';
    function B(x0, x1, y0, y1, z0, z1, mat, cast) { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = cast !== false; m.receiveShadow = true; m.userData.part = curPart; (target || scene).add(m); return m; }
    function slopeX(xa, ya, xb, yb, z0, z1, h, mat) { const L = Math.hypot(xb - xa, yb - ya); const m = new THREE.Mesh(new THREE.BoxGeometry(L, h, z1 - z0), mat); m.position.set((xa + xb) / 2, (ya + yb) / 2, (z0 + z1) / 2); m.rotation.z = Math.atan2(yb - ya, xb - xa); m.castShadow = m.receiveShadow = true; m.userData.part = curPart; (target || scene).add(m); return m; }
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
    const roadZ = FIX.drivewayLen;
    B(-30, 30, 0, 0.04, 1.6, roadZ, M(0x6f8a4b), false); // grass
    B(-30, 30, 0, 0.03, roadZ, roadZ + 7, M(0x4b4e52, { roughness: .95 }), false); // road
    B(-30, 30, 0.031, 0.032, roadZ + 3.4, roadZ + 3.5, M(0xe8e8e2), false); // centre line

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

    // ---------- neighbour house: two storeys, gable end facing the carport, ridge parallel to the street.
    // Its wall stands right behind the grey panel fence on the boundary, so it is rebuilt with the width (WL).
    const NB = {
      wall: M(0xefeeea, { roughness: .9 }),
      tiles: M(0x4d4744, { roughness: .85 }),
      board: M(0xf4f4f1, { roughness: .6 }),
      gutter: M(0xdcdcd8, { metalness: .3, roughness: .5 }),
      pipe: M(0xd9c9a3, { roughness: .6 }),
      frame: M(0xf6f6f3, { roughness: .4 }),
      glass: M(0x3a3230, { roughness: .2 }),
      fence: M(0x3b4045, { roughness: .6, metalness: .3 }),
      oldTiles: M(0x5a3b2c, { roughness: .95 }),
      oldBrick: M(0xffffff, {
        roughness: 1,
        map: tex(256, 128, (g, w, h) => {
          g.fillStyle = '#9c8f7c'; g.fillRect(0, 0, w, h); let s = 17; const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
          const cols = ['#8a4f33', '#7d4730', '#9a5c3e', '#b39473'];
          for (let row = 0; row < 16; row++) for (let x = (row % 2) * -16; x < w; x += 32) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x + 1, row * 8 + 1, 30, 6); }
        }, 8, 4)
      }),
      stone: M(0xffffff, {
        roughness: .95,
        map: tex(256, 64, (g, W_, H_) => {
          g.fillStyle = '#6f7478'; g.fillRect(0, 0, W_, H_); let s = 11; const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
          for (let row = 0; row < 4; row++) for (let x = -r() * 40; x < W_; ) {
            const w2 = 28 + r() * 46, y = row * 16;
            g.fillStyle = `hsl(210,4%,${36 + r() * 16}%)`; g.fillRect(x + 1, y + 1, w2 - 2, 14); x += w2;
          }
        }, 6, 1)
      })
    };
    function buildNeighbour(WL) {
      const add = m => { m.castShadow = m.receiveShadow = true; (target || scene).add(m); return m; };
      const fenceT = 0.03, x0 = WL + fenceT, x1 = x0 + 7.6, z0 = -13, z1 = -2.6, He = 6.0, rise = 2.7;
      const zc = (z0 + z1) / 2, half = (z1 - z0) / 2, a = Math.atan2(rise, half);
      B(x0, x1, 0, He, z0, z1, NB.wall);
      const gs = new THREE.Shape(); gs.moveTo(z0, He); gs.lineTo(z1, He); gs.lineTo(zc, He + rise); gs.lineTo(z0, He);
      const gm = add(new THREE.Mesh(new THREE.ExtrudeGeometry(gs, { depth: x1 - x0, bevelEnabled: false }), NB.wall));
      gm.rotation.y = -Math.PI / 2; gm.position.x = x1;
      // roof: dark tiles, 35 cm over the gables, 50 cm over the eaves, white boards along the gable edges
      const ov = 0.35, L = Math.hypot(half, rise) + 0.5, t = 0.18, w = x1 - x0 + 2 * ov;
      [1, -1].forEach(side => {
        const dir = new THREE.Vector3(0, -Math.sin(a), side * Math.cos(a));
        const nrm = new THREE.Vector3(0, Math.cos(a), side * Math.sin(a));
        const c = new THREE.Vector3((x0 + x1) / 2, He + rise, zc).addScaledVector(dir, L / 2).addScaledVector(nrm, t / 2 + 0.02);
        const r = add(new THREE.Mesh(new THREE.BoxGeometry(w, t, L), NB.tiles)); r.position.copy(c); r.rotation.x = side * a;
        [x0 - ov + 0.02, x1 + ov - 0.02].forEach(bx => {
          const b = add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, L), NB.board)); b.position.set(bx, c.y - 0.08, c.z); b.rotation.x = side * a;
        });
        const g = add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, w, 12), NB.gutter));
        g.rotation.z = Math.PI / 2; g.position.set((x0 + x1) / 2, He + rise - L * Math.sin(a) - 0.05, zc + side * (half + 0.5));
      });
      B(x0 - 0.03, x1 + 0.03, 0, 0.85, z0 - 0.03, z1 + 0.03, NB.stone);           // grey stone-look plinth
      B(x0 - 0.05, x0 - 0.02, 3.05, 3.09, z0 + 0.4, z1 - 0.2, NB.pipe);            // gas pipe on the side wall
      [[0.5, NB.frame, 0.012], [0.36, NB.glass, 0.014]].forEach(([sz, mat, off]) => {
        const m = add(new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), mat)); m.position.set(x0 - off, 3.5, -7.6); m.rotation.y = -Math.PI / 2;
      });
      B(WL, x0, 0, 2.0, z1, -0.3, NB.fence);   // dark grey panel fence on the boundary, from the house front to the street wall
      // neighbour's old brick building behind his house, its yard wall flush with the house
      if (N7._yardShed) N7._yardShed(x0, x0 + 5.5, z0 - 11, z0 + 0.2, 2.9, 5.3, NB.oldBrick, NB.oldTiles);
    }
    const rBrick = M(0x9a5a44, { roughness: 1 });

    // ---------- rest of the yard (IMG_2908–2913): old buildings behind the house and the neighbour's old brick building.
    // Positions are estimated from the photos; the one measured value is 10 m between the neighbour's building and the barn.
    {
      const plaster = M(0xd9bf9c, { roughness: .95 }), oldTiles = M(0x4e3427, { roughness: .95 });
      const brickTex = (base, mortar, k) => tex(256, 128, (g, w, h) => {
        g.fillStyle = mortar; g.fillRect(0, 0, w, h); let s = 17; const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
        for (let row = 0; row < 16; row++) for (let x = (row % 2) * -16; x < w; x += 32) {
          g.fillStyle = base[Math.floor(r() * base.length)]; g.fillRect(x + 1, row * 8 + 1, 30, 6);
        }
      }, k, k / 2);
      const yellowBrick = M(0xffffff, { roughness: 1, map: brickTex(['#d7b16a', '#cfa75f', '#dcb877'], '#b9a58a', 2) });
      const boards = M(0xffffff, { roughness: 1, map: tex(256, 256, (g, w, h) => { grain(g, w, h, '#8a7664', '#3d3228', 'v'); g.fillStyle = 'rgba(30,22,15,.6)'; for (let x = 0; x < w; x += 18 + (x % 7)) g.fillRect(x, 0, 2, h); }, 3, 1) });
      const brownDoor = M(0x7a5a48, { roughness: .9 }), glass = M(0x2e3a40, { roughness: .2 }), frameW = M(0xf1f1ee, { roughness: .5 });

      // gable building with the ridge along z; eave on both long sides at `eave`
      function shed(x0, x1, z0, z1, eave, ridge, wallMat, roofMat, gableMat) {
        B(x0, x1, 0, eave, z0, z1, wallMat);
        const xc = (x0 + x1) / 2, half = (x1 - x0) / 2, rise = ridge - eave, a = Math.atan2(rise, half);
        const gs = new THREE.Shape(); gs.moveTo(x0, eave); gs.lineTo(x1, eave); gs.lineTo(xc, ridge); gs.lineTo(x0, eave);
        const gm = new THREE.Mesh(new THREE.ExtrudeGeometry(gs, { depth: z1 - z0, bevelEnabled: false }), gableMat || wallMat);
        gm.position.z = z0; gm.castShadow = gm.receiveShadow = true; (target || scene).add(gm);
        const L = Math.hypot(half, rise) + 0.35, t = 0.16;
        [1, -1].forEach(side => {
          const dir = new THREE.Vector3(side * Math.cos(a), -Math.sin(a), 0), nrm = new THREE.Vector3(side * Math.sin(a), Math.cos(a), 0);
          const c = new THREE.Vector3(xc, ridge, (z0 + z1) / 2).addScaledVector(dir, L / 2).addScaledVector(nrm, t / 2 + 0.02);
          const r = new THREE.Mesh(new THREE.BoxGeometry(L, t, z1 - z0 + 0.5), roofMat);
          r.position.copy(c); r.rotation.z = -side * a; r.castShadow = r.receiveShadow = true; (target || scene).add(r);
        });
      }
      const H0 = -FIX.houseLen; // back wall of the green house
      // the old buildings behind the house are set back: their yard wall is exactly 10 m from the neighbour's
      // old building, which stands flush with the neighbour's house (measured width 5,41 m to that wall)
      const XW = N7.MEASURED.WL + 0.03 - 10;
      // the old part is narrower than the house: from the far side of the house (x = -8) to just past its middle
      const XF = -8;
      // old ground-floor house right behind the green house, yellow-brick part next to it
      shed(XF, XW, H0 - 5.6, H0, 2.7, 4.3, plaster, oldTiles);
      B(XW - 0.02, XW, 0, 2.7, H0 - 1.6, H0, yellowBrick);
      plane(0.7, 0.9, frameW, XW + 0.01, 1.5, H0 - 0.9, Math.PI / 2); plane(0.56, 0.76, glass, XW + 0.015, 1.5, H0 - 0.9, Math.PI / 2);
      plane(1.4, 1.2, frameW, XW + 0.01, 1.35, H0 - 3.4, Math.PI / 2); plane(1.26, 1.06, glass, XW + 0.015, 1.35, H0 - 3.4, Math.PI / 2);
      plane(0.9, 2.1, glass, XW + 0.01, 1.05, H0 - 4.6, Math.PI / 2);
      // storage building with the brown wooden door
      shed(XF, XW, H0 - 11.2, H0 - 5.6, 2.8, 4.4, plaster, oldTiles);
      B(XW, XW + 0.02, 0.05, 2.05, H0 - 8.6, H0 - 7.4, brownDoor);
      // old barn at the back: plaster walls, wooden gable towards the back of the yard
      shed(XF, XW, H0 - 16.2, H0 - 11.2, 2.9, 4.6, plaster, oldTiles, boards);
      // existing small terrace roof on thin red posts, in the middle of the old buildings (not next to the house)
      const tz0 = H0 - 10.6, tz1 = H0 - 5.6;
      B(XW, XW + 2.9, 0.02, 0.1, tz0 + 0.2, tz1 - 0.2, M(0xbdbab2, { roughness: .95 }), false);
      slopeX(XW, 2.55, XW + 2.7, 2.3, tz0 + 0.4, tz1 - 0.4, 0.04, M(0xa4aaad, { metalness: .5, roughness: .45 }));
      [tz1 - 0.6, (tz0 + tz1) / 2, tz0 + 0.6].forEach(z => B(XW + 2.55, XW + 2.61, 0.1, 2.3, z - 0.03, z + 0.03, M(0xb23a2e, { roughness: .6 })));
      // concrete path along the old buildings
      B(XW, XW + 1.5, 0.02, 0.07, H0 - 16, H0 - 5.4, M(0xbdbab2, { roughness: .95 }), false);
      N7._yardShed = shed;
    }

    // ---------- materials of the carport
    const steel = M(0x363b3f, { metalness: .55, roughness: .45 });      // load-bearing steel only ("samo čelik" view)
    const trim = M(0x363b3f, { metalness: .55, roughness: .45 });
    const bracketMat = M(0x7b2f2a, { metalness: .4, roughness: .55 });  // existing wall brackets, painted red-brown       // flashing, door rails: same look, not structure
    const floorMat = M(0xbdbcb5, { roughness: .95 });
    function ribTex(base, rib, px) { const t = tex(8, 64, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = rib; g.fillRect(0, h * .42, w, h * .16); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, h * .4, w, h * .03); }); t.userData = { px }; return t; }
    const roofMats = {
      sandwich: M(0xffffff, { map: ribTex('#3b4146', '#2c3134', 0.33), roughness: .55, metalness: .25 }),
      trap: M(0xffffff, { map: ribTex('#7d8286', '#5f6468', 0.2), roughness: .4, metalness: .6 }),
      sandwich30: M(0xffffff, { map: ribTex('#40464b', '#2f3437', 0.33), roughness: .55, metalness: .25 })
    };
    let roofKind = 'sandwich', roof = null;
    const gutMat = M(0x3a3f43, { metalness: .5, roughness: .4, side: THREE.DoubleSide });
    function seamTex(base, seam) { return tex(128, 32, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = seam; for (let i = 0; i < 4; i++) g.fillRect(i * 32, 0, 3, h); g.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 4; i++) g.fillRect(i * 32 + 3, 0, 1, h); }); }
    function woodSeamTex() { return tex(256, 256, (g, w, h) => { grain(g, w, h, '#9a6a3e', '#4d2e17', 'v'); g.fillStyle = 'rgba(40,22,10,.55)'; for (let i = 0; i < 2; i++) g.fillRect(i * 128, 0, 3, h); }, 0.5, 0.5); }
    const fasciaMat = M(0xffffff, { map: seamTex('#3b4146', '#2b3033'), roughness: .5, metalness: .3 });

    // ---------- entrance door (hinged on the right, opens inwards)
    const doorTex = kind => tex(200, 420, (g, w, h) => {
      const base = N7.COLORS.door[kind][1];
      if (kind === 'wood') grain(g, w, h, base, '#4d2e17', 'v'); else { g.fillStyle = base; g.fillRect(0, 0, w, h); }
      const light = kind === 'white' || kind === 'house';
      g.strokeStyle = light ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.35)'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
      g.fillStyle = '#9aabb3'; g.fillRect(w * .62, h * .08, w * .1, h * .84); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(w * .62, h * .08, w * .02, h * .84);
      g.fillStyle = '#c9ccce'; g.fillRect(w * .13, h * .3, w * .035, h * .4); g.fillStyle = light ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.35)'; for (let i = 1; i < 4; i++) g.fillRect(w * .22, h * i / 4, w * .34, 2);
    });
    const dw = FIX.door.x1 - FIX.door.x0, dh = FIX.door.h;
    const doorMat = M(0xffffff, { map: doorTex('anth'), roughness: .5, metalness: .2, side: THREE.DoubleSide });
    const doorPivot = new THREE.Group(); doorPivot.position.set(FIX.door.x1, 0, -0.05); scene.add(doorPivot);
    {
      // the texture has its handle on the left, away from the hinge
      var doorMesh = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh), doorMat);
      doorMesh.position.set(-dw / 2, dh / 2 + 0.05, 0); doorMesh.castShadow = true; doorPivot.add(doorMesh);
    }

    // ---------- intercom + house number (mounted on the sheet in build())
    const intercomMat = M(0x2a2e31, { metalness: .4, roughness: .4 });
    const screenMat = M(0x7fa0b3, { roughness: .2, emissive: 0x1b2a33 });
    const numberMat = M(0xffffff, {
      roughness: .5,
      map: tex(128, 128, (g, w, h) => { g.fillStyle = '#2c4f9e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#fff'; g.font = 'bold 84px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('7', w / 2, h / 2 + 4); })
    });

    // ---------- sectional garage door
    function garageTex(kind) {
      return tex(512, 382, (g, w, h) => {
        const base = N7.COLORS.garage[kind][1];
        if (kind === 'wood') grain(g, w, h, base, '#4d2e17', 'h'); else { g.fillStyle = base; g.fillRect(0, 0, w, h); }
        const sec = 5;
        for (let i = 0; i < sec; i++) {
          const y = i * h / sec;
          const light = kind === 'white' || kind === 'silver' || kind === 'house';
          g.fillStyle = light ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.45)'; g.fillRect(0, y, w, 3);
          g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, y + 3, w, 1.5);
          if (kind !== 'wood') { g.fillStyle = light ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.04)'; for (let k = 8; k < h / sec; k += 8) g.fillRect(0, y + k, w, 1); }
        }
        g.fillStyle = kind === 'white' || kind === 'silver' || kind === 'house' ? '#8a8f92' : '#222'; g.fillRect(w * .47, h * .9, w * .06, h * .02);
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
      B(WL, WL + 8, 0, 1.25, -0.3, 0, rBrick);             // neighbour's low brick street wall, starts at the grey fence
      buildNeighbour(WL);
      curPart = 'roof';
      // existing wall brackets (tube through the insulation + end plate) and the wall beam bolted to them
      const bk = FIX.bracket;
      d.brZ.forEach(u => {
        B(0, d.wallX0 - bk.plateT, HH - (bk.plateH + bk.tubeH) / 2, HH - (bk.plateH - bk.tubeH) / 2, -u - bk.tubeW / 2, -u + bk.tubeW / 2, bracketMat);
        B(d.wallX0 - bk.plateT, d.wallX0, HH - bk.plateH, HH, -u - bk.plateW / 2, -u + bk.plateW / 2, bracketMat);
      });
      B(d.wallX0, d.wallX1, HH - 0.15, HH, -D, 0, steel);  // wall beam 150 × 100
      if (d.st.braces) { // knee brace under each bracket, from the bottom of the wall beam into the wall 45 cm lower
        const k = d.st.braces, kb = k.s.b / 1000, xm = (d.wallX0 + d.wallX1) / 2;
        d.brZ.forEach(u => { if (u <= D) slopeX(xm, HH - 0.15, -bk.eps, HH - 0.15 - k.drop, -u - kb / 2, -u + kb / 2, kb, steel); });
      }
      if (d.st.wallPosts) d.wallPostZ.forEach(u => { // posts under the wall beam
        B(d.wallX0, d.wallX1, 0.05, HH - 0.15, -u - 0.05, -u + 0.05, steel);
        B(d.wallX0 - 0.04, d.wallX1 + 0.04, 0.05, 0.07, -u - 0.09, -u + 0.09, steel);
      });
      B(-0.02, 0.08, HH + T, HH + T + 0.12, -D - 0.1, 0.14, trim); // wall flashing

      const tr = d.st.rafter.s.truss;
      if (tr) {
        // lattice rafters: sloping top chord, level bottom tube, zig-zag web; one longitudinal tie at mid-span
        const th = tr.top.h / 1000, tb = tr.top.b / 1000, tv = th * Math.hypot(W, HH - HL) / W, bh = tr.bot.h / 1000, bb = tr.bot.b / 1000, ww = tr.web.b / 1000, rt = d.rt;
        d.rafterZ.forEach(z => {
          slopeX(0, HH - tv / 2, W, HL - tv / 2, z - tb / 2, z + tb / 2, th, steel);
          B(d.wallX1, W - 0.1, rt.yB, rt.botTop, z - bb / 2, z + bb / 2, steel);
          rt.web.forEach(([xa, ya, xb, yb]) => slopeX(xa, ya, xb, yb, z - ww / 2, z + ww / 2, ww, steel));
        });
        B(W / 2 - bb / 2, W / 2 + bb / 2, rt.yB, rt.botTop, d.rafterZ[d.rafterZ.length - 1], d.rafterZ[0], steel);
      } else {
        const rh = d.rafterH, rw = d.st.rafter.s.b / 1000;
        const xa = d.wallX1, ya = d.roofY(xa);
        d.rafterZ.forEach(z => slopeX(xa, ya - rh / 2, W, HL - rh / 2, z - rw / 2, z + rw / 2, rh, steel));
      }
      // purlins across the rafters, flush with their top, at the spacing the roof panel needs
      if (d.st.purlin) {
        const ph = d.st.purlin.s.h / 1000, pb = d.st.purlin.s.b / 1000;
        for (let k = 1; k <= d.st.nPurlins; k++) { const x = k * W / d.st.nSpans; B(x - pb / 2, x + pb / 2, roofY(x) - ph, roofY(x), -D, 0, steel); }
      }
      curPart = 'side';
      const bt = d.st.beam.s.truss;
      if (bt) {
        // lattice side beam ("zmija") over the whole length, on the two corner posts
        const ch = bt.chord.h / 1000, cb = bt.chord.b / 1000, h = bt.h / 1000, r = bt.bar.d / 2000, xc = W - 0.05, yt = HL - 0.02;
        B(xc - cb / 2, xc + cb / 2, yt - ch, yt, -D, 0, steel);
        B(xc - cb / 2, xc + cb / 2, yt - h, yt - h + ch, -D, 0, steel);
        const he = h - ch, n = Math.max(2, Math.round(D / he));
        for (let k = 0; k < n; k++) {
          const za = -k * D / n, zb = -(k + 1) * D / n, ya = k % 2 ? yt - ch / 2 : yt - h + ch / 2, yb = k % 2 ? yt - h + ch / 2 : yt - ch / 2;
          const len = Math.hypot(zb - za, yb - ya), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), steel);
          m.position.set(xc, (ya + yb) / 2, (za + zb) / 2); m.rotation.x = Math.atan2(zb - za, yb - ya); m.castShadow = true; m.userData.part = 'side'; dyn.add(m);
        }
      } else B(W - 0.1, W, HL - 0.14, HL - 0.02, -D, 0, steel); // side beam
      d.sideZ.forEach(z => B(W - 0.1, W, 0.05, HL - 0.02 - d.beamDepth, z - 0.05, z + 0.05, steel));
      d.sideZ.forEach(z => B(W - 0.14, W + 0.04, 0.05, 0.07, z - 0.09, z + 0.09, steel)); // base plates
      // posts on the pročelje up to the front rafter, plus lintels over the two openings
      curPart = 'front';
      d.frontPosts.forEach(q => { B(q.x0, q.x1, 0.05, q.h, -0.1, 0, steel); B(q.x0 - 0.04, q.x1 + 0.04, 0.05, 0.07, -0.14, 0.04, steel); });
      B(FIX.door.x0 - FIX.postW, FIX.door.x1 + FIX.postW, d.doorH, d.doorH + 0.08, -0.1, 0, steel);
      doorMesh.geometry.dispose(); doorMesh.geometry = new THREE.PlaneGeometry(dw, d.doorH); doorMesh.position.y = d.doorH / 2 + 0.05;
      B(gx - FIX.postW, post.x1, GH, GH + 0.08, -0.1, 0, steel);
      curPart = '';
      B(0, post.x1, 0.02, 0.08, 0.03, FIX.drivewayLen + 0.05, driveMat, false); // driveway
      car.position.set(gx + GW / 2, 0.05, -0.6);

      const x0 = -0.02, x1 = W + FIX.overhang;
      Object.values(roofMats).forEach(m => { m.map.repeat.set(1, (D + 0.25) / m.map.userData.px); });
      // with the flat-look parapet the roof stops behind the front sheet (no front overhang, no front flashing)
      const zFront = d.parapet ? 0 : 0.145, zBack = -D - 0.105;
      roof = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(x1 - x0, roofY(x0) - roofY(x1)), T, zFront - zBack), roofMats[roofKind]);
      roof.position.set((x0 + x1) / 2, (roofY(x0) + roofY(x1)) / 2 + T / 2, (zFront + zBack) / 2);
      roof.rotation.z = -Math.atan2(HH - HL, W); roof.castShadow = true; roof.receiveShadow = true; dyn.add(roof);
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
        const yy = Math.abs(y - HH) < 1e-9 || (x >= W && Math.abs(y - roofY(W)) < 1e-9) ? y + T : Math.max(y, 0.05);
        if (i === 0) sh.moveTo(x, yy); else sh.lineTo(x, yy);
      });
      const fm = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }), fasciaMat); fm.position.z = 0.02; fm.castShadow = fm.receiveShadow = true; dyn.add(fm);

      { // intercom and house number on the sheet between the door post and the garage post
        const ic = d.intercomX;
        B(ic - 0.075, ic + 0.075, 1.3, 1.52, 0.05, 0.08, intercomMat);
        B(ic - 0.045, ic + 0.045, 1.42, 1.49, 0.08, 0.082, screenMat);
        const n = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), numberMat); n.position.set(ic, 1.75, 0.055); dyn.add(n);
      }
      gPanels.forEach(m => { m.geometry.dispose(); m.geometry = new THREE.PlaneGeometry(GW, GH / NP); });
      [gx - 0.03, gx + GW + 0.01].forEach(x => { B(x, x + 0.02, 0.05, GH, GZ - 0.05, GZ - 0.02, trim, false); B(x, x + 0.02, GH + TR, GH + TR + 0.02, GZ - 2.2, GZ - 0.02, trim, false); });
      target = null;
      applyFrameOnly();
    }

    // "samo čelik": hide everything except the load-bearing steel and the ground it stands on
    let frameOnly = false;
    function applyFrameOnly() {
      scene.traverse(o => { if (o.isMesh) o.visible = !frameOnly || o.material === steel || o.material === bracketMat || o === gnd; });
    }

    // ---------- STL export of the load-bearing steel for a 3D print
    // scale 1:N, every member at least minMm thick at print size, part: all | roof | front | side.
    // The model is y-up in metres; the STL is z-up in millimetres, standing on the base plates.
    function exportSTL({ scale = 50, minMm = 1.2, part = 'all', dry = false } = {}) {
      if (!dyn) return null;
      const k = 1000 / scale, minM = minMm / k;
      const pts = []; let members = 0;
      dyn.updateMatrixWorld(true);
      dyn.traverse(o => {
        if (!o.isMesh || o.material !== steel) return;
        if (part !== 'all' && o.userData.part !== part) return;
        const p = o.geometry.parameters; let g;
        if (o.geometry.type === 'BoxGeometry') g = new THREE.BoxGeometry(Math.max(p.width, minM), Math.max(p.height, minM), Math.max(p.depth, minM));
        else if (o.geometry.type === 'CylinderGeometry') { const r = Math.max(p.radiusTop, minM / 2); g = new THREE.CylinderGeometry(r, r, p.height, 8); }
        else g = o.geometry.clone();
        if (g.index) g = g.toNonIndexed();
        g.applyMatrix4(o.matrixWorld);
        const a = g.attributes.position.array;
        for (let i = 0; i < a.length; i += 3) pts.push(a[i] * k, -a[i + 2] * k, a[i + 1] * k);
        g.dispose(); members++;
      });
      const n = pts.length / 9;
      const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < pts.length; i += 3) for (let c = 0; c < 3; c++) { lo[c] = Math.min(lo[c], pts[i + c]); hi[c] = Math.max(hi[c], pts[i + c]); }
      const size = members ? [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]] : [0, 0, 0];
      if (dry || !members) return { members, triangles: n, size, blob: null };
      const buf = new ArrayBuffer(84 + n * 50), dv = new DataView(buf);
      new Uint8Array(buf, 0, 80).set(new TextEncoder().encode('Nadstresnica br. 7 - celik 1:' + scale).subarray(0, 80));
      dv.setUint32(80, n, true);
      let off = 84;
      for (let i = 0; i < pts.length; i += 9) {
        const ax = pts[i] - lo[0], ay = pts[i + 1] - lo[1], az = pts[i + 2] - lo[2];
        const bx = pts[i + 3] - lo[0], by = pts[i + 4] - lo[1], bz = pts[i + 5] - lo[2];
        const cx = pts[i + 6] - lo[0], cy = pts[i + 7] - lo[1], cz = pts[i + 8] - lo[2];
        const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        [nx, ny, nz, ax, ay, az, bx, by, bz, cx, cy, cz].forEach((v, j) => dv.setFloat32(off + j * 4, v, true));
        dv.setUint16(off + 48, 0, true); off += 50;
      }
      return { members, triangles: n, size, blob: new Blob([buf], { type: 'model/stl' }) };
    }

    // ---------- views
    const views = () => ({
      street: [[1.0, 1.7, 13], [2.9, 2.1, 0]],
      angle: [[-4.5, 3.4, 9], [2.8, 1.8, -3.5]],
      yard: [[5.0, 3.0, -FIX.houseLen - 22.2], [2.6, 1.8, -10]],
      top: [[-3, 26, 12], [3, 0, -11]],
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

    const fasciaAnth = fasciaMat.map; let fasciaWood = null, fasciaHouse = null;
    return {
      update(next) {
        d = next; build();
        if (!started) { started = true; go('street', true); requestAnimationFrame(loop); }
      },
      go,
      setRoof(v) { roofKind = v; roof.material = roofMats[v]; },
      setGarage(v) { garageBase.dispose(); garageBase = garageTex(v); mapPanels(); },
      setFence(v) {
        if (v === 'wood') { fasciaWood = fasciaWood || woodSeamTex(); fasciaMat.map = fasciaWood; fasciaMat.metalness = 0; fasciaMat.roughness = .8; }
        else if (v === 'house') { fasciaHouse = fasciaHouse || seamTex('#a9b6a2', '#8e9a88'); fasciaMat.map = fasciaHouse; fasciaMat.metalness = .15; fasciaMat.roughness = .7; }
        else { fasciaMat.map = fasciaAnth; fasciaMat.metalness = .3; fasciaMat.roughness = .5; }
        fasciaMat.needsUpdate = true;
      },
      setDoor(v) { doorMat.map.dispose(); doorMat.map = doorTex(v); doorMat.needsUpdate = true; },
      setFrameOnly(v) { frameOnly = v; applyFrameOnly(); },
      exportSTL,
      toggleDoor(key) { const st = doors[key]; st.tgt = st.tgt ? 0 : 1; if (reduce) st.cur = st.tgt; return !!st.tgt; }
    };
  };
})(window.N7);
