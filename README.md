# Cebate Bien

Productos centralizados en `assets/products.json` y render dinámico en `index.html`.

## Imágenes de productos

Consulta la guía para nombrado y asignación automática en `assets/README.md`.

## Editar productos

1. Abre `assets/products.json`.
2. Cada producto tiene el siguiente esquema:
   - `id` (string, único)
   - `nombre` (string)
   - `precio` (número, en ARS)
   - `imagen` (ruta relativa)
   - `alt` (texto alternativo)
   - `notaPrecio` (opcional, ej. "c/u")
   - `caracteristicas` (array de strings)
3. Guarda el archivo y recarga la página.

## Nota sobre el fallback

Si abres `index.html` directamente (file://), algunos navegadores bloquean `fetch` a archivos locales. Por eso hay un fallback con datos embebidos dentro de `index.html` (etiqueta `<script id="products-data" type="application/json">`).

- En un entorno con servidor (http://), se usa `assets/products.json`.
- Si `fetch` falla, se usa el fallback embebido.

Para evitar duplicar datos, lo ideal es servir el sitio con un servidor local simple:

```bash
# En Windows con bash o Git Bash (si tienes Python instalado)
python -m http.server 5500
# Luego abre: http://localhost:5500/
```

## Compatibilidad escritorio/móvil

- `desktop.js` y `mobile.js` cargan el JSON y renderizan cards.
- El zoom y el carrito siguen funcionando con los productos dinámicos.

## Próximos pasos sugeridos

- Agregar campos opcionales como `stock`, `categoria`, `destacado`.
- Crear un pequeño script para generar el fallback embebido desde `products.json` automáticamente (si es necesario).
