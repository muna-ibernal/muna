-- ============================================================
-- Muna — Seed (datos iniciales)
-- ============================================================
-- Carga las mismas fichas y publicaciones que ya estaban en el HTML del
-- prototipo, de modo que cuando conectes la base de datos, el sitio se vea
-- IDÉNTICO al prototipo, pero con datos reales en Supabase.
-- ============================================================

-- ---------- DIRECTORY ----------
insert into public.directory_items
  (id, cat, title, short_desc, full_desc, rating, votes, country, city, deleg, zone, mode_kind, stage, phone, whatsapp, email, site, social, hours, address, owner_text, submitted_by, extra, img, status, verified)
values
  ('directory-1','Profesionales','Dra. Laura Gómez',
   'Pediatra y asesora de lactancia con enfoque cálido.',
   'Consulta pediátrica, acompañamiento en lactancia y seguimiento de recién nacido.',
   4.8, 24, 'México','CDMX','Benito Juárez','Del Valle','Presencial','Recién nacido',
   '55 0000 0000','55 1111 1111','contacto@lauragomez.mx','www.lauragomez.mx','@dra.lauragomez',
   'Lun-Vie 9:00-18:00','Av. Coyoacán 123',
   'Soy la persona responsable','@mariana_muna',
   'Cédula profesional visible en consultorio.','👩‍⚕️','activa', true),
  ('directory-2','Cursos','Círculo de Posparto Roma',
   'Acompañamiento grupal para mamás recientes.',
   'Sesiones semanales para hablar de puerperio, lactancia, sueño y emociones.',
   4.6, 18, 'México','CDMX','Cuauhtémoc','Roma Norte','Híbrido','Posparto',
   '55 2222 2222','55 3333 3333','hola@circuloposparto.mx','www.circuloposparto.mx','@circuloposparto',
   'Miércoles 11:00','Colima 45',
   'Represento a esta comunidad','@lau_mama',
   'Cupo limitado.','☕','activa', true)
on conflict (id) do nothing;

-- ---------- PRODUCTS ----------
insert into public.products
  (id, cat, title, brand, model, short_desc, full_desc, rating, votes, price, approx, where_buy, link, mx, tech, country, city, deleg, zone, img)
values
  ('products-1','Transporte','Carriola Nido Go','Nido','Go 2026',
   'Carriola ligera para ciudad, plegable y fácil de guardar.',
   'Ideal para traslados urbanos. Plegado compacto, manubrio ajustable y canastilla inferior.',
   4.7, 24, '$$$','$8,500 MXN','Tiendas departamentales y sitio oficial','www.nido.mx/go','Sí',
   'Peso 7.2 kg, hasta 22 kg, reclinable.','México','CDMX','Benito Juárez','Narvarte','🛒'),
  ('products-2','Lactancia','Extractor Luna Mini','Luna','Mini',
   'Extractor portátil para extracciones ocasionales.',
   'Batería recargable y tres niveles de succión. Fácil de lavar.',
   4.2, 15, '$$','$2,100 MXN','Amazon México y farmacias','www.luna.mx/mini','Sí',
   'BPA free, batería USB-C.','México','CDMX','Cuauhtémoc','Roma Norte','🍼')
on conflict (id) do nothing;

-- ---------- COMMUNITY ----------
insert into public.community_items
  (id, cat, type, title, short_desc, full_desc, user_alias, country, city, deleg, zone, img)
values
  ('community-1','Sueño','Pregunta','¿Cómo sobrevivieron a la regresión de sueño?',
   'Mi bebé de 4 meses se despierta cada hora y ya no sé qué probar.',
   'Busco consejos realistas, sin métodos de llanto prolongado. ¿Qué les funcionó?',
   'Mariana M.','México','CDMX','Benito Juárez','Narvarte',''),
  ('community-2','Alimentación','Experiencia','Mi experiencia iniciando BLW',
   'Comparto lo que me hubiera gustado saber antes de empezar.',
   'Empecé a los 6 meses con asesoría y mucha paciencia. Lo más útil fue preparar alimentos seguros y aceptar el desastre.',
   'Luisa R.','México','Querétaro','Otra','Centro','🥑')
on conflict (id) do nothing;

-- Respuestas iniciales (como "answers" en el HTML) ↦ comments
-- Las dejamos sin author_user_id porque son del prototipo. Si quieres que
-- sean del usuario admin, edita el script tras crear tu primera cuenta.

-- ---------- EVENTS ----------
insert into public.events
  (id, cat, title, short_desc, full_desc, event_date, event_time, mode_kind, country, city, deleg, zone, address, cost, price, organizer, contact, stage, extra, img)
values
  ('events-1','Taller','Primeros auxilios para bebé',
   'Taller práctico para responder ante atragantamiento y fiebre.',
   'Sesión con instructora certificada, práctica con muñecos y guía para casa.',
   '2026-05-18','11:00:00','Presencial','México','CDMX','Miguel Hidalgo','Polanco',
   'Centro Muna, Horacio 50','De paga','$650 MXN','Muna + Pediatría Clara',
   'eventos@muna.mx','Recién nacido / Bebé 0-12 meses','Incluye material impreso.','🧸'),
  ('events-2','Online','Lactancia al volver al trabajo',
   'Plática online para planear extracción, banco de leche y horarios.',
   'Sesión de 90 minutos con Q&A final.',
   '2026-05-22','19:00:00','Online','México','Online','Otra','Online',
   'Link privado al registrarte','Gratis','Sin costo','Red Lacta',
   'hola@redlacta.mx','Lactancia','Cupo limitado.','💻')
on conflict (id) do nothing;

-- ---------- SECONDHAND ----------
insert into public.secondhand_items
  (id, cat, title, brand, model, short_desc, full_desc, price, state, country, city, deleg, zone, available, extra, user_alias, img)
values
  ('secondhand-1','Transporte','Carriola Bugaboo usada','Bugaboo','Bee 6',
   'En muy buen estado, uso de un año.',
   'Incluye cubierta de lluvia y adaptadores. Tiene detalles menores en manubrio.',
   '$7,500 MXN','Muy buen estado','México','CDMX','Benito Juárez','Del Valle',
   'Disponible','Entrega en punto medio.','Ana P.','🛒'),
  ('secondhand-2','Sueño','Cuna colecho','Chicco','Next2Me',
   'Cuna colecho con funda lavable.',
   'Se usó seis meses. Incluye colchón original.',
   '$2,800 MXN','Buen estado','México','CDMX','Coyoacán','Santa Catarina',
   'Disponible','No incluye sábanas.','Pao G.','🛏️')
on conflict (id) do nothing;

-- ---------- REVIEWS (semilla) ----------
-- Se insertan SIN reviewer_user_id (usuario invitado) para que aparezcan en
-- las fichas. El trigger update_target_rating recalculará rating + votes,
-- pero ya dejamos el valor explícito arriba para no esperar al primer
-- evento. Si quieres que cuenten para promedios, descomenta lo siguiente:
-- insert into public.reviews (target_type, target_id, r, t) values
--   ('directory','directory-1',5,'Excelente trato y muy clara.'),
--   ('directory','directory-1',4,'Me ayudó mucho con lactancia.'),
--   ('directory','directory-1',5,'Muy profesional.'),
--   ('directory','directory-2',5,'Me sentí acompañada.'),
--   ('directory','directory-2',4,'Buen espacio, un poco lejos.');
-- insert into public.reviews (target_type, target_id, r, t, price, pros, cons) values
--   ('products','products-1',5,'Muy práctica para departamento.','$$$','Ligera','Canastilla pequeña'),
--   ('products','products-1',4,'Buena, aunque cara.','$$$$','Plega fácil','Precio'),
--   ('products','products-2',4,'Me sirvió para oficina.','$$','Portátil','Ruido'),
--   ('products','products-2',3,'Bien para emergencias.','$$','Compacto','Poca potencia');
