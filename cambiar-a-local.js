// Cambia las imágenes de los productos: de URLs de Supabase Storage a rutas locales (img/...)
// Uso:
//   node cambiar-a-local.js revisar   -> solo muestra qué cambiaría (no modifica nada)
//   node cambiar-a-local.js aplicar   -> actualiza la tabla productos y guarda storage_paths.json
//   node cambiar-a-local.js borrar    -> borra del Storage las imágenes listadas en storage_paths.json
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Copia estos dos valores de tu subir-catalogo.js
const SUPABASE_URL = 'https://vlfcuyekpnsmziamacle.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6NCCtkox0sQIR2zXT-6vEQ_Xv7_6Uia';

const BUCKET = 'productos';
const CARPETA_LOCAL = path.join(__dirname, 'img');
const ARCHIVO_RUTAS = path.join(__dirname, 'storage_paths.json');

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const marca = `/object/public/${BUCKET}/`;

const esStorage = (u) => typeof u === 'string' && u.includes(marca);
const rutaStorage = (u) => decodeURIComponent(u.split(marca)[1].split('?')[0]);
const aLocal = (u) => 'img/' + path.basename(rutaStorage(u));

async function main() {
  const modo = process.argv[2] || 'revisar';

  if (modo === 'borrar') {
    if (!fs.existsSync(ARCHIVO_RUTAS)) return console.log('No existe storage_paths.json. Corre primero "aplicar".');
    const rutas = JSON.parse(fs.readFileSync(ARCHIVO_RUTAS, 'utf8'));
    for (let i = 0; i < rutas.length; i += 100) {
      const lote = rutas.slice(i, i + 100);
      const { error } = await sb.storage.from(BUCKET).remove(lote);
      if (error) return console.error('Error al borrar:', error.message);
    }
    return console.log(`Borradas ${rutas.length} imágenes del Storage.`);
  }

  const { data: productos, error } = await sb.from('productos').select('id,nombre,imagenes,variantes');
  if (error) return console.error(error.message);

  const rutasStorage = new Set();
  const faltantes = new Set();
  const cambios = [];

  const convertir = (u) => {
    if (!esStorage(u)) return u;
    rutasStorage.add(rutaStorage(u));
    const local = aLocal(u);
    if (!fs.existsSync(path.join(CARPETA_LOCAL, path.basename(local)))) faltantes.add(path.basename(local));
    return local;
  };

  for (const p of productos) {
    const imagenes = Array.isArray(p.imagenes) ? p.imagenes.map(convertir) : p.imagenes;
    const variantes = Array.isArray(p.variantes)
      ? p.variantes.map((v) => ({ ...v, imagen: convertir(v.imagen) }))
      : p.variantes;
    if (JSON.stringify(imagenes) !== JSON.stringify(p.imagenes) || JSON.stringify(variantes) !== JSON.stringify(p.variantes)) {
      cambios.push({ id: p.id, nombre: p.nombre, imagenes, variantes });
    }
  }

  console.log(`Productos a actualizar: ${cambios.length}`);
  console.log(`Imágenes distintas en Storage: ${rutasStorage.size}`);
  if (cambios[0]) console.log('Ejemplo:', cambios[0].nombre, cambios[0].imagenes);

  if (faltantes.size) {
    console.log(`\nFALTAN ${faltantes.size} archivos en ${CARPETA_LOCAL}:`);
    [...faltantes].forEach((f) => console.log(' -', f));
    return console.log('\nCópialos ahí y vuelve a correr el script. No se cambió nada.');
  }

  if (modo !== 'aplicar') return console.log('\nTodo en orden. Para aplicar: node cambiar-a-local.js aplicar');

  for (const c of cambios) {
    const { error: e } = await sb.from('productos').update({ imagenes: c.imagenes, variantes: c.variantes }).eq('id', c.id);
    if (e) return console.error(`Error en ${c.nombre}:`, e.message);
  }
  fs.writeFileSync(ARCHIVO_RUTAS, JSON.stringify([...rutasStorage], null, 2));
  console.log('\nTabla actualizada. Revisa tu web y, si todo se ve bien, corre: node cambiar-a-local.js borrar');
}

main();