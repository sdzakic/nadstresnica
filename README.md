# Nadstrešnica br. 7

Idejni prikaz nadstrešnice: 3D model (Three.js), nacrt pročelja s mjerama, usporedba krovnih panela i galerija fotografija.

Statična stranica bez build koraka.

```
index.html        markup
css/style.css     stilovi
js/config.js      mjere i pravila (sve se računa odavde: visina krova, garažna vrata, broj stupova…)
js/scene.js       Three.js 3D model
js/elevation.js   nacrt pročelja (SVG) s kotama
js/materials.js   popis materijala, cement i šljunak, okvirne cijene
js/gallery.js     galerija slika
js/main.js        povezivanje kontrola, modela, nacrta i popisa
galerija/         slike (+ sličice *-t.jpg)
```

Izmjerene mjere su u `js/config.js` (`MEASURED`), a fiksni dijelovi (vrata, stupić, pravila za pad i nadvisinu) u `FIX`.

## Lokalno

```bash
python3 -m http.server 8000
```

Zatim otvori http://localhost:8000.

## GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
