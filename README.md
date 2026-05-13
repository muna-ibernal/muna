# Muna — Web

Hub de maternidad temprana: directorio de profesionales y servicios, productos, comunidad, eventos y segunda mano.

Este repo contiene **el HTML original del prototipo intacto** (mismo diseño, textos, fuentes, imágenes y orden) más una capa de JavaScript que lo conecta con **Supabase** (auth, base de datos, storage) y se sirve como **sitio estático desde Vercel**.

## Estructura del proyecto

```
muna/
├── index.html         ← HTML del prototipo (sin cambios visuales)
├── muna-config.js     ← URL + anon key de Supabase (lo editas tú)
├── muna-app.js        ← Capa Supabase: sobrescribe login, favoritos, reseñas, mensajes, etc.
├── supabase/
│   ├── schema.sql     ← Tablas, índices, triggers
│   ├── policies.sql   ← Row Level Security
│   ├── storage.sql    ← Bucket público de imágenes
│   ├── seed.sql       ← Datos iniciales = los mismos que tenía el prototipo
│   └── README.md
├── vercel.json
├── .gitignore
└── SIGUIENTES_PASOS.md ← Guía paso a paso para conectar Supabase + desplegar
```

## Filosofía

- **El HTML es la fuente de verdad para el diseño.** No se modifica, no se refactoriza, no se cambian textos. Toda la lógica nueva vive en `muna-app.js`.
- **`muna-app.js` es opcional.** Si no configuras Supabase, el HTML sigue funcionando exactamente como el prototipo (datos de ejemplo). Cuando configuras `muna-config.js`, las funciones se conectan a Supabase de forma transparente.
- **Sitio estático.** No hay build, ni framework, ni servidor. Solo tres archivos JS (uno desde CDN) y un HTML.

## Cómo correrlo localmente

Solo abre `index.html` en cualquier navegador. (Para que `fetch` y módulos funcionen mejor, recomendado servir con un servidor estático:)

```bash
cd ~/Projects/muna
python3 -m http.server 8080
# abre http://localhost:8080
```

## Producción

Lee `SIGUIENTES_PASOS.md` — está paso a paso.

Resumen:

1. Subir este repo a GitHub.
2. Crear proyecto en Supabase, ejecutar los SQL de `supabase/` en orden y copiar URL + anon key a `muna-config.js`.
3. Importar el repo en Vercel y desplegar.
