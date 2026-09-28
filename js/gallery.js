// Photo gallery with a lightbox; the list mirrors the images in galerija/.
window.N7 = window.N7 || {};
(function (N7) {
  const ITEMS = [
    ['fotomontaza', 'Fotomontaža, niža varijanta krova'],
    ['prije-poslije', 'Prije i poslije'],
    ['ideja', 'Idejna skica s bojama'],
    ['img_2794', 'Pogled s ulice'],
    ['img_2795', 'Kuća i kapija ukoso'],
    ['img_2796', 'Pogled s pločnika od susjeda'],
    ['img_2792', 'Bočni zid kuće s ulazom'],
    ['img_2793', 'Prolaz iz dvorišta prema ulici'],
    ['img_2797', 'Mjerenje: 7,8 m duž zida'],
    ['img_2798', 'Mjerenje: 3,25 m visina sidra'],
    ['img_2799', 'Mjerenje: 5,52 m širina'],
    ['img_2842', 'Inspiracija: nadstrešnica u susjedstvu'],
    ['img_2843', 'Inspiracija: nadstrešnica i klizna kapija'],
    ['primjer-3', 'Inspiracija: nadstrešnica između dviju kuća']
  ];

  N7.initGallery = function (grid, lb) {
    grid.innerHTML = ITEMS.map(([n, c], i) =>
      `<figure><button class="thumb" data-i="${i}" aria-label="Otvori: ${c}"><img src="galerija/${n}-t.jpg" alt="${c}" loading="lazy"></button><figcaption>${c}</figcaption></figure>`).join('');
    const img = lb.querySelector('#lb-img'), cap = lb.querySelector('#lb-cap');
    let cur = 0;
    function show(i) {
      cur = (i + ITEMS.length) % ITEMS.length;
      img.src = 'galerija/' + ITEMS[cur][0] + '.jpg'; img.alt = ITEMS[cur][1];
      cap.textContent = (cur + 1) + ' / ' + ITEMS.length + ' · ' + ITEMS[cur][1];
    }
    grid.addEventListener('click', e => { const b = e.target.closest('.thumb'); if (!b) return; show(+b.dataset.i); lb.showModal(); });
    lb.querySelector('#lb-prev').onclick = () => show(cur - 1);
    lb.querySelector('#lb-next').onclick = () => show(cur + 1);
    lb.querySelector('#lb-close').onclick = () => lb.close();
    lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
  };
})(window.N7);
