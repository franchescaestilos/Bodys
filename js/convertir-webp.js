const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const carpetaEntrada = './img_originales';
const carpetaSalida = './img_webp';

if (!fs.existsSync(carpetaEntrada)) {
  console.log('No existe la carpeta img_originales. Créala y pon ahí tus imágenes.');
  process.exit(1);
}
if (!fs.existsSync(carpetaSalida)) fs.mkdirSync(carpetaSalida);

// "Body Mía_3" -> "body-mia_3"
function limpiarNombre(nombre) {
  return nombre
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .toLowerCase()
    .replace(/\s+/g, '-')                             // espacios -> guiones
    .replace(/[^a-z0-9_-]/g, '');                     // quita símbolos raros
}

const archivos = fs.readdirSync(carpetaEntrada)
  .filter(f => /\.(jpe?g|png|webp)$/i.test(f));

const usados = new Set();
const raros = [];

(async () => {
  for (const archivo of archivos) {
    const nombreOriginal = path.parse(archivo).name;
    const nombre = limpiarNombre(nombreOriginal);

    if (!/^(body|polo)-[a-z]+_\d+$/.test(nombre)) raros.push(archivo);
    if (usados.has(nombre)) {
      console.log('DUPLICADO (se omite):', archivo);
      continue;
    }
    usados.add(nombre);

    await sharp(path.join(carpetaEntrada, archivo))
      .rotate() // respeta la orientación de fotos de celular
      .resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(carpetaSalida, nombre + '.webp'));

    console.log('OK:', archivo, '->', nombre + '.webp');
  }
  console.log('\nConvertidas:', usados.size, 'de', archivos.length);
  if (raros.length) console.log('Revisar estos nombres:', raros);
})();