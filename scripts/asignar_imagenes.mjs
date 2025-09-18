#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";

const cwd = process.cwd();

function parseArgs(argv) {
  const args = {
    write: false,
    overwrite: false,
    assetsDir: "assets",
    jsonPath: "assets/products.json",
    verbose: true,
  };
  for (const a of argv.slice(2)) {
    if (a === "--write") args.write = true;
    else if (a === "--overwrite") args.overwrite = true;
    else if (a === "--quiet") args.verbose = false;
    else if (a.startsWith("--dir=")) args.assetsDir = a.slice("--dir=".length);
    else if (a.startsWith("--json=")) args.jsonPath = a.slice("--json=".length);
    else if (a === "--help" || a === "-h") {
      console.log(
        `Uso: node scripts/asignar_imagenes.mjs [opciones]\n\nOpciones:\n  --write            Escribe los cambios en el JSON (por defecto solo muestra).\n  --overwrite        Permite sobrescribir el campo imagen si ya existe.\n  --dir=assets       Directorio de assets a escanear (por defecto 'assets').\n  --json=assets/products.json  Ruta al JSON de productos.\n  --quiet            Menos salida por consola.\n`
      );
      process.exit(0);
    }
  }
  return args;
}

function toSlug(str) {
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/-+/g, "-");
}

function isImage(filename) {
  return /\.(jpe?g|png|webp)$/i.test(filename);
}

function priorityScore(fileBase, id, nameSlug, color) {
  const idStr = String(id);
  const colorSlug = color ? toSlug(color) : "";
  let score = 0;
  // Máxima prioridad: id al inicio
  if (
    fileBase === idStr ||
    fileBase.startsWith(`${idStr}-`) ||
    fileBase.startsWith(`${idStr}_`) ||
    fileBase.startsWith(`id${idStr}-`) ||
    fileBase.startsWith(`product-${idStr}`) ||
    fileBase.startsWith(`producto-${idStr}`)
  ) {
    score += 100;
  }
  // Luego nombre + color exacto
  if (
    colorSlug &&
    (fileBase === `${nameSlug}-${colorSlug}` ||
      fileBase.startsWith(`${nameSlug}-${colorSlug}-`))
  ) {
    score += 50;
  }
  // Luego nombre exacto o como prefijo
  if (
    fileBase === nameSlug ||
    fileBase.startsWith(`${nameSlug}-`) ||
    fileBase.startsWith(`${nameSlug}_`)
  ) {
    score += 25;
  }
  // Penalizar nombres largos (preferir más simples)
  score -= Math.min(10, Math.max(0, fileBase.length - 30) / 5);
  return score;
}

async function main() {
  const args = parseArgs(process.argv);
  const assetsDirAbs = path.resolve(cwd, args.assetsDir);
  const jsonPathAbs = path.resolve(cwd, args.jsonPath);

  const [entries, jsonBuf] = await Promise.all([
    fs.readdir(assetsDirAbs, { withFileTypes: true }),
    fs.readFile(jsonPathAbs),
  ]);

  const files = entries
    .filter(
      (d) => d.isFile() && isImage(d.name) && !/^logo(2)?\./i.test(d.name)
    )
    .map((d) => d.name);

  const subdirs = entries.filter((d) => d.isDirectory()).map((d) => d.name);
  if (subdirs.includes("para_recuperar") && args.verbose) {
    console.log("Nota: se ignoró assets/para_recuperar");
  }

  const productos = JSON.parse(jsonBuf.toString());

  const cambios = [];
  for (const p of productos) {
    if (!args.overwrite && p.imagen && String(p.imagen).trim() !== "") {
      continue; // no tocar productos que ya tienen imagen
    }
    const nameSlug = toSlug(p.nombre || "");
    const color = p.color || "";
    const candidates = files
      .map((f) => ({
        name: f,
        base: f.replace(/\.[^.]+$/, ""),
      }))
      .map((f) => ({
        ...f,
        score: priorityScore(f.base, p.id, nameSlug, color),
      }))
      .filter((f) => f.score > 0)
      .sort((a, b) => b.score - a.score);

    if (candidates.length > 0) {
      const chosen = candidates[0];
      const prev = p.imagen || "";
      const newPath = path.posix.join(
        "assets",
        chosen.name.replace(/\\/g, "/")
      );
      if (args.verbose) {
        console.log(`Producto #${p.id} '${p.nombre}':`);
        console.log(
          `  → candidato: ${chosen.name} (score ${chosen.score.toFixed(1)})`
        );
        if (prev) console.log(`  (reemplazaría '${prev}')`);
      }
      cambios.push({ id: p.id, nombre: p.nombre, de: prev, a: newPath });
      if (args.write) {
        p.imagen = newPath;
      }
    } else if (args.verbose) {
      console.log(`Producto #${p.id} '${p.nombre}': sin coincidencias`);
    }
  }

  if (args.write) {
    await fs.writeFile(jsonPathAbs, JSON.stringify(productos, null, 2) + "\n");
    if (args.verbose) {
      console.log(
        `\nSe escribieron ${cambios.length} asignaciones en ${args.jsonPath}`
      );
    }
  } else {
    if (args.verbose) {
      console.log(
        "\nModo simulación (sin escribir). Para aplicar cambios ejecuta con --write"
      );
    }
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
