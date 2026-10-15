const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const db = createClient(
  "https://vlfcuyekpnsmziamacle.supabase.co",
  "TU_CLAVE_SECRETA"
);

const archivos = fs.readdirSync("./img");
const porNombre = {};
archivos.forEach((f) => {
  porNombre[f.replace(/\.[^.]+$/, "").toLowerCase()] = f;
});

async function arreglar() {
  const { data, error } = await db.from("productos").select("id, variantes");
  if (error) return console.error("Error:", error.message);

  const faltan = [];

  for (const p of data) {
    const variantes = p.variantes.map((v) => {
      const base = v.imagen.split("/").pop().replace(/\.[^.]+$/, "").toLowerCase();
      const archivo = porNombre[base];
      if (!archivo) {
        faltan.push(base);
        return v;
      }
      return { ...v, imagen: "img/" + archivo };
    });

    const { error: e } = await db.from("productos").update({ variantes }).eq("id", p.id);
    if (e) console.error(e.message);
  }

  console.log("Listo ✅");
  if (faltan.length) {
    console.log("No encontré estas fotos en la carpeta img:\n" + faltan.join("\n"));
  }
}

arreglar();