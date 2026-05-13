/*
 * Configuración de Supabase para Muna
 * --------------------------------------
 * Reemplaza los dos valores siguientes con los de tu proyecto de Supabase.
 * Los encuentras en:  Supabase → Project → Project Settings → API
 *
 *   - SUPABASE_URL          → "Project URL"
 *   - SUPABASE_ANON_KEY     → "anon public" key (no la "service_role")
 *
 * La anon key está pensada para ser pública (vive en el navegador). La que
 * NUNCA debes pegar aquí es la "service_role".
 *
 * Si dejas los valores como "REEMPLAZA_..." el sitio sigue funcionando
 * exactamente como el prototipo (sin backend). En cuanto pongas los datos
 * reales, todo (auth, favoritos, reseñas, mensajes, publicaciones) queda
 * conectado a la base de datos.
 */

window.MUNA_CONFIG = {
  SUPABASE_URL: "REEMPLAZA_CON_TU_URL_DE_SUPABASE",
  SUPABASE_ANON_KEY: "REEMPLAZA_CON_TU_ANON_KEY"
};
