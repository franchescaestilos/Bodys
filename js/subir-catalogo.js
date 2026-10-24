const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ================= EDITA ESTO =================
const SUPABASE_URL = 'https://vlfcuyekpnsmziamacle.supabase.co';
const SUPABASE_KEY = 'AQUÍ_TU_CLAVE_sb_secret';
const BUCKET = 'productos';
const PRECIO_BODY = 0;   // pon tu precio
const PRECIO_POLO = 0;   // pon tu precio             // precio de todos los polos
const STOCK = { S: 5, M: 5, L: 5, XL: 5 }; // stock por talla en cada color
const DESACTIVAR_VIEJOS = true;      // true = los productos anteriores pasan a activo=false (no se borran)
// ==============================================

const CARPETA = './img_webp';

const COLORES = [
  'Vino', 'Verde olivo', 'Rojo', 'Negro', 'Cobalto', 'Marrón', 'Azul oscuro', 'Topo',
  'Beige', 'Amarillo bebé', 'Palo rosa', 'Rosado bebé', 'Celeste', 'Perla', 'Camello'
];

const NOMBRES_ESPECIALES = { mia: 'Mía' };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
  if (SUPABASE_KEY === 'XXXX' || SUPABASE_URL.includes('XXXX') || !PRECIO_BODY || !PRECIO_POLO) {
    console.log('Falta editar la configuración de arriba (URL, KEY, PRECIO_BODY y PRECIO_POLO).');
    process.exit(1);
  }

  // 1) Agrupar las imágenes por producto
  const grupos = {};
  for (const f of fs.readdirSync(CARPETA)) {
    const m = f.match(/^(body|polo)-([a-z]+)_(\d+)\.webp$/);
    if (!m) { console.log('Se ignora:', f); continue; }
    const [, tipo, nom, num] = m;
    const clave = `${tipo}-${nom}`;
    if (!grupos[clave]) {
      grupos[clave] = {
        nombre: `${cap(tipo)} ${NOMBRES_ESPECIALES[nom] || cap(nom)}`,
        categoria: tipo === 'body' ? 'Bodys' : 'Polos',
        archivos: []
      };
    }
    grupos[clave].archivos.push({ f, num: Number(num) });
  }
  const lista = Object.values(grupos);
  console.log('Productos a crear/actualizar:', lista.length);

  // 2) Productos que ya existen
  const { data: existentes, error: errEx } = await supabase.from('productos').select('id,nombre,activo');
  if (errEx) throw errEx;
  const nuevosNombres = lista.map(g => g.nombre);
  const viejos = existentes.filter(p => p.activo && !nuevosNombres.includes(p.nombre));

  // 3) Subir imágenes y guardar cada producto
  for (const g of lista) {
    g.archivos.sort((a, b) => a.num - b.num);
    const urls = [];
    for (const { f } of g.archivos) {
      const ruta = `catalogo/${f}`;
      const { error } = await supabase.storage.from(BUCKET)
        .upload(ruta, fs.readFileSync(path.join(CARPETA, f)), { contentType: 'image/webp', upsert: true });
      if (error) throw new Error(`Error subiendo ${f}: ${error.message}`);
      urls.push(supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl);
    }

    // imagen principal en cada variante, para que tu web actual siga funcionando
    const variantes = COLORES.map(color => ({ color, imagen: urls[0], tallas: { ...STOCK } }));
    const existente = existentes.find(p => p.nombre === g.nombre);

    if (existente) {
      const { error } = await supabase.from('productos')
        .update({ imagenes: urls, variantes, activo: true }).eq('id', existente.id);
      if (error) throw error;
      console.log('ACTUALIZADO:', g.nombre, `(${urls.length} imágenes)`);
    } else {
      const { error } = await supabase.from('productos').insert({
        nombre: g.nombre,
        descripcion: g.categoria === 'Bodys'
          ? 'Body de la colección Franchesca Estilos. Disponible en 15 colores.'
          : 'Polo de la colección Franchesca Estilos. Disponible en 15 colores.',
        precio: g.categoria === 'Bodys' ? PRECIO_BODY : PRECIO_POLO,
        categoria: g.categoria,
        activo: true,
        imagenes: urls,
        variantes
      });
      if (error) throw error;
      console.log('CREADO:', g.nombre, `(${urls.length} imágenes)`);
    }
  }

  // 4) Desactivar los productos anteriores
  if (DESACTIVAR_VIEJOS && viejos.length) {
    const { error } = await supabase.from('productos')
      .update({ activo: false }).in('id', viejos.map(v => v.id));
    if (error) throw error;
    console.log('Desactivados productos anteriores:', viejos.length);
  }

  console.log('\nListo.');
})().catch(e => { console.error('ERROR:', e.message || e); process.exit(1); });