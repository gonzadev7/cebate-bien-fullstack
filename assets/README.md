# Guía rápida: imágenes de productos

Subí las fotos a `assets/` con alguno de estos patrones para que el script las detecte automáticamente:

Prioridad de coincidencia (de mayor a menor):

1. Comenzar con el id del producto
   - 4-mate-imperial-de-calabaza-negro.jpg
   - id4-termo-media-manija.png
   - product-7.webp
   - producto-10.jpeg
2. Nombre del producto + color (slug)
   - mate-imperial-de-calabaza-negro.jpg
3. Nombre del producto (slug)
   - termo-media-manija-de-acero.jpg

Detalles:

- Extensiones soportadas: .jpg, .jpeg, .png, .webp
- Se ignoran: `assets/para_recuperar/`, `logo.jpg`, `logo2.png`
- El "slug" elimina tildes y espacios: "Bombillón" → `bombillon`, "negro mate" → `negro-mate`

## Cómo asignar automáticamente

Simulación (no modifica el JSON):

```bash
node scripts/asignar_imagenes.mjs
```

Aplicar cambios en `assets/products.json`:

```bash
node scripts/asignar_imagenes.mjs --write
```

Sobrescribir imágenes ya asignadas:

```bash
node scripts/asignar_imagenes.mjs --write --overwrite
```

Rutas personalizadas (opcional):

```bash
node scripts/asignar_imagenes.mjs --dir=assets --json=assets/products.json
```

## Sugerencias de nombres por producto (actuales sin imagen)

- id 4: 4-mate-imperial-de-calabaza-negro.jpg
- id 5: 5-mate-imperial-de-calabaza-rojo.jpg
- id 6: 6-termo-media-manija-de-acero.jpg
- id 7: 7-termo-media-manija-negro-mate.jpg
- id 8: 8-bombilla-pico-de-loro.jpg
- id 9: 9-bombillon.jpg
- id 10: 10-canasta-matera.jpg

> Tip: Si vas a subir varias fotos por producto, por ahora tomamos la mejor coincidencia por score (la primera). Si necesitás galería, lo extendemos.
