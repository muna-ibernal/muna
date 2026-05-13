# Siguientes pasos — Muna

Esta guía es **paso a paso, sin asumir nada**. Al terminar tendrás el sitio Muna corriendo en internet, con base de datos real, autenticación real y dominio público.

---

## 0) Lo que ya está hecho

- ✅ Tu HTML original (`index.html`) está intacto: mismo diseño, textos, fuentes, imágenes, paleta y orden.
- ✅ La capa Supabase está escrita en `muna-app.js` y se carga al final del HTML mediante UNA sola línea de `<script>`. Si Supabase no está configurado, el HTML se comporta como el prototipo.
- ✅ Los SQL para la base de datos están en `supabase/` (schema, policies, storage, seed).

Te quedan tres bloques: **A) GitHub**, **B) Supabase**, **C) Vercel**. Sigue el orden.

---

## A) Subir el código a GitHub

> Esto se hace en tu terminal (no en el sandbox). Abre la app **Terminal** del Mac (Aplicaciones → Utilidades → Terminal) y pega los comandos uno a uno.

### A.1) Inicializar el repo

```bash
cd ~/Projects/muna
git init -b main
git add .
git commit -m "Muna: HTML original + integración Supabase + deploy Vercel"
```

### A.2) Crear el repo en GitHub (web)

1. Entra a <https://github.com/new>.
2. Repository name: `muna` (o el nombre que prefieras).
3. **Private** (recomendado al inicio).
4. Deja vacíos README/.gitignore/license (ya los tienes).
5. Click **Create repository**.

GitHub te mostrará comandos para conectar tu repo local. Usa la segunda sección "or push an existing repository". Algo así:

```bash
git remote add origin https://github.com/TU_USUARIO/muna.git
git push -u origin main
```

> Si te pide credenciales, GitHub ya **no acepta tu contraseña**. Necesitas un **Personal Access Token** (Settings → Developer settings → Personal access tokens → Tokens classic → Generate new token, marca `repo`). Pega el token como contraseña.

---

## B) Crear la base de datos en Supabase

### B.1) Crear el proyecto

1. Entra a <https://supabase.com/dashboard>.
2. **New project**.
3. Organization: la que ya tengas (o crea una).
4. Name: `muna` (lo que prefieras).
5. Database password: anótala en tu password manager (no se vuelve a mostrar fácilmente).
6. Region: la más cercana a tus usuarios (México → `us-east-1` o `us-west-1`).
7. Pricing plan: Free está bien para empezar.
8. **Create new project** y espera ~2 min.

### B.2) Ejecutar los scripts SQL

En el dashboard de tu proyecto, ve a **SQL Editor** (icono de base de datos).

**Por cada archivo** en `~/Projects/muna/supabase/`, en este orden:

1. Abre el archivo en tu editor (TextEdit, VS Code, etc.).
2. Copia todo el contenido.
3. En Supabase → SQL Editor → **New query**.
4. Pega el contenido.
5. Click **Run** (o Cmd+Enter).

Orden:

1. `schema.sql`
2. `policies.sql`
3. `storage.sql`
4. `seed.sql`

Si ves algún error de "ya existe", está bien: los scripts usan `if not exists` y `on conflict do nothing`.

### B.3) Copiar URL y anon key

En el dashboard de Supabase:

1. Click en el ícono ⚙️ **Project Settings** (abajo a la izquierda).
2. Sección **API**.
3. Copia:
   - **Project URL** (algo como `https://xxxxxx.supabase.co`)
   - **anon public** key (es una cadena larga).

### B.4) Pegarlas en `muna-config.js`

Abre `~/Projects/muna/muna-config.js` y reemplaza:

```js
window.MUNA_CONFIG = {
  SUPABASE_URL: "https://xxxxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJh..."
};
```

Guarda. La **anon key es pública** (vive en el navegador) — no te preocupes por pegarla aquí. La que NUNCA pegues aquí es la `service_role`.

### B.5) Confirmar el envío de correos de Supabase

Como vas a usar **email + password**:

1. **Authentication → Providers**: confirma que **Email** está habilitado.
2. **Authentication → URL Configuration** → **Site URL**: pon `http://localhost:8080` por ahora; cuando tengas el dominio de Vercel lo cambias.
3. **Authentication → Email Templates**: deja los predeterminados o personalízalos cuando quieras.

### B.6) Probar localmente

Antes de subir a producción, prueba que todo funciona:

```bash
cd ~/Projects/muna
python3 -m http.server 8080
```

Abre <http://localhost:8080>:

1. Crea una cuenta de prueba (Crear cuenta).
2. Revisa tu correo y haz click en el link de confirmación de Supabase.
3. Vuelve, inicia sesión.
4. Marca algún favorito → ve a la pestaña de favoritos.
5. Escribe una reseña → debe quedar persistida (recarga la página y debe seguir ahí).
6. Publica un artículo en Segunda mano → ve a "Mis publicaciones".

Si todo se ve bien: continúa.

---

## C) Desplegar en Vercel

### C.1) Subir últimos cambios

Tu `muna-config.js` ya tiene los datos reales. Súbelo a GitHub:

```bash
cd ~/Projects/muna
git add muna-config.js
git commit -m "Configurar Supabase URL y anon key"
git push
```

### C.2) Importar el repo

1. Entra a <https://vercel.com/new>.
2. Login con tu cuenta (puedes usar GitHub para autorizar).
3. Selecciona el repo `muna`.
4. **Framework Preset**: déjalo en `Other` (es HTML estático).
5. **Root Directory**: `./` (la raíz).
6. **Build & Output Settings**: déjalo vacío (no hay build).
7. Click **Deploy**.

Vercel desplegará en ~30 seg y te dará una URL como `muna-xxx.vercel.app`.

### C.3) Actualizar Supabase Site URL

Vuelve a Supabase:

1. **Authentication → URL Configuration**.
2. **Site URL**: pega la URL de Vercel (`https://muna-xxx.vercel.app`).
3. **Redirect URLs**: añade también esa URL.
4. Save.

Esto hace que los enlaces de confirmación de correo redirijan correctamente.

### C.4) (Opcional) Dominio propio

En Vercel → tu proyecto → **Domains** → **Add**. Si tienes un dominio comprado (GoDaddy, Namecheap, etc.), te dará los registros DNS a poner allá.

---

## D) Mantenimiento y mejoras

### Cómo cambiar el sitio

Cualquier cambio que quieras hacer:

1. Edita los archivos localmente (`index.html`, `muna-app.js`, etc.).
2. `git add . && git commit -m "lo que cambiaste" && git push`.
3. Vercel detecta el push y redepliega automáticamente.

### Ver logs / errores

- **Frontend**: abre la consola del navegador (F12 → Console). Errores de Supabase aparecen ahí.
- **Backend**: Supabase → **Logs** (panel izquierdo) muestra cada query, autenticación, etc.

### Cómo agregar contenido como administrador

La forma más sencilla: crea tu cuenta normal en el sitio (Crear cuenta → confirma correo → ingresa). Después, en Supabase → Table editor, edita filas a mano para marcarte como administradora si lo necesitas.

### Si quieres usar la "service_role" key

NUNCA en el navegador. Si más adelante quieres tareas administrativas (borrar cuentas, mover datos), se hace con una Edge Function de Supabase o con un script desde tu propia máquina.

---

## E) Checklist final antes de anunciar el sitio

- [ ] Crear cuenta funciona y llega el correo de confirmación.
- [ ] Iniciar sesión funciona.
- [ ] Cerrar sesión funciona.
- [ ] Favoritos persisten entre recargas y entre dispositivos.
- [ ] Reseñas se publican y muestran.
- [ ] Comentarios en Comunidad y Segunda mano se guardan.
- [ ] Crear publicación (Productos / Eventos / Segunda mano / Comunidad / Directorio) funciona.
- [ ] "Mis publicaciones" muestra lo que publicaste.
- [ ] Mensajes entre dos cuentas distintas funcionan.
- [ ] Subir imagen en formularios se ve en el detalle de la ficha.
- [ ] El sitio se ve idéntico al prototipo (mismo diseño, textos, fuentes, paleta, orden).

Si algo falla, abre la consola del navegador y mira el mensaje; los errores de Supabase son explícitos y casi siempre se resuelven con un permiso de RLS o un campo mal nombrado.

---

¡Listo! Cuando esto pase, Muna estará en producción.
