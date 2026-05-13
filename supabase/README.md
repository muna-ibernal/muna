# Supabase para Muna

Estos cuatro archivos crean toda la base de datos que necesita Muna,
respetando exactamente los nombres de campos que usa `index.html`.

## Orden de ejecución

En el dashboard de Supabase, ve a **SQL Editor → New query** y pega y ejecuta cada archivo, uno a la vez, en este orden:

1. `schema.sql` — crea tablas, índices y triggers.
2. `policies.sql` — activa Row Level Security y define quién puede leer/escribir.
3. `storage.sql` — crea el bucket público `muna-public` para imágenes.
4. `seed.sql` — carga las mismas fichas/productos/eventos del prototipo (opcional, pero recomendado para que el sitio se vea idéntico desde el día uno).

## Lo que crea

- **profiles** — perfil público vinculado a `auth.users`. Trigger automático que crea fila al registrarse.
- **directory_items, products, community_items, events, secondhand_items** — los cinco módulos de Muna.
- **reviews, favorites, comments** — interacciones de usuarias.
- **conversations, messages** — mensajería privada.
- **suggestions** — sugerencias, reportes y reclamaciones.
- Bucket de Storage `muna-public` para imágenes que las usuarias suben en formularios.

## Cómo se conecta el HTML

El archivo `muna-app.js` (en la raíz del proyecto) lee `window.MUNA_CONFIG` desde `muna-config.js` y, si tiene URL + anon key válidas, sustituye las funciones `login`, `submitSignup`, `fav`, `submitReview`, `addCommunityReply`, `addSecondhandComment`, `submitGeneric`, `deletePost`, `soldPost`, `contactSeller` y `conv` con versiones que hablan con estas tablas. **No cambia ni una línea del diseño** del HTML.

## Notas

- La columna `baby_date` es privada por contrato; nunca se selecciona desde el cliente público (sólo el propio dueño puede verla). Si más adelante quieres que la API solo regrese fechas para el propio usuario, se puede crear una vista filtrada.
- Las reseñas re-calculan automáticamente `rating` y `votes` de la ficha destino mediante el trigger `update_target_rating`.
- Si quieres borrar todo y volver a empezar: `drop schema public cascade; create schema public;` (¡destruye todo!).
