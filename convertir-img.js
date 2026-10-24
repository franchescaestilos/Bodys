// Convierte a WebP las imágenes body-*/polo-* que guardaste como PNG o JPG dentro de la carpeta img.
// El WebP queda con el mismo nombre (body-camila_1.png -> body-camila_1.webp) y reemplaza al anterior.
// El PNG/JPG se mueve a la carpeta img_editadas_respaldo. No toca tus imágenes de header, hero ni otras.
// Uso:  node convertir-img.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CARPETA = path.join(__dirname, 'img');
const RESPALDO = path.join(__dirname, 'img_editadas_respaldo');
fs.mkdirSync(RESPALDO, { recursive: true });

(async () => {
  const archivos = fs.readdirSync(CARPETA).filter((f) => /^(body|polo)-.*\.(png|jpe?g)$/i.test(f));
  if (!archivos.length) return console.log('No hay PNG/JPG de body- o polo- dentro de img.');

  for (const f of archivos) {
    const base = path.parse(f).name;
    const destino = path.join(CARPETA, base + '.webp');
    await sharp(path.join(CARPETA, f)).webp({ quality: 85 }).toFile(destino);
    fs.renameSync(path.join(CARPETA, f), path.join(RESPALDO, f));
    console.log('OK  ', f, '->', base + '.webp');
  }
  console.log(`\nListo: ${archivos.length} imagen(es) convertida(s). Recarga la web con Ctrl + F5.`);
})();