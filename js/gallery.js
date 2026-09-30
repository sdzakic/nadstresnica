// Photo gallery with a lightbox; the list mirrors the images in galerija/.
window.N7 = window.N7 || {};
(function (N7) {
  const ITEMS = [
    ['fotomontaza', 'Fotomontaža, niža varijanta krova (prvi raspored)'],
    ['fotomontaza-najvisa', 'Fotomontaža, najviša varijanta krova'],
    ['prije-poslije', 'Prije i poslije'],
    ['ideja', 'Idejna skica s bojama'],
    ['img_2794', 'Pogled s ulice'],
    ['img_2795', 'Kuća i kapija ukoso'],
    ['img_2796', 'Pogled s pločnika od susjeda'],
    ['img_2792', 'Bočni zid kuće s ulazom'],
    ['img_2793', 'Prolaz iz dvorišta prema ulici'],
    ['img_2797', 'Mjerenje: 7,8 m duž zida'],
    ['img_2905', 'Mjerenje: 3,18 m do postojećih nosača'],
    ['img_2904', 'Nosač na zidu, visok 14 cm'],
    ['img_2906', 'Mjerenje: 5,41 m od kuće do susjedovog sokla'],
    ['img_2798', 'Starije mjerenje visine (3,25 m)'],
    ['img_2799', 'Mjerenje: 5,52 m uz ulicu, do kraja žutog zida'],
    ['img_2902', 'Prolaz prema ulici, susjedov sivi sokl i ograda'],
    ['img_2903', 'Zabat susjedove kuće'],
    ['img_2842', 'Inspiracija: nadstrešnica u susjedstvu'],
    ['img_2843', 'Inspiracija: nadstrešnica i klizna kapija'],
    ['primjer-3', 'Inspiracija: nadstrešnica između dviju kuća']
  ];

  N7.initGallery = function (grid, lb) {
    grid.innerHTML = ITEMS.map(([n, c], i) =>
      `<figure><button class="thumb" data-i="${i}" aria-label="Otvori: ${c}"><img src="galerija/${n}-t.jpg" alt="${c}" loading="lazy"></button><figcaption>${c}</figcaption></figure>`).join('');
    const stage = lb.querySelector('#lb-stage'), img = lb.querySelector('#lb-img'), cap = lb.querySelector('#lb-cap'), zoomOut = lb.querySelector('#lb-zoom');
    const MAX = 8;
    let cur = 0;
    let fit = { w: 1, h: 1 }, s = 1, tx = 0, ty = 0;

    // ---------- zoom + pan (image is placed with translate(tx,ty) scale(s) from its top-left corner)
    function apply() {
      img.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
      stage.classList.toggle('zoomed', s > 1.001);
      zoomOut.textContent = Math.round(s * 100) + ' %';
    }
    function clamp() {
      const W = stage.clientWidth, H = stage.clientHeight, sw = fit.w * s, sh = fit.h * s;
      tx = sw <= W ? (W - sw) / 2 : Math.min(0, Math.max(W - sw, tx));
      ty = sh <= H ? (H - sh) / 2 : Math.min(0, Math.max(H - sh, ty));
    }
    function layout() {
      const W = stage.clientWidth, H = stage.clientHeight, nw = img.naturalWidth || 1, nh = img.naturalHeight || 1;
      const k = Math.min(W / nw, H / nh);
      fit = { w: nw * k, h: nh * k };
      img.style.width = fit.w + 'px'; img.style.height = fit.h + 'px';
      s = 1; clamp(); apply();
    }
    function zoomAt(ns, px, py) {
      ns = Math.min(MAX, Math.max(1, ns));
      tx = px - (px - tx) * ns / s; ty = py - (py - ty) * ns / s; s = ns;
      clamp(); apply();
    }
    const centre = () => [stage.clientWidth / 2, stage.clientHeight / 2];
    const local = e => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

    // mouse wheel and two-finger trackpad scroll zoom; trackpad pinch arrives as wheel + ctrlKey
    stage.addEventListener('wheel', e => {
      e.preventDefault();
      const k = e.ctrlKey ? 0.01 : 0.0025;
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt(s * Math.exp(-dy * k), ...local(e));
    }, { passive: false });

    // drag to pan, two fingers to pinch
    const pts = new Map();
    let pinch = null, moved = false, last = null;
    stage.addEventListener('pointerdown', e => {
      stage.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, local(e)); moved = false;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s };
      }
      last = local(e);
    });
    stage.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      const p = local(e); pts.set(e.pointerId, p);
      if (pts.size === 2 && pinch) {
        const [a, b] = [...pts.values()];
        const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
        zoomAt(pinch.s * dist / pinch.d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        moved = true;
      } else if (pts.size === 1 && s > 1.001) {
        tx += p[0] - last[0]; ty += p[1] - last[1]; clamp(); apply();
        stage.classList.add('dragging');
        if (Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) > 2) moved = true;
      }
      last = p;
    });
    const up = e => {
      pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
      if (pts.size === 1) last = [...pts.values()][0];
      stage.classList.remove('dragging');
    };
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    stage.addEventListener('dblclick', e => { s > 1.001 ? zoomAt(1, ...local(e)) : zoomAt(2.5, ...local(e)); });

    // ---------- navigation
    function show(i) {
      cur = (i + ITEMS.length) % ITEMS.length;
      img.onload = layout;
      img.src = 'galerija/' + ITEMS[cur][0] + '.jpg'; img.alt = ITEMS[cur][1];
      cap.textContent = (cur + 1) + ' / ' + ITEMS.length + ' · ' + ITEMS[cur][1];
      if (img.complete && img.naturalWidth) layout();
    }
    grid.addEventListener('click', e => { const b = e.target.closest('.thumb'); if (!b) return; lb.showModal(); show(+b.dataset.i); });
    lb.querySelector('#lb-prev').onclick = () => show(cur - 1);
    lb.querySelector('#lb-next').onclick = () => show(cur + 1);
    lb.querySelector('#lb-close').onclick = () => lb.close();
    lb.querySelector('#lb-in').onclick = () => zoomAt(s * 1.5, ...centre());
    lb.querySelector('#lb-out').onclick = () => zoomAt(s / 1.5, ...centre());
    lb.querySelector('#lb-reset').onclick = () => zoomAt(1, ...centre());
    // a click on the dark area around the image (not after a drag) closes the viewer
    stage.addEventListener('click', e => { if (e.target === stage && !moved && s <= 1.001) lb.close(); });
    lb.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') show(cur - 1);
      else if (e.key === 'ArrowRight') show(cur + 1);
      else if (e.key === '+' || e.key === '=') zoomAt(s * 1.5, ...centre());
      else if (e.key === '-') zoomAt(s / 1.5, ...centre());
      else if (e.key === '0') zoomAt(1, ...centre());
    });
    window.addEventListener('resize', () => { if (lb.open) layout(); });
  };
})(window.N7);
