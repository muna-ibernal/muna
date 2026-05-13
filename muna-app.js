/*
 * muna-app.js
 * --------------
 * Conecta el HTML de Muna con Supabase SIN modificar diseño, textos ni
 * estructura. Se ejecuta después del script inline del HTML (que ya corrió
 * `init()`), sobreescribe las funciones de prototipo (`login`, `fav`,
 * `submitReview`, etc.) con versiones que hablan con Supabase, y rellena
 * `window.data`, `window.favs`, `window.myPosts`, etc. con datos reales.
 *
 * Si muna-config.js NO tiene URL/anon key reales, este archivo no hace
 * nada y el sitio se comporta como el prototipo original (datos simulados).
 */

(function () {
  "use strict";

  const cfg = window.MUNA_CONFIG || {};
  const configured =
    !!cfg.SUPABASE_URL &&
    !!cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.startsWith("REEMPLAZA_") &&
    !cfg.SUPABASE_ANON_KEY.startsWith("REEMPLAZA_");

  if (!configured) {
    console.info(
      "[Muna] Supabase no está configurado todavía. Edita muna-config.js " +
        "con tu Project URL y anon key para activar el backend."
    );
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    console.error(
      "[Muna] No se cargó el SDK de Supabase. Verifica el <script> que apunta a jsdelivr."
    );
    return;
  }

  const sb = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY,
    { auth: { persistSession: true, autoRefreshToken: true } }
  );

  // Exponer para depuración manual y para muna-storage helpers si se necesitara.
  window.muna = { sb, session: null, profile: null };

  /* ============================================================
   * Helpers
   * ============================================================ */

  const toast = (msg) => window.toast && window.toast(msg);

  function refreshCurrentPage() {
    const active = document.querySelector(".page.active")?.id;
    if (active === "homeLogged" || active === "homePublic")
      window.renderHomeEvents && window.renderHomeEvents();
    if (active === "module") window.renderModule && window.renderModule();
    if (active === "myPosts") window.renderMyPosts && window.renderMyPosts();
    if (active === "myProfiles")
      window.renderMyProfiles && window.renderMyProfiles();
  }

  // Convierten filas de DB → forma que el HTML espera en window.data[...]
  function rowToDirectory(r) {
    return {
      id: r.id,
      cat: r.cat,
      title: r.title,
      short: r.short_desc,
      full: r.full_desc,
      rating: Number(r.rating) || 0,
      votes: r.votes || 0,
      country: r.country,
      city: r.city,
      deleg: r.deleg,
      zone: r.zone,
      mode: r.mode_kind,
      stage: r.stage,
      phone: r.phone,
      whatsapp: r.whatsapp,
      email: r.email,
      site: r.site,
      social: r.social,
      hours: r.hours,
      address: r.address,
      owner: r.owner_text,
      submittedBy: r.submitted_by,
      extra: r.extra,
      img: r.img,
      reviews: (r.reviews || []).map((rv) => ({ r: rv.r, t: rv.t })),
    };
  }
  function rowToProduct(r) {
    return {
      id: r.id,
      cat: r.cat,
      title: r.title,
      brand: r.brand,
      model: r.model,
      short: r.short_desc,
      full: r.full_desc,
      rating: Number(r.rating) || 0,
      votes: r.votes || 0,
      price: r.price,
      approx: r.approx,
      where: r.where_buy,
      link: r.link,
      mx: r.mx,
      tech: r.tech,
      country: r.country,
      city: r.city,
      deleg: r.deleg,
      zone: r.zone,
      img: r.img,
      reviews: (r.reviews || []).map((rv) => ({
        r: rv.r,
        t: rv.t,
        price: rv.price,
        pros: rv.pros,
        cons: rv.cons,
      })),
    };
  }
  function rowToCommunity(r) {
    return {
      id: r.id,
      cat: r.cat,
      type: r.type,
      title: r.title,
      short: r.short_desc,
      full: r.full_desc,
      user: r.user_alias,
      country: r.country,
      city: r.city,
      deleg: r.deleg,
      zone: r.zone,
      img: r.img,
      answers: (r.comments || [])
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map((c) => c.content),
    };
  }
  function rowToEvent(r) {
    return {
      id: r.id,
      cat: r.cat,
      title: r.title,
      short: r.short_desc,
      full: r.full_desc,
      date: r.event_date,
      time: r.event_time,
      mode: r.mode_kind,
      country: r.country,
      city: r.city,
      deleg: r.deleg,
      zone: r.zone,
      address: r.address,
      cost: r.cost,
      price: r.price,
      organizer: r.organizer,
      contact: r.contact,
      stage: r.stage,
      extra: r.extra,
      img: r.img,
    };
  }
  function rowToSecondhand(r) {
    return {
      id: r.id,
      cat: r.cat,
      title: r.title,
      brand: r.brand,
      model: r.model,
      short: r.short_desc,
      full: r.full_desc,
      price: r.price,
      state: r.state,
      country: r.country,
      city: r.city,
      deleg: r.deleg,
      zone: r.zone,
      available: r.available,
      extra: r.extra,
      user: r.user_alias,
      img: r.img,
    };
  }

  /* ============================================================
   * Carga inicial de datos desde Supabase
   * ============================================================ */

  async function loadAll() {
    try {
      const [dir, prod, com, eve, sec] = await Promise.all([
        sb
          .from("directory_items")
          .select("*, reviews(r,t)")
          .order("created_at", { ascending: false }),
        sb
          .from("products")
          .select("*, reviews(r,t,price,pros,cons)")
          .order("created_at", { ascending: false }),
        sb
          .from("community_items")
          .select("*, comments(content,created_at)")
          .order("created_at", { ascending: false }),
        sb
          .from("events")
          .select("*")
          .order("event_date", { ascending: true }),
        sb
          .from("secondhand_items")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (dir.data) window.data.directory = dir.data.map(rowToDirectory);
      if (prod.data) window.data.products = prod.data.map(rowToProduct);
      if (com.data) window.data.community = com.data.map(rowToCommunity);
      if (eve.data) window.data.events = eve.data.map(rowToEvent);
      if (sec.data) window.data.secondhand = sec.data.map(rowToSecondhand);
    } catch (e) {
      console.warn("[Muna] No se pudieron cargar datos iniciales:", e.message);
    }

    await loadFavorites();
    await loadMyPosts();
    await loadManaged();
    refreshCurrentPage();
  }

  async function loadFavorites() {
    if (!window.muna.session) return;
    const { data } = await sb
      .from("favorites")
      .select("target_id")
      .eq("user_id", window.muna.session.user.id);
    if (data) {
      window.favs.clear();
      data.forEach((row) => window.favs.add(row.target_id));
    }
  }

  async function loadMyPosts() {
    if (!window.muna.session) return;
    const uid = window.muna.session.user.id;
    const queries = await Promise.all([
      sb
        .from("products")
        .select("id,title")
        .eq("owner_user_id", uid),
      sb
        .from("community_items")
        .select("id,title")
        .eq("owner_user_id", uid),
      sb
        .from("events")
        .select("id,title")
        .eq("owner_user_id", uid),
      sb
        .from("secondhand_items")
        .select("id,title,available")
        .eq("owner_user_id", uid),
      sb
        .from("reviews")
        .select("id,t,target_type,target_id")
        .eq("reviewer_user_id", uid),
    ]);
    const out = [];
    (queries[0].data || []).forEach((p) =>
      out.push({
        type: "Productos",
        title: p.title,
        status: "Publicado",
        module: "products",
        id: p.id,
      })
    );
    (queries[1].data || []).forEach((p) =>
      out.push({
        type: "Comunidad",
        title: p.title,
        status: "Publicado",
        module: "community",
        id: p.id,
      })
    );
    (queries[2].data || []).forEach((p) =>
      out.push({
        type: "Eventos",
        title: p.title,
        status: "Publicado",
        module: "events",
        id: p.id,
      })
    );
    (queries[3].data || []).forEach((p) =>
      out.push({
        type: "Segunda mano",
        title: p.title,
        status: p.available === "Vendido" ? "Vendido" : "Disponible",
        module: "secondhand",
        id: p.id,
      })
    );
    (queries[4].data || []).forEach((p) =>
      out.push({
        type: "Reseñas",
        title: "Reseña: " + (p.t || "").slice(0, 40),
        status: "Publicada",
        module: p.target_type === "products" ? "products" : "directory",
        id: p.id,
      })
    );
    window.myPosts = out;
  }

  async function loadManaged() {
    if (!window.muna.session) return;
    const uid = window.muna.session.user.id;
    const { data } = await sb
      .from("directory_items")
      .select("id,title,status,verified")
      .or(`owner_user_id.eq.${uid},claimed_by_user_id.eq.${uid}`);
    if (!data) return;
    window.managed = data.map((d) => ({
      title: d.title,
      status:
        d.status === "pendiente"
          ? "Pendiente"
          : d.status === "con_sugerencias"
          ? "Con sugerencias"
          : "Activa",
      tag: d.verified
        ? "Verificada"
        : d.status === "pendiente"
        ? "Pendiente de aprobación"
        : "Activa",
      suggestions: "",
    }));
  }

  /* ============================================================
   * Sesión / auth
   * ============================================================ */

  async function applySession(session) {
    window.muna.session = session;
    if (session) {
      // Cargar perfil para el nombre/alias y avatar
      const { data: profile } = await sb
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      window.muna.profile = profile;
      if (profile) {
        const avatar = document.querySelector("#loggedActions .avatar");
        if (avatar) {
          const display =
            profile.first_name ||
            profile.username ||
            session.user.email.split("@")[0];
          const inits = String(display).charAt(0).toUpperCase();
          avatar.innerHTML = `<span>${inits}</span>${display}`;
        }
      }
      window.logged = true;
      window.setLogged(true);
    } else {
      window.muna.profile = null;
      window.logged = false;
      window.setLogged(false);
    }
  }

  /* ============================================================
   * Overrides de funciones globales
   * ============================================================ */

  const originalLogin = window.login;
  window.login = async function login() {
    const e = document.getElementById("loginEmail");
    const p = document.getElementById("loginPw");
    if (!e || !e.value || !p.value) {
      toast("Completa los campos obligatorios para continuar.");
      return;
    }
    const { data, error } = await sb.auth.signInWithPassword({
      email: e.value.trim(),
      password: p.value,
    });
    if (error) {
      const notice = document.getElementById("loginNotice");
      if (notice) notice.textContent = traduceError(error.message);
      toast(traduceError(error.message));
      return;
    }
    await applySession(data.session);
    await loadAll();
    window.show("homeLogged");
    toast("Sesión iniciada.");
  };

  const originalLogout = window.logout;
  window.logout = async function logout() {
    await sb.auth.signOut();
    await applySession(null);
    window.show("homePublic");
    toast("Sesión cerrada.");
  };

  const originalSignup = window.submitSignup;
  window.submitSignup = async function submitSignup() {
    window.toggleSignupCountry && window.toggleSignupCountry();
    if (
      !window.valid(".req-sign") ||
      !document.getElementById("termsOk").checked
    ) {
      window.signupError(
        "Completa los campos obligatorios para continuar."
      );
      return;
    }
    const pw = document.getElementById("spw").value;
    const pw2 = document.getElementById("spw2").value;
    if (pw !== pw2) {
      window.signupError("La contraseña y la confirmación no coinciden.");
      return;
    }
    // Tomamos campos por orden de aparición (mismo orden que el HTML)
    const inputs = document.querySelectorAll(
      "#signup .req-sign, #signup input.input:not(#spw):not(#spw2)"
    );
    const get = (i) =>
      inputs[i] ? inputs[i].value.trim() : "";
    const firstName = get(0);
    const paternal = get(1);
    const maternal = get(2);
    const username = get(3);
    const email = get(4);
    const phone =
      document
        .querySelector('#signup input[placeholder="Opcional"]')
        ?.value.trim() || null;

    const { data, error } = await sb.auth.signUp({
      email,
      password: pw,
      options: {
        data: { first_name: firstName, username },
        emailRedirectTo: window.location.href,
      },
    });
    if (error) {
      window.signupError(traduceError(error.message));
      return;
    }
    // Crear perfil (si la sesión ya está activa por confirmación automática)
    if (data.user) {
      await sb.from("profiles").upsert({
        id: data.user.id,
        username: username,
        first_name: firstName,
        paternal_surname: paternal,
        maternal_surname: maternal,
        email,
        phone,
      });
    }
    document.getElementById("signupMsg").innerHTML = "";
    document.getElementById("signupMsgEnd").innerHTML = "";
    window.show("checkEmail");
  };

  const originalFav = window.fav;
  window.fav = async function fav(id) {
    if (!window.logged) {
      window.needLogin("fav", "Inicia sesión para guardar favoritos.");
      return;
    }
    const uid = window.muna.session.user.id;
    const has = window.favs.has(id);
    if (has) {
      window.favs.delete(id);
      await sb
        .from("favorites")
        .delete()
        .eq("user_id", uid)
        .eq("target_id", id);
      toast("Eliminado de favoritos.");
    } else {
      window.favs.add(id);
      await sb.from("favorites").insert({ user_id: uid, target_id: id });
      toast("Agregado a favoritos.");
    }
    const active = document.querySelector(".page.active")?.id;
    if (active === "homeLogged") window.renderHomeEvents();
    else if (active === "module") window.renderModule();
    else if (active === "detail") window.openDetail(id);
  };

  window.submitReview = async function submitReview() {
    if (!window.logged) {
      window.needLogin("review", "Inicia sesión para reseñar.");
      return;
    }
    if (!window.reviewRating) {
      const m = document.getElementById("reviewMsg");
      if (m)
        m.innerHTML =
          '<div class="msg err">Selecciona una calificación.</div>';
      return;
    }
    if (!window.valid(".req-review")) {
      const m = document.getElementById("reviewMsg");
      if (m)
        m.innerHTML =
          '<div class="msg err">Completa los campos obligatorios para continuar.</div>';
      return;
    }
    const prod = window.currentModule === "products";
    const item =
      window.data[window.currentModule].find((x) => x.id === window.currentItemId) ||
      window.data[window.currentModule][0];
    const textarea = document.querySelector("#formBox textarea.req-review");
    const priceSel = document.querySelector("#formBox select.req-review");
    const prosTa = document.querySelectorAll("#formBox textarea.req-review")[1];
    const consTa = document.querySelectorAll("#formBox textarea.req-review")[2];
    const payload = {
      target_type: window.currentModule,
      target_id: item.id,
      reviewer_user_id: window.muna.session.user.id,
      r: window.reviewRating,
      t: textarea?.value.trim() || "",
    };
    if (prod) {
      payload.price = priceSel?.value || null;
      payload.pros = prosTa?.value.trim() || null;
      payload.cons = consTa?.value.trim() || null;
    }
    const { error } = await sb.from("reviews").insert(payload);
    if (error) {
      toast("No se pudo guardar: " + traduceError(error.message));
      return;
    }
    toast("Reseña publicada.");
    await loadAll();
    window.modulePage(window.currentModule);
  };

  window.addCommunityReply = async function addCommunityReply(id) {
    if (!window.logged) {
      window.needLogin("reply", "Inicia sesión para responder.");
      return;
    }
    const el = document.getElementById("communityReply");
    if (!el || !el.value.trim()) {
      toast("Escribe una respuesta para continuar.");
      return;
    }
    const { error } = await sb.from("comments").insert({
      target_type: "community",
      target_id: id,
      author_user_id: window.muna.session.user.id,
      content: el.value.trim(),
    });
    if (error) {
      toast("No se pudo publicar: " + traduceError(error.message));
      return;
    }
    toast("Respuesta publicada.");
    await loadAll();
    window.openDetail(id);
  };

  window.addSecondhandComment = async function addSecondhandComment() {
    if (!window.logged) {
      window.needLogin("comment", "Inicia sesión para comentar.");
      return;
    }
    const el = document.getElementById("secondhandComment");
    if (!el || !el.value.trim()) {
      toast("Escribe un comentario para continuar.");
      return;
    }
    const item = window.data.secondhand.find(
      (x) => x.id === window.currentItemId
    );
    if (!item) return;
    const { error } = await sb.from("comments").insert({
      target_type: "secondhand",
      target_id: item.id,
      author_user_id: window.muna.session.user.id,
      content: el.value.trim(),
    });
    if (error) {
      toast("No se pudo publicar: " + traduceError(error.message));
      return;
    }
    document
      .getElementById("secondhandComments")
      .insertAdjacentHTML(
        "beforeend",
        `<div class="review"><strong>@${
          window.muna.profile?.username || "tu"
        }:</strong> ${el.value.trim()}</div>`
      );
    el.value = "";
    toast("Comentario publicado.");
  };

  /* ============================================================
   * Publicación / crear contenido (submitGeneric)
   * ============================================================ */

  function readFormFields() {
    const box = document.getElementById("formBox");
    const inputs = [...box.querySelectorAll("input:not([type=file])")];
    const selects = [...box.querySelectorAll("select")];
    const tas = [...box.querySelectorAll("textarea")];
    const fileEl = box.querySelector('input[type="file"]');
    return { inputs, selects, tas, fileEl };
  }

  async function uploadFirstImage(bucket, prefix) {
    const file = document
      .querySelector('#formBox input[type="file"]')
      ?.files?.[0];
    if (!file) return null;
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${prefix}/${window.muna.session.user.id}/${Date.now()}.${ext}`;
    const { error } = await sb.storage.from(bucket).upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      console.warn("[Muna] Upload error:", error.message);
      return null;
    }
    const { data } = sb.storage.from(bucket).getPublicUrl(filename);
    return data?.publicUrl || null;
  }

  function newId(module) {
    return `${module}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
  }

  window.submitGeneric = async function submitGeneric(kind) {
    if (!window.logged) {
      window.needLogin("create", "Inicia sesión para publicar.");
      return;
    }
    if (!window.valid(".req-g")) {
      const m = document.getElementById("genericMsg");
      if (m)
        m.innerHTML =
          '<div class="msg err">Completa los campos obligatorios para continuar.</div>';
      return;
    }
    const { inputs, selects, tas } = readFormFields();
    const uid = window.muna.session.user.id;
    const id = newId(kind);
    let imgUrl = null;
    try {
      imgUrl = await uploadFirstImage("muna-public", kind);
    } catch (_) {}

    let payload = { id, img: imgUrl, owner_user_id: uid };
    if (kind === "directory") {
      payload = {
        ...payload,
        title: inputs[0]?.value,
        cat: selects[1]?.value,
        stage: selects[2]?.value,
        short_desc: inputs[1]?.value,
        mode_kind: selects[3]?.value,
        country: selects[4]?.value,
        city: selects[5]?.value,
        deleg: selects[6]?.value,
        zone: inputs[2]?.value,
        address: inputs[3]?.value,
        phone: inputs[4]?.value,
        whatsapp: inputs[5]?.value,
        email: inputs[6]?.value,
        site: inputs[7]?.value,
        social: inputs[8]?.value,
        hours: inputs[9]?.value,
        owner_text: selects[7]?.value,
        full_desc: tas[0]?.value,
        extra: tas[1]?.value,
        submitted_by: "@" + (window.muna.profile?.username || "usuaria"),
        status: "pendiente",
      };
      await sb.from("directory_items").insert(payload);
    } else if (kind === "products") {
      payload = {
        ...payload,
        title: inputs[0]?.value,
        brand: inputs[1]?.value,
        model: inputs[2]?.value,
        cat: selects[0]?.value,
        short_desc: inputs[3]?.value,
        price: selects[1]?.value,
        approx: inputs[4]?.value,
        where_buy: inputs[5]?.value,
        link: inputs[6]?.value,
        mx: selects[2]?.value,
        country: selects[3]?.value,
        city: selects[4]?.value,
        deleg: selects[5]?.value,
        zone: inputs[7]?.value,
        full_desc: tas[0]?.value,
        tech: tas[1]?.value,
      };
      await sb.from("products").insert(payload);
    } else if (kind === "community") {
      payload = {
        ...payload,
        type: selects[0]?.value,
        title: inputs[0]?.value,
        cat: selects[1]?.value,
        country: selects[2]?.value,
        city: selects[3]?.value,
        deleg: selects[4]?.value,
        zone: inputs[1]?.value,
        full_desc: tas[0]?.value,
        short_desc: (tas[0]?.value || "").slice(0, 140),
        user_alias: "@" + (window.muna.profile?.username || "usuaria"),
      };
      await sb.from("community_items").insert(payload);
    } else if (kind === "events") {
      payload = {
        ...payload,
        title: inputs[0]?.value,
        cat: selects[0]?.value,
        short_desc: inputs[1]?.value,
        event_date: inputs[2]?.value || null,
        event_time: inputs[3]?.value || null,
        mode_kind: selects[1]?.value,
        country: selects[2]?.value,
        city: selects[3]?.value,
        deleg: selects[4]?.value,
        zone: inputs[4]?.value,
        address: inputs[5]?.value,
        cost: inputs[7]?.value,
        price: inputs[8]?.value,
        organizer: inputs[9]?.value,
        contact: inputs[10]?.value,
        stage: inputs[11]?.value,
        full_desc: tas[0]?.value,
        extra: tas[1]?.value,
      };
      await sb.from("events").insert(payload);
    } else if (kind === "secondhand") {
      payload = {
        ...payload,
        title: inputs[0]?.value,
        cat: selects[0]?.value,
        brand: inputs[1]?.value,
        model: inputs[2]?.value,
        short_desc: inputs[3]?.value,
        price: inputs[4]?.value,
        state: selects[1]?.value,
        country: selects[3]?.value,
        city: selects[4]?.value,
        deleg: selects[5]?.value,
        zone: inputs[5]?.value,
        full_desc: tas[0]?.value,
        extra: tas[1]?.value,
        available: "Disponible",
        user_alias: "@" + (window.muna.profile?.username || "usuaria"),
      };
      await sb.from("secondhand_items").insert(payload);
    }

    toast(window.modules[kind].create + " publicado.");
    await loadAll();
    window.modulePage(kind);
  };

  /* ============================================================
   * Mis publicaciones - eliminar / vendido
   * ============================================================ */

  window.deletePost = async function deletePost(i) {
    if (!confirm("¿Estás seguro que deseas eliminar?")) return;
    const p = window.myPosts[i];
    const tableMap = {
      products: "products",
      community: "community_items",
      events: "events",
      secondhand: "secondhand_items",
      directory: "directory_items",
    };
    const table = tableMap[p.module];
    if (p.module === "directory" && p.type === "Reseñas") {
      await sb.from("reviews").delete().eq("id", p.id);
    } else if (table) {
      await sb.from(table).delete().eq("id", p.id);
    }
    toast("Publicación eliminada.");
    await loadAll();
    window.renderMyPosts();
  };

  window.soldPost = async function soldPost(i) {
    const p = window.myPosts[i];
    if (p.module !== "secondhand") return;
    await sb
      .from("secondhand_items")
      .update({ available: "Vendido" })
      .eq("id", p.id);
    toast("Artículo marcado como vendido.");
    await loadAll();
    window.renderMyPosts();
  };

  /* ============================================================
   * Mensajes / conversaciones
   * ============================================================ */

  window.contactSeller = async function contactSeller(user, title) {
    if (!window.logged) {
      window.needLogin("message", "Inicia sesión para enviar mensajes.");
      return;
    }
    window.show("messages");
    const ctxItem = window.data.secondhand.find((x) => x.title === title);
    const sellerAlias = ctxItem?.user || user;
    document.getElementById("chat").innerHTML = `
      <div class="chat-meta">
        <div class="chat-meta-row"><span class="label">DE:</span><div class="value"><strong>Nuevo mensaje para</strong> <span class="muted">${sellerAlias}</span></div></div>
        <div class="chat-meta-row"><span class="label">TÍTULO:</span><div class="value chat-title">${title}</div></div>
      </div>
      <div class="field"><label>Mensaje</label><textarea id="newConvBody" placeholder="Hola, me interesa este artículo..."></textarea></div>
      <button class="btn" onclick="window.sendNewMessage('${
        ctxItem?.id || ""
      }','${title.replaceAll("'", "\\'")}','${sellerAlias}')">Enviar mensaje</button>
    `;
  };

  window.sendNewMessage = async function sendNewMessage(
    targetId,
    title,
    sellerAlias
  ) {
    const body = document.getElementById("newConvBody")?.value.trim();
    if (!body) {
      toast("Escribe un mensaje para continuar.");
      return;
    }
    const myId = window.muna.session.user.id;
    // Buscamos perfil del vendedor por alias
    const { data: sellerProfile } = await sb
      .from("profiles")
      .select("id")
      .eq("username", sellerAlias.replace(/^@/, ""))
      .maybeSingle();
    const otherId = sellerProfile?.id || null;
    if (!otherId) {
      toast("No se encontró a la persona destinataria.");
      return;
    }
    const convId = `${myId}_${otherId}_${targetId || "ctx"}`.slice(0, 80);
    await sb.from("conversations").upsert({
      id: convId,
      user_a: myId,
      user_b: otherId,
      title,
      context_id: targetId || null,
      context_type: targetId ? "secondhand" : null,
    });
    await sb.from("messages").insert({
      conversation_id: convId,
      sender_user_id: myId,
      content: body,
    });
    toast("Mensaje enviado.");
    await loadConversationsInbox();
  };

  async function loadConversationsInbox() {
    if (!window.muna.session) return;
    const uid = window.muna.session.user.id;
    const { data } = await sb
      .from("conversations")
      .select("*")
      .or(`user_a.eq.${uid},user_b.eq.${uid}`)
      .order("last_message_at", { ascending: false });
    if (!data) return;
    window.muna.conversations = data;
    // No rehago el HTML de la bandeja; el original ya muestra ejemplos.
    // Solo expongo para conv() si quieren extender. Mantengo intacto el diseño.
  }

  const originalConv = window.conv;
  window.conv = async function conv(key) {
    // Si key coincide con una conversación real (id), cargamos sus mensajes.
    const real = (window.muna.conversations || []).find((c) => c.id === key);
    if (!real) {
      // Fallback al comportamiento original (conversaciones de ejemplo)
      return originalConv && originalConv(key);
    }
    const { data: msgs } = await sb
      .from("messages")
      .select("*")
      .eq("conversation_id", real.id)
      .order("created_at", { ascending: true });
    const myId = window.muna.session.user.id;
    const otherId = real.user_a === myId ? real.user_b : real.user_a;
    const { data: other } = await sb
      .from("profiles")
      .select("username,first_name")
      .eq("id", otherId)
      .maybeSingle();
    const otherName = other?.first_name || other?.username || "Usuaria";
    document.getElementById("chat").innerHTML =
      `<div class="chat-meta"><div class="chat-meta-row"><span class="label">DE:</span><div class="value"><strong>${otherName}</strong> <span class="muted">@${
        other?.username || ""
      }</span></div></div><div class="chat-meta-row"><span class="label">TÍTULO:</span><div class="value chat-title">${
        real.title || ""
      }</div></div></div>` +
      (msgs || [])
        .map(
          (m) =>
            `<div class="bubble ${
              m.sender_user_id === myId ? "me" : ""
            }">${m.content}</div>`
        )
        .join("") +
      `<div class="field"><label>Responder</label><textarea id="replyBody" placeholder="Escribe una respuesta..."></textarea></div><button class="btn" onclick="window.sendReply('${real.id}')">Enviar</button>`;
  };

  window.sendReply = async function sendReply(convId) {
    const body = document.getElementById("replyBody")?.value.trim();
    if (!body) return;
    await sb.from("messages").insert({
      conversation_id: convId,
      sender_user_id: window.muna.session.user.id,
      content: body,
    });
    await sb
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", convId);
    window.conv(convId);
  };

  /* ============================================================
   * Reset password
   * ============================================================ */

  // Override del botón "Enviar enlace" en el formulario de reset
  document.addEventListener("click", async (ev) => {
    if (
      ev.target?.matches('#reset button[onclick*="checkEmail"]') ||
      ev.target?.matches('#reset .btn')
    ) {
      const input = document.querySelector("#reset input.input");
      const email = input?.value.trim();
      if (!email) return;
      ev.preventDefault();
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        toast(traduceError(error.message));
        return;
      }
      window.show("checkEmail");
    }
  });

  /* ============================================================
   * openDetail / currentItemId tracking
   * ============================================================ */

  const originalOpenDetail = window.openDetail;
  window.openDetail = function openDetail(id) {
    window.currentItemId = id;
    return originalOpenDetail.apply(this, arguments);
  };

  /* ============================================================
   * Mensajes de error traducidos
   * ============================================================ */

  function traduceError(msg) {
    const m = (msg || "").toLowerCase();
    if (m.includes("invalid login")) return "Correo o contraseña incorrectos.";
    if (m.includes("user already")) return "Ya existe una cuenta con ese correo.";
    if (m.includes("email not confirmed"))
      return "Confirma tu correo antes de iniciar sesión.";
    if (m.includes("password should")) return "La contraseña es muy corta.";
    if (m.includes("network")) return "Problema de red. Intenta de nuevo.";
    return msg || "Ocurrió un error. Intenta de nuevo.";
  }

  /* ============================================================
   * Arranque
   * ============================================================ */

  (async function start() {
    const { data } = await sb.auth.getSession();
    await applySession(data?.session || null);
    await loadAll();

    sb.auth.onAuthStateChange(async (_event, session) => {
      await applySession(session);
      await loadAll();
    });
  })();
})();
