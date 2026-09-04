(() => {
  "use strict";

  const config = window.__APP_CONFIG__ || {};
  const isConfigured =
    /^https:\/\/.+\.supabase\.co$/i.test(config.SUPABASE_URL || "") &&
    Boolean(config.SUPABASE_ANON_KEY) &&
    !String(config.SUPABASE_ANON_KEY).includes("SUA_SUPABASE");

  const translations = {
    "pt-BR": {
      nav: {
        home: "Catalogo",
        homeShort: "Catalogo",
        favorites: "Meus favoritos",
        favoritesShort: "Favoritos",
        profile: "Perfil",
        admin: "Painel admin",
      },
      common: {
        direct: "Download direto",
        cancel: "Cancelar",
        delete: "Excluir",
        all: "Todas",
        loading: "Carregando...",
        signOut: "Sair da conta",
        tryAgain: "Tentar novamente",
      },
      language: { label: "Idioma" },
      search: { placeholder: "Buscar estruturas..." },
      hero: {
        eyebrow: "Blueprints sem limites",
        title: "Construa grande. <span>Baixe agora.</span>",
        subtitle:
          "Estruturas selecionadas para Minecraft em um unico pacote compativel com Holoprint e MCStructure.",
        badge: "Arquivo unificado",
        demo:
          "Modo demonstracao: conecte o Supabase em config.js para carregar seu catalogo real.",
      },
      catalog: {
        title: "Estruturas em destaque",
        result: "{count} estruturas prontas para construir",
        emptyTitle: "Nenhuma estrutura encontrada",
        emptyText: "Tente outro termo ou limpe o filtro atual.",
        clear: "Limpar busca",
        noItemsTitle: "Seu catalogo esta pronto para receber estruturas",
        noItemsText: "Acesse o painel admin e publique o primeiro arquivo unificado.",
      },
      card: {
        description: "Pacote completo com os dois formatos de estrutura no mesmo download.",
        favorite: "Adicionar aos favoritos",
        unfavorite: "Remover dos favoritos",
        download: "Baixar {format}",
      },
      favorites: {
        eyebrow: "Sua colecao",
        title: "Meus favoritos",
        subtitle: "As estruturas que voce salvou ficam reunidas aqui.",
        count: "{count} salvos",
        emptyTitle: "Nenhum favorito por enquanto",
        emptyText: "Toque no coracao de uma estrutura para guardar aqui.",
        explore: "Explorar catalogo",
      },
      profile: {
        eyebrow: "Sua atividade",
        title: "Perfil",
        subtitle: "Favoritos e downloads recentes sincronizados com sua conta.",
        member: "Membro",
        admin: "Administrador",
        favorites: "Favoritos",
        downloads: "Downloads",
        recentDownloads: "Downloads recentes",
        recentFavorites: "Favoritos recentes",
        viewAll: "Ver todos",
        noDownloads: "Seus downloads recentes aparecerao aqui.",
        noFavorites: "Seus favoritos recentes aparecerao aqui.",
        downloadedAs: "Baixado como {format}",
        saved: "Estrutura salva",
      },
      auth: {
        eyebrow: "Sua biblioteca",
        title: "Entre para salvar estruturas",
        subtitle: "Sincronize favoritos e acompanhe seus downloads.",
        loginTab: "Entrar",
        signupTab: "Criar conta",
        name: "Seu nome",
        email: "E-mail",
        password: "Senha",
        signIn: "Entrar",
        signUp: "Criar minha conta",
        account: "Minha conta",
        confirmEmail: "Conta criada. Confira seu e-mail para confirmar o acesso.",
        welcome: "Acesso liberado. Bem-vindo!",
        configNeeded: "Conecte o Supabase antes de usar contas.",
      },
      admin: {
        eyebrow: "Gestao do catalogo",
        title: "Painel administrativo",
        subtitle: "Publique estruturas com um unico arquivo para os dois formatos.",
        formTitle: "Nova estrutura",
        editTitle: "Editar estrutura",
        formText: "Tres campos. Um arquivo. Dois botoes de download.",
        name: "Nome da estrutura",
        namePlaceholder: "Ex.: Castelo da Montanha",
        thumbnail: "Imagem / thumbnail",
        thumbnailHelp: "JPG, PNG ou WebP com ate 5 MB.",
        downloadUrl: "Link unico de download",
        downloadPlaceholder: "https://...",
        downloadHelp: "Holoprint e MCStructure usarao exatamente este mesmo link.",
        publish: "Publicar estrutura",
        save: "Salvar alteracoes",
        reset: "Cancelar edicao",
        listTitle: "Itens publicados",
        listText: "Gerencie as estruturas visiveis no catalogo.",
        empty: "Nenhuma estrutura publicada.",
        edit: "Editar",
        delete: "Excluir",
        deleteTitle: "Excluir estrutura?",
        deleteText: "Essa acao remove o item do catalogo e nao pode ser desfeita.",
        restrictedTitle: "Area exclusiva do administrador",
        restrictedText: "A permissao e validada pela role do seu perfil no Supabase.",
        loginText: "Entre com a conta de administrador para continuar.",
      },
      toast: {
        favoriteAdded: "Estrutura adicionada aos favoritos.",
        favoriteRemoved: "Estrutura removida dos favoritos.",
        loginRequired: "Entre para salvar favoritos e historico.",
        demoDownload: "Adicione um link real pelo painel admin para iniciar o download.",
        downloadStarted: "Download direto iniciado.",
        itemSaved: "Estrutura publicada com sucesso.",
        itemUpdated: "Estrutura atualizada com sucesso.",
        itemDeleted: "Estrutura excluida.",
        invalidImage: "Escolha uma imagem JPG, PNG ou WebP de ate 5 MB.",
        invalidUrl: "Informe um link de download HTTPS valido.",
        genericError: "Nao foi possivel concluir. Tente novamente.",
      },
    },
    en: {
      nav: {
        home: "Catalog",
        homeShort: "Catalog",
        favorites: "My favorites",
        favoritesShort: "Favorites",
        profile: "Profile",
        admin: "Admin panel",
      },
      common: {
        direct: "Direct download",
        cancel: "Cancel",
        delete: "Delete",
        all: "All",
        loading: "Loading...",
        signOut: "Sign out",
        tryAgain: "Try again",
      },
      language: { label: "Language" },
      search: { placeholder: "Search structures..." },
      hero: {
        eyebrow: "Blueprints without limits",
        title: "Build big. <span>Download now.</span>",
        subtitle:
          "Curated Minecraft structures in one package compatible with Holoprint and MCStructure.",
        badge: "Unified file",
        demo: "Demo mode: connect Supabase in config.js to load your live catalog.",
      },
      catalog: {
        title: "Featured structures",
        result: "{count} structures ready to build",
        emptyTitle: "No structures found",
        emptyText: "Try another search or clear the current filter.",
        clear: "Clear search",
        noItemsTitle: "Your catalog is ready for structures",
        noItemsText: "Open the admin panel and publish the first unified file.",
      },
      card: {
        description: "Complete package with both structure formats in the same download.",
        favorite: "Add to favorites",
        unfavorite: "Remove from favorites",
        download: "Download {format}",
      },
      favorites: {
        eyebrow: "Your collection",
        title: "My favorites",
        subtitle: "Every structure you save is gathered here.",
        count: "{count} saved",
        emptyTitle: "No favorites yet",
        emptyText: "Tap the heart on a structure to keep it here.",
        explore: "Explore catalog",
      },
      profile: {
        eyebrow: "Your activity",
        title: "Profile",
        subtitle: "Favorites and recent downloads synced with your account.",
        member: "Member",
        admin: "Administrator",
        favorites: "Favorites",
        downloads: "Downloads",
        recentDownloads: "Recent downloads",
        recentFavorites: "Recent favorites",
        viewAll: "View all",
        noDownloads: "Your recent downloads will appear here.",
        noFavorites: "Your recent favorites will appear here.",
        downloadedAs: "Downloaded as {format}",
        saved: "Saved structure",
      },
      auth: {
        eyebrow: "Your library",
        title: "Sign in to save structures",
        subtitle: "Sync favorites and keep track of your downloads.",
        loginTab: "Sign in",
        signupTab: "Create account",
        name: "Your name",
        email: "Email",
        password: "Password",
        signIn: "Sign in",
        signUp: "Create my account",
        account: "My account",
        confirmEmail: "Account created. Check your email to confirm access.",
        welcome: "Access granted. Welcome!",
        configNeeded: "Connect Supabase before using accounts.",
      },
      admin: {
        eyebrow: "Catalog management",
        title: "Admin panel",
        subtitle: "Publish structures with one file for both formats.",
        formTitle: "New structure",
        editTitle: "Edit structure",
        formText: "Three fields. One file. Two download buttons.",
        name: "Structure name",
        namePlaceholder: "Example: Mountain Castle",
        thumbnail: "Image / thumbnail",
        thumbnailHelp: "JPG, PNG or WebP up to 5 MB.",
        downloadUrl: "Single download link",
        downloadPlaceholder: "https://...",
        downloadHelp: "Holoprint and MCStructure will use this exact same link.",
        publish: "Publish structure",
        save: "Save changes",
        reset: "Cancel editing",
        listTitle: "Published items",
        listText: "Manage structures visible in the catalog.",
        empty: "No structures published.",
        edit: "Edit",
        delete: "Delete",
        deleteTitle: "Delete structure?",
        deleteText: "This removes the item from the catalog and cannot be undone.",
        restrictedTitle: "Administrator-only area",
        restrictedText: "Permission is validated from your Supabase profile role.",
        loginText: "Sign in with the administrator account to continue.",
      },
      toast: {
        favoriteAdded: "Structure added to favorites.",
        favoriteRemoved: "Structure removed from favorites.",
        loginRequired: "Sign in to save favorites and history.",
        demoDownload: "Add a real link in the admin panel to start the download.",
        downloadStarted: "Direct download started.",
        itemSaved: "Structure published successfully.",
        itemUpdated: "Structure updated successfully.",
        itemDeleted: "Structure deleted.",
        invalidImage: "Choose a JPG, PNG or WebP image up to 5 MB.",
        invalidUrl: "Enter a valid HTTPS download link.",
        genericError: "Could not complete the action. Try again.",
      },
    },
    es: {
      nav: {
        home: "Catalogo",
        homeShort: "Catalogo",
        favorites: "Mis favoritos",
        favoritesShort: "Favoritos",
        profile: "Perfil",
        admin: "Panel admin",
      },
      common: {
        direct: "Descarga directa",
        cancel: "Cancelar",
        delete: "Eliminar",
        all: "Todas",
        loading: "Cargando...",
        signOut: "Cerrar sesion",
        tryAgain: "Reintentar",
      },
      language: { label: "Idioma" },
      search: { placeholder: "Buscar estructuras..." },
      hero: {
        eyebrow: "Planos sin limites",
        title: "Construye en grande. <span>Descarga ahora.</span>",
        subtitle:
          "Estructuras seleccionadas para Minecraft en un solo paquete compatible con Holoprint y MCStructure.",
        badge: "Archivo unificado",
        demo: "Modo demo: conecta Supabase en config.js para cargar tu catalogo real.",
      },
      catalog: {
        title: "Estructuras destacadas",
        result: "{count} estructuras listas para construir",
        emptyTitle: "No encontramos estructuras",
        emptyText: "Prueba otra busqueda o limpia el filtro actual.",
        clear: "Limpiar busqueda",
        noItemsTitle: "Tu catalogo esta listo para nuevas estructuras",
        noItemsText: "Abre el panel admin y publica el primer archivo unificado.",
      },
      card: {
        description: "Paquete completo con los dos formatos en la misma descarga.",
        favorite: "Agregar a favoritos",
        unfavorite: "Quitar de favoritos",
        download: "Descargar {format}",
      },
      favorites: {
        eyebrow: "Tu coleccion",
        title: "Mis favoritos",
        subtitle: "Todas las estructuras que guardes estaran aqui.",
        count: "{count} guardados",
        emptyTitle: "Aun no tienes favoritos",
        emptyText: "Pulsa el corazon de una estructura para guardarla aqui.",
        explore: "Explorar catalogo",
      },
      profile: {
        eyebrow: "Tu actividad",
        title: "Perfil",
        subtitle: "Favoritos y descargas recientes sincronizados con tu cuenta.",
        member: "Miembro",
        admin: "Administrador",
        favorites: "Favoritos",
        downloads: "Descargas",
        recentDownloads: "Descargas recientes",
        recentFavorites: "Favoritos recientes",
        viewAll: "Ver todos",
        noDownloads: "Tus descargas recientes apareceran aqui.",
        noFavorites: "Tus favoritos recientes apareceran aqui.",
        downloadedAs: "Descargado como {format}",
        saved: "Estructura guardada",
      },
      auth: {
        eyebrow: "Tu biblioteca",
        title: "Entra para guardar estructuras",
        subtitle: "Sincroniza favoritos y revisa tus descargas.",
        loginTab: "Entrar",
        signupTab: "Crear cuenta",
        name: "Tu nombre",
        email: "Correo",
        password: "Contrasena",
        signIn: "Entrar",
        signUp: "Crear mi cuenta",
        account: "Mi cuenta",
        confirmEmail: "Cuenta creada. Revisa tu correo para confirmar el acceso.",
        welcome: "Acceso concedido. Bienvenido.",
        configNeeded: "Conecta Supabase antes de usar cuentas.",
      },
      admin: {
        eyebrow: "Gestion del catalogo",
        title: "Panel administrativo",
        subtitle: "Publica estructuras con un archivo para ambos formatos.",
        formTitle: "Nueva estructura",
        editTitle: "Editar estructura",
        formText: "Tres campos. Un archivo. Dos botones de descarga.",
        name: "Nombre de la estructura",
        namePlaceholder: "Ej.: Castillo de la Montana",
        thumbnail: "Imagen / miniatura",
        thumbnailHelp: "JPG, PNG o WebP de hasta 5 MB.",
        downloadUrl: "Enlace unico de descarga",
        downloadPlaceholder: "https://...",
        downloadHelp: "Holoprint y MCStructure usaran exactamente este enlace.",
        publish: "Publicar estructura",
        save: "Guardar cambios",
        reset: "Cancelar edicion",
        listTitle: "Items publicados",
        listText: "Gestiona las estructuras visibles en el catalogo.",
        empty: "No hay estructuras publicadas.",
        edit: "Editar",
        delete: "Eliminar",
        deleteTitle: "Eliminar estructura?",
        deleteText: "Esta accion elimina el item y no se puede deshacer.",
        restrictedTitle: "Area exclusiva del administrador",
        restrictedText: "El permiso se valida con el rol del perfil en Supabase.",
        loginText: "Entra con la cuenta administradora para continuar.",
      },
      toast: {
        favoriteAdded: "Estructura agregada a favoritos.",
        favoriteRemoved: "Estructura eliminada de favoritos.",
        loginRequired: "Entra para guardar favoritos e historial.",
        demoDownload: "Agrega un enlace real desde el panel admin.",
        downloadStarted: "Descarga directa iniciada.",
        itemSaved: "Estructura publicada correctamente.",
        itemUpdated: "Estructura actualizada correctamente.",
        itemDeleted: "Estructura eliminada.",
        invalidImage: "Elige una imagen JPG, PNG o WebP de hasta 5 MB.",
        invalidUrl: "Introduce un enlace HTTPS valido.",
        genericError: "No se pudo completar. Intentalo otra vez.",
      },
    },
  };

  const demoItems = [
    { id: "demo-1", name: "Pagode Carmesim", atlasIndex: 0 },
    { id: "demo-2", name: "Fortaleza Obsidiana", atlasIndex: 1 },
    { id: "demo-3", name: "Casa Sakura", atlasIndex: 2 },
    { id: "demo-4", name: "Laboratorio Redstone", atlasIndex: 3 },
    { id: "demo-5", name: "Porto Nordico", atlasIndex: 4 },
    { id: "demo-6", name: "Templo do Deserto", atlasIndex: 5 },
  ].map((item, index) => ({
    ...item,
    slug: `estrutura-demo-${index + 1}`,
    description: "",
    formats: ["Holoprint", "MCStructure"],
    download_url: "#",
    image_url: "",
    created_at: new Date(Date.now() - index * 86_400_000).toISOString(),
    demo: true,
  }));

  const state = {
    language: localStorage.getItem("guizz-language") || "pt-BR",
    route: "home",
    search: "",
    filter: "all",
    session: null,
    profile: null,
    items: [],
    favoriteIds: new Set(),
    favoriteDates: new Map(),
    downloads: [],
    loading: true,
    editingItemId: null,
    pendingDeleteId: null,
    authMode: "login",
  };

  let supabaseClient = null;
  const app = document.getElementById("app");
  const authDialog = document.getElementById("auth-dialog");
  const confirmDialog = document.getElementById("confirm-dialog");

  function t(path, values = {}) {
    const dictionary = translations[state.language] || translations["pt-BR"];
    const value = path.split(".").reduce((current, key) => current?.[key], dictionary);
    const fallback = path
      .split(".")
      .reduce((current, key) => current?.[key], translations["pt-BR"]);
    return String(value ?? fallback ?? path).replace(/\{(\w+)\}/g, (_, key) =>
      values[key] === undefined ? `{${key}}` : String(values[key]),
    );
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeHttpUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
    } catch {
      return "";
    }
  }

  function slugify(value) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 72);
  }

  function localeCode() {
    return state.language === "pt-BR" ? "pt-BR" : state.language;
  }

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat(localeCode(), {
      day: "2-digit",
      month: "short",
    }).format(new Date(value));
  }

  function getRoute() {
    const route = window.location.hash.replace(/^#\//, "").split("?")[0] || "home";
    return ["home", "favorites", "profile", "admin"].includes(route) ? route : "home";
  }

  function refreshIcons() {
    window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });
  }

  function applyStaticTranslations() {
    document.documentElement.lang = state.language;
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    });
    document.getElementById("language-select").value = state.language;
    updateAccountButton();
  }

  function updateAccountButton() {
    const button = document.getElementById("account-button");
    if (!button) return;
    const label = state.session ? t("auth.account") : t("auth.signIn");
    button.innerHTML = `<i data-lucide="${state.session ? "user-round" : "log-in"}"></i><span>${escapeHtml(label)}</span>`;
  }

  function updateAdminVisibility() {
    const isAdmin = state.profile?.role === "admin";
    document.querySelectorAll(".admin-nav").forEach((element) => {
      element.classList.toggle("is-hidden", !isAdmin);
    });
  }

  function updateActiveNavigation() {
    document.querySelectorAll("[data-route]").forEach((link) => {
      link.classList.toggle("active", link.dataset.route === state.route);
    });
  }

  function renderSkeleton() {
    app.innerHTML = `
      <div class="page">
        <div class="catalog-hero"></div>
        <div class="catalog-toolbar"><div class="section-title"><h2>${escapeHtml(
          t("common.loading"),
        )}</h2></div></div>
        <div class="items-grid">${Array.from({ length: 6 }, () => '<div class="skeleton"></div>').join("")}</div>
      </div>`;
  }

  function mediaMarkup(item, compact = false) {
    if (item.demo) {
      return `<div class="${compact ? "activity-thumb " : ""}atlas-image atlas-${Number(item.atlasIndex) || 0}" role="img" aria-label="${escapeHtml(item.name)}"></div>`;
    }
    const image = safeHttpUrl(item.image_url);
    return `<img${compact ? ' class="activity-thumb"' : ""} src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async" />`;
  }

  function itemCard(item) {
    const isFavorite = state.favoriteIds.has(item.id);
    const downloadUrl = item.demo ? "#" : safeHttpUrl(item.download_url);
    const favoriteLabel = t(isFavorite ? "card.unfavorite" : "card.favorite");
    const description = item.description || t("card.description");
    const formats = Array.isArray(item.formats) && item.formats.length
      ? item.formats
      : ["Holoprint", "MCStructure"];

    return `
      <article class="item-card" data-card-id="${escapeHtml(item.id)}">
        <div class="card-media">
          ${mediaMarkup(item)}
          <button class="favorite-button${isFavorite ? " active" : ""}" type="button" data-favorite-id="${escapeHtml(
            item.id,
          )}" aria-label="${escapeHtml(favoriteLabel)}" title="${escapeHtml(favoriteLabel)}">
            <i data-lucide="heart"></i>
          </button>
          <div class="media-meta">
            ${formats.slice(0, 2).map((format) => `<span class="tag">${escapeHtml(format)}</span>`).join("")}
          </div>
        </div>
        <div class="card-body">
          <h3 title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(description)}</p>
          <div class="download-actions">
            <a class="download-button" href="${escapeHtml(downloadUrl)}" target="_blank" rel="noopener noreferrer" data-download-id="${escapeHtml(
              item.id,
            )}" data-format="holoprint" aria-label="${escapeHtml(t("card.download", { format: "Holoprint" }))}">
              <i data-lucide="box"></i><span>Holoprint</span>
            </a>
            <a class="download-button" href="${escapeHtml(downloadUrl)}" target="_blank" rel="noopener noreferrer" data-download-id="${escapeHtml(
              item.id,
            )}" data-format="mcstructure" aria-label="${escapeHtml(t("card.download", { format: "MCStructure" }))}">
              <i data-lucide="blocks"></i><span>MCStructure</span>
            </a>
          </div>
        </div>
      </article>`;
  }

  function filteredItems(items = state.items) {
    const query = state.search.trim().toLocaleLowerCase(localeCode());
    return items.filter((item) => {
      const matchesSearch = !query || `${item.name} ${item.description || ""}`.toLocaleLowerCase(localeCode()).includes(query);
      const formats = (item.formats || ["Holoprint", "MCStructure"]).map((format) => format.toLowerCase());
      const matchesFilter =
        state.filter === "all" ||
        (state.filter === "holoprint" && formats.includes("holoprint")) ||
        (state.filter === "mcstructure" && formats.includes("mcstructure"));
      return matchesSearch && matchesFilter;
    });
  }

  function renderEmptyState(kind) {
    const isSearch = kind === "search";
    const isFavorites = kind === "favorites";
    const title = isSearch
      ? t("catalog.emptyTitle")
      : isFavorites
        ? t("favorites.emptyTitle")
        : t("catalog.noItemsTitle");
    const text = isSearch
      ? t("catalog.emptyText")
      : isFavorites
        ? t("favorites.emptyText")
        : t("catalog.noItemsText");
    const href = isFavorites ? "#/home" : "#/home";
    const label = isSearch ? t("catalog.clear") : isFavorites ? t("favorites.explore") : t("nav.admin");
    const action = !isSearch && !isFavorites && state.profile?.role === "admin" ? "#/admin" : href;

    return `
      <div class="empty-state">
        <div class="empty-icon"><i data-lucide="${isFavorites ? "heart" : isSearch ? "search-x" : "box"}"></i></div>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
        <a class="secondary-button" href="${action}" ${isSearch ? 'data-clear-search="true"' : ""}>
          ${escapeHtml(label)}<i data-lucide="arrow-right"></i>
        </a>
      </div>`;
  }

  function renderHome() {
    const items = filteredItems();
    const hasCatalogItems = state.items.length > 0;
    app.innerHTML = `
      <div class="page">
        <section class="catalog-hero" aria-labelledby="catalog-title">
          <div class="hero-copy">
            <span class="eyebrow">${escapeHtml(t("hero.eyebrow"))}</span>
            <h1 id="catalog-title">${t("hero.title")}</h1>
            <p>${escapeHtml(t("hero.subtitle"))}</p>
          </div>
          <div class="hero-art" aria-hidden="true">
            <span class="hero-badge"><i data-lucide="package-check"></i>${escapeHtml(t("hero.badge"))}</span>
          </div>
        </section>
        ${
          !isConfigured
            ? `<div class="config-notice"><i data-lucide="info"></i><span>${escapeHtml(t("hero.demo"))}</span></div>`
            : ""
        }
        <div class="catalog-toolbar">
          <div class="section-title">
            <h2>${escapeHtml(t("catalog.title"))}</h2>
            <p>${escapeHtml(t("catalog.result", { count: items.length }))}</p>
          </div>
          <div class="filters" role="group" aria-label="Formatos">
            <button class="filter-pill${state.filter === "all" ? " active" : ""}" type="button" data-filter="all">${escapeHtml(
              t("common.all"),
            )}</button>
            <button class="filter-pill${state.filter === "holoprint" ? " active" : ""}" type="button" data-filter="holoprint"><span class="filter-dot"></span>Holoprint</button>
            <button class="filter-pill${state.filter === "mcstructure" ? " active" : ""}" type="button" data-filter="mcstructure"><span class="filter-dot"></span>MCStructure</button>
          </div>
        </div>
        ${
          items.length
            ? `<section class="items-grid" aria-label="${escapeHtml(t("catalog.title"))}">${items.map(itemCard).join("")}</section>`
            : renderEmptyState(hasCatalogItems ? "search" : "catalog")
        }
      </div>`;
  }

  function renderFavorites() {
    if (!state.session) {
      renderAccessState("favorites");
      return;
    }
    const items = state.items.filter((item) => state.favoriteIds.has(item.id));
    app.innerHTML = `
      <div class="page">
        <header class="page-heading">
          <div>
            <span class="eyebrow">${escapeHtml(t("favorites.eyebrow"))}</span>
            <h1>${escapeHtml(t("favorites.title"))}</h1>
            <p>${escapeHtml(t("favorites.subtitle"))}</p>
          </div>
          <span class="counter"><i data-lucide="heart"></i><strong>${items.length}</strong> ${escapeHtml(
            t("favorites.count", { count: "" }).trim(),
          )}</span>
        </header>
        ${items.length ? `<section class="items-grid">${items.map(itemCard).join("")}</section>` : renderEmptyState("favorites")}
      </div>`;
  }

  function renderAccessState(kind) {
    const isAdmin = kind === "admin";
    app.innerHTML = `
      <div class="page">
        <div class="access-state">
          <div class="access-icon"><i data-lucide="${isAdmin ? "shield-lock" : "user-round"}"></i></div>
          <h2>${escapeHtml(isAdmin ? t("admin.restrictedTitle") : t("auth.title"))}</h2>
          <p>${escapeHtml(isAdmin ? (state.session ? t("admin.restrictedText") : t("admin.loginText")) : t("auth.subtitle"))}</p>
          ${
            !state.session
              ? `<button class="primary-button" type="button" data-open-auth>${escapeHtml(t("auth.signIn"))}<i data-lucide="log-in"></i></button>`
              : `<a class="secondary-button" href="#/home">${escapeHtml(t("nav.home"))}</a>`
          }
        </div>
      </div>`;
  }

  function profileInitial() {
    const source = state.profile?.username || state.session?.user?.email || "G";
    return source.trim().charAt(0).toUpperCase();
  }

  function activityThumb(item) {
    return item ? mediaMarkup(item, true) : '<div class="activity-thumb"></div>';
  }

  function renderDownloadActivity() {
    if (!state.downloads.length) return `<p class="activity-empty">${escapeHtml(t("profile.noDownloads"))}</p>`;
    return state.downloads.slice(0, 5).map((download) => {
      const item = download.items || state.items.find((entry) => entry.id === download.item_id);
      if (!item) return "";
      return `
        <div class="activity-row">
          ${activityThumb(item)}
          <div class="activity-info">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(t("profile.downloadedAs", { format: download.format === "holoprint" ? "Holoprint" : "MCStructure" }))}</span>
          </div>
          <time class="activity-time" datetime="${escapeHtml(download.created_at)}">${escapeHtml(formatDate(download.created_at))}</time>
        </div>`;
    }).join("");
  }

  function renderFavoriteActivity() {
    const items = state.items
      .filter((item) => state.favoriteIds.has(item.id))
      .sort((a, b) => new Date(state.favoriteDates.get(b.id) || b.created_at) - new Date(state.favoriteDates.get(a.id) || a.created_at))
      .slice(0, 4);
    if (!items.length) return `<p class="activity-empty">${escapeHtml(t("profile.noFavorites"))}</p>`;
    return items.map((item) => `
      <div class="activity-row">
        ${activityThumb(item)}
        <div class="activity-info">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(t("profile.saved"))}</span>
        </div>
        <time class="activity-time" datetime="${escapeHtml(state.favoriteDates.get(item.id) || item.created_at)}">${escapeHtml(
          formatDate(state.favoriteDates.get(item.id) || item.created_at),
        )}</time>
      </div>`).join("");
  }

  function renderProfile() {
    if (!state.session) {
      renderAccessState("profile");
      return;
    }
    const isAdmin = state.profile?.role === "admin";
    const name = state.profile?.username || state.session.user.email?.split("@")[0] || "Player";
    app.innerHTML = `
      <div class="page">
        <header class="page-heading">
          <div>
            <span class="eyebrow">${escapeHtml(t("profile.eyebrow"))}</span>
            <h1>${escapeHtml(t("profile.title"))}</h1>
            <p>${escapeHtml(t("profile.subtitle"))}</p>
          </div>
        </header>
        <div class="profile-grid">
          <aside class="profile-card">
            <div class="profile-avatar">${escapeHtml(profileInitial())}</div>
            <h2>${escapeHtml(name)}</h2>
            <p>${escapeHtml(state.session.user.email || "")}</p>
            <span class="profile-role"><i data-lucide="${isAdmin ? "shield-check" : "badge-check"}"></i>${escapeHtml(
              isAdmin ? t("profile.admin") : t("profile.member"),
            )}</span>
            <div class="profile-stats">
              <div class="profile-stat"><strong>${state.favoriteIds.size}</strong><span>${escapeHtml(t("profile.favorites"))}</span></div>
              <div class="profile-stat"><strong>${state.downloads.length}</strong><span>${escapeHtml(t("profile.downloads"))}</span></div>
            </div>
            <button class="secondary-button" type="button" data-sign-out><i data-lucide="log-out"></i>${escapeHtml(t("common.signOut"))}</button>
          </aside>
          <div>
            <section class="activity-card">
              <div class="activity-heading"><h2>${escapeHtml(t("profile.recentDownloads"))}</h2></div>
              <div class="activity-list">${renderDownloadActivity()}</div>
            </section>
            <section class="activity-card">
              <div class="activity-heading"><h2>${escapeHtml(t("profile.recentFavorites"))}</h2><a href="#/favorites">${escapeHtml(
                t("profile.viewAll"),
              )}</a></div>
              <div class="activity-list">${renderFavoriteActivity()}</div>
            </section>
          </div>
        </div>
      </div>`;
  }

  function adminThumb(item) {
    if (item.demo) return `<div class="atlas-image atlas-${Number(item.atlasIndex) || 0}"></div>`;
    return `<img src="${escapeHtml(safeHttpUrl(item.image_url))}" alt="" loading="lazy" />`;
  }

  function renderAdmin() {
    if (!state.session || state.profile?.role !== "admin") {
      renderAccessState("admin");
      return;
    }
    const editingItem = state.items.find((item) => item.id === state.editingItemId && !item.demo);
    const realItems = state.items.filter((item) => !item.demo);
    app.innerHTML = `
      <div class="page">
        <header class="page-heading">
          <div>
            <span class="eyebrow">${escapeHtml(t("admin.eyebrow"))}</span>
            <h1>${escapeHtml(t("admin.title"))}</h1>
            <p>${escapeHtml(t("admin.subtitle"))}</p>
          </div>
        </header>
        <div class="admin-layout">
          <section class="admin-form-card">
            <h2>${escapeHtml(editingItem ? t("admin.editTitle") : t("admin.formTitle"))}</h2>
            <p>${escapeHtml(t("admin.formText"))}</p>
            <form class="admin-form" id="admin-form">
              <label class="field">
                <span>${escapeHtml(t("admin.name"))}</span>
                <input id="item-name" name="name" type="text" maxlength="100" required placeholder="${escapeHtml(
                  t("admin.namePlaceholder"),
                )}" value="${escapeHtml(editingItem?.name || "")}" />
              </label>
              <label class="field">
                <span>${escapeHtml(t("admin.thumbnail"))}</span>
                <input id="item-image" name="image" type="file" accept="image/png,image/jpeg,image/webp" ${editingItem ? "" : "required"} />
                <small class="field-help">${escapeHtml(t("admin.thumbnailHelp"))}</small>
              </label>
              <label class="field">
                <span>${escapeHtml(t("admin.downloadUrl"))}</span>
                <input id="item-download" name="downloadUrl" type="url" inputmode="url" required placeholder="${escapeHtml(
                  t("admin.downloadPlaceholder"),
                )}" value="${escapeHtml(editingItem?.download_url || "")}" />
                <small class="field-help">${escapeHtml(t("admin.downloadHelp"))}</small>
              </label>
              <div class="form-actions">
                <button class="primary-button" type="submit"><i data-lucide="${editingItem ? "save" : "upload-cloud"}"></i>${escapeHtml(
                  editingItem ? t("admin.save") : t("admin.publish"),
                )}</button>
                ${editingItem ? `<button class="secondary-button" type="button" data-reset-admin>${escapeHtml(t("admin.reset"))}</button>` : ""}
              </div>
            </form>
          </section>
          <section class="admin-list-card">
            <h2>${escapeHtml(t("admin.listTitle"))}</h2>
            <p>${escapeHtml(t("admin.listText"))}</p>
            <div class="admin-items">
              ${
                realItems.length
                  ? realItems
                      .map(
                        (item) => `
                    <div class="admin-row">
                      ${adminThumb(item)}
                      <div class="admin-row-info"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.download_url)}</span></div>
                      <div class="admin-row-actions">
                        <button class="icon-button" type="button" data-edit-id="${escapeHtml(item.id)}" title="${escapeHtml(t("admin.edit"))}" aria-label="${escapeHtml(t("admin.edit"))}"><i data-lucide="pencil"></i></button>
                        <button class="icon-button" type="button" data-delete-id="${escapeHtml(item.id)}" title="${escapeHtml(t("admin.delete"))}" aria-label="${escapeHtml(t("admin.delete"))}"><i data-lucide="trash-2"></i></button>
                      </div>
                    </div>`,
                      )
                      .join("")
                  : `<p class="activity-empty">${escapeHtml(t("admin.empty"))}</p>`
              }
            </div>
          </section>
        </div>
      </div>`;
  }

  function renderRoute() {
    state.route = getRoute();
    updateActiveNavigation();
    if (state.loading) {
      renderSkeleton();
      refreshIcons();
      return;
    }
    if (state.route === "favorites") renderFavorites();
    else if (state.route === "profile") renderProfile();
    else if (state.route === "admin") renderAdmin();
    else renderHome();
    updateAdminVisibility();
    updateAccountButton();
    refreshIcons();
    app.focus({ preventScroll: true });
  }

  function showToast(message, type = "info") {
    const stack = document.getElementById("toast-stack");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i data-lucide="${type === "success" ? "circle-check" : type === "error" ? "circle-alert" : "info"}"></i><span>${escapeHtml(
      message,
    )}</span>`;
    stack.appendChild(toast);
    refreshIcons();
    window.setTimeout(() => toast.remove(), 4200);
  }

  function openAuthDialog(mode = "login") {
    if (!isConfigured) {
      showToast(t("auth.configNeeded"), "error");
      return;
    }
    setAuthMode(mode);
    document.getElementById("auth-feedback").textContent = "";
    authDialog.showModal();
    window.setTimeout(() => document.getElementById(mode === "signup" ? "auth-name" : "auth-email")?.focus(), 50);
  }

  function setAuthMode(mode) {
    state.authMode = mode === "signup" ? "signup" : "login";
    authDialog.querySelectorAll("[data-auth-tab]").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.authTab === state.authMode);
      tab.setAttribute("aria-selected", String(tab.dataset.authTab === state.authMode));
    });
    authDialog.querySelectorAll(".signup-only").forEach((field) => field.classList.toggle("is-hidden", state.authMode !== "signup"));
    const password = document.getElementById("auth-password");
    password.autocomplete = state.authMode === "signup" ? "new-password" : "current-password";
    authDialog.querySelector(".auth-submit span").textContent = t(state.authMode === "signup" ? "auth.signUp" : "auth.signIn");
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (!supabaseClient) return;
    const submit = event.currentTarget.querySelector("button[type='submit']");
    const feedback = document.getElementById("auth-feedback");
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const username = document.getElementById("auth-name").value.trim();
    submit.disabled = true;
    feedback.className = "auth-feedback";
    feedback.textContent = t("common.loading");

    try {
      if (state.authMode === "signup") {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (error) throw error;
        feedback.classList.add("success");
        feedback.textContent = data.session ? t("auth.welcome") : t("auth.confirmEmail");
        if (data.session) window.setTimeout(() => authDialog.close(), 650);
      } else {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        feedback.classList.add("success");
        feedback.textContent = t("auth.welcome");
        window.setTimeout(() => authDialog.close(), 450);
      }
    } catch (error) {
      feedback.classList.add("error");
      feedback.textContent = error?.message || t("toast.genericError");
    } finally {
      submit.disabled = false;
    }
  }

  async function loadItems() {
    if (!supabaseClient) {
      state.items = demoItems;
      return;
    }
    const { data, error } = await supabaseClient
      .from("items")
      .select("id,name,slug,description,image_url,download_url,formats,is_published,created_at,updated_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    state.items = data || [];
  }

  async function loadUserData() {
    state.profile = null;
    state.favoriteIds = new Set();
    state.favoriteDates = new Map();
    state.downloads = [];
    if (!supabaseClient || !state.session?.user) return;

    const [profileResult, favoritesResult, downloadsResult] = await Promise.all([
      supabaseClient.from("profiles").select("id,username,role,language,created_at").eq("id", state.session.user.id).maybeSingle(),
      supabaseClient.from("favorites").select("item_id,created_at").order("created_at", { ascending: false }),
      supabaseClient
        .from("download_history")
        .select("id,item_id,format,created_at,items(id,name,image_url,download_url,formats)")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (favoritesResult.error) throw favoritesResult.error;
    if (downloadsResult.error) throw downloadsResult.error;

    state.profile = profileResult.data;
    (favoritesResult.data || []).forEach((favorite) => {
      state.favoriteIds.add(favorite.item_id);
      state.favoriteDates.set(favorite.item_id, favorite.created_at);
    });
    state.downloads = downloadsResult.data || [];
  }

  async function refreshSessionData(session) {
    state.session = session || null;
    try {
      await loadUserData();
    } catch (error) {
      console.error(error);
      showToast(t("toast.genericError"), "error");
    }
    updateAdminVisibility();
    updateAccountButton();
    renderRoute();
  }

  async function toggleFavorite(itemId) {
    if (!supabaseClient) {
      showToast(t("auth.configNeeded"), "error");
      return;
    }
    if (!state.session) {
      showToast(t("toast.loginRequired"), "info");
      openAuthDialog("login");
      return;
    }
    const wasFavorite = state.favoriteIds.has(itemId);
    if (wasFavorite) state.favoriteIds.delete(itemId);
    else {
      state.favoriteIds.add(itemId);
      state.favoriteDates.set(itemId, new Date().toISOString());
    }
    renderRoute();

    const result = wasFavorite
      ? await supabaseClient.from("favorites").delete().eq("user_id", state.session.user.id).eq("item_id", itemId)
      : await supabaseClient.from("favorites").insert({ user_id: state.session.user.id, item_id: itemId });

    if (result.error) {
      if (wasFavorite) state.favoriteIds.add(itemId);
      else state.favoriteIds.delete(itemId);
      renderRoute();
      showToast(result.error.message || t("toast.genericError"), "error");
      return;
    }
    showToast(t(wasFavorite ? "toast.favoriteRemoved" : "toast.favoriteAdded"), "success");
  }

  function recordDownload(itemId, format) {
    if (!supabaseClient || !state.session || !isConfigured) return;
    const body = JSON.stringify({
      user_id: state.session.user.id,
      item_id: itemId,
      format,
    });
    fetch(`${config.SUPABASE_URL}/rest/v1/download_history`, {
      method: "POST",
      keepalive: true,
      headers: {
        apikey: config.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${state.session.access_token}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body,
    }).catch(() => {});
    state.downloads.unshift({
      id: `pending-${Date.now()}`,
      item_id: itemId,
      format,
      created_at: new Date().toISOString(),
      items: state.items.find((item) => item.id === itemId),
    });
  }

  function validateImage(file) {
    return Boolean(file) && ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 5 * 1024 * 1024;
  }

  async function uploadImage(file) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = slugify(file.name.replace(/\.[^.]+$/, "")) || "thumbnail";
    const path = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}-${safeName}.${extension}`;
    const { error } = await supabaseClient.storage.from("item-images").upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabaseClient.storage.from("item-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleAdminSubmit(event) {
    event.preventDefault();
    if (!supabaseClient || state.profile?.role !== "admin") return;
    const form = event.currentTarget;
    const submit = form.querySelector("button[type='submit']");
    const name = document.getElementById("item-name").value.trim();
    const downloadUrl = safeHttpUrl(document.getElementById("item-download").value.trim());
    const file = document.getElementById("item-image").files[0];
    const editingItem = state.items.find((item) => item.id === state.editingItemId);

    if (!downloadUrl || !downloadUrl.startsWith("https://")) {
      showToast(t("toast.invalidUrl"), "error");
      return;
    }
    if ((!editingItem && !validateImage(file)) || (file && !validateImage(file))) {
      showToast(t("toast.invalidImage"), "error");
      return;
    }

    submit.disabled = true;
    try {
      const imageUrl = file ? await uploadImage(file) : editingItem.image_url;
      const payload = {
        name,
        slug: `${slugify(name)}-${String(editingItem?.id || crypto.randomUUID()).slice(0, 8)}`,
        image_url: imageUrl,
        download_url: downloadUrl,
        formats: ["Holoprint", "MCStructure"],
        is_published: true,
      };
      const result = editingItem
        ? await supabaseClient.from("items").update(payload).eq("id", editingItem.id)
        : await supabaseClient.from("items").insert(payload);
      if (result.error) throw result.error;
      const wasEditing = Boolean(editingItem);
      state.editingItemId = null;
      await loadItems();
      renderAdmin();
      refreshIcons();
      showToast(t(wasEditing ? "toast.itemUpdated" : "toast.itemSaved"), "success");
    } catch (error) {
      console.error(error);
      showToast(error?.message || t("toast.genericError"), "error");
    } finally {
      submit.disabled = false;
    }
  }

  function storagePathFromPublicUrl(url) {
    const marker = "/storage/v1/object/public/item-images/";
    const index = String(url || "").indexOf(marker);
    return index >= 0 ? decodeURIComponent(String(url).slice(index + marker.length)) : "";
  }

  async function deleteItem() {
    const item = state.items.find((entry) => entry.id === state.pendingDeleteId);
    if (!item || !supabaseClient || state.profile?.role !== "admin") return;
    const { error } = await supabaseClient.from("items").delete().eq("id", item.id);
    if (error) {
      showToast(error.message || t("toast.genericError"), "error");
      return;
    }
    const imagePath = storagePathFromPublicUrl(item.image_url);
    if (imagePath) await supabaseClient.storage.from("item-images").remove([imagePath]);
    state.pendingDeleteId = null;
    if (state.editingItemId === item.id) state.editingItemId = null;
    await loadItems();
    confirmDialog.close();
    renderRoute();
    showToast(t("toast.itemDeleted"), "success");
  }

  async function signOut() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    window.location.hash = "#/home";
  }

  function handleAppClick(event) {
    const authTrigger = event.target.closest("[data-open-auth]");
    if (authTrigger) {
      openAuthDialog("login");
      return;
    }
    const favorite = event.target.closest("[data-favorite-id]");
    if (favorite) {
      toggleFavorite(favorite.dataset.favoriteId);
      return;
    }
    const download = event.target.closest("[data-download-id]");
    if (download) {
      const item = state.items.find((entry) => entry.id === download.dataset.downloadId);
      if (!item || item.demo || !safeHttpUrl(item.download_url)) {
        event.preventDefault();
        showToast(t("toast.demoDownload"), "info");
        return;
      }
      recordDownload(item.id, download.dataset.format);
      showToast(t("toast.downloadStarted"), "success");
      return;
    }
    const filter = event.target.closest("[data-filter]");
    if (filter) {
      state.filter = filter.dataset.filter;
      renderHome();
      refreshIcons();
      return;
    }
    const clearSearch = event.target.closest("[data-clear-search]");
    if (clearSearch) {
      event.preventDefault();
      state.search = "";
      document.getElementById("search-input").value = "";
      state.filter = "all";
      renderRoute();
      return;
    }
    const signOutTrigger = event.target.closest("[data-sign-out]");
    if (signOutTrigger) {
      signOut();
      return;
    }
    const editTrigger = event.target.closest("[data-edit-id]");
    if (editTrigger) {
      state.editingItemId = editTrigger.dataset.editId;
      renderAdmin();
      refreshIcons();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const deleteTrigger = event.target.closest("[data-delete-id]");
    if (deleteTrigger) {
      state.pendingDeleteId = deleteTrigger.dataset.deleteId;
      confirmDialog.showModal();
      return;
    }
    const resetAdmin = event.target.closest("[data-reset-admin]");
    if (resetAdmin) {
      state.editingItemId = null;
      renderAdmin();
      refreshIcons();
    }
  }

  function attachEvents() {
    window.addEventListener("hashchange", renderRoute);
    app.addEventListener("click", handleAppClick);
    app.addEventListener("submit", (event) => {
      if (event.target.matches("#admin-form")) handleAdminSubmit(event);
    });

    document.getElementById("search-input").addEventListener("input", (event) => {
      state.search = event.target.value;
      if (state.route !== "home") window.location.hash = "#/home";
      else {
        renderHome();
        refreshIcons();
      }
    });

    document.addEventListener("keydown", (event) => {
      const activeTag = document.activeElement?.tagName;
      if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(activeTag)) {
        event.preventDefault();
        document.getElementById("search-input").focus();
      }
      if (event.key === "Escape" && authDialog.open) authDialog.close();
    });

    document.getElementById("language-select").addEventListener("change", async (event) => {
      state.language = event.target.value;
      localStorage.setItem("guizz-language", state.language);
      applyStaticTranslations();
      setAuthMode(state.authMode);
      renderRoute();
      refreshIcons();
      if (supabaseClient && state.session) {
        await supabaseClient.from("profiles").update({ language: state.language }).eq("id", state.session.user.id);
      }
    });

    document.getElementById("account-button").addEventListener("click", () => {
      if (state.session) window.location.hash = "#/profile";
      else openAuthDialog("login");
    });

    authDialog.querySelector("[data-close-dialog]").addEventListener("click", () => authDialog.close());
    authDialog.addEventListener("click", (event) => {
      if (event.target === authDialog) authDialog.close();
    });
    authDialog.querySelectorAll("[data-auth-tab]").forEach((tab) => {
      tab.addEventListener("click", () => setAuthMode(tab.dataset.authTab));
    });
    document.getElementById("auth-form").addEventListener("submit", handleAuthSubmit);

    confirmDialog.querySelector("[data-cancel-delete]").addEventListener("click", () => {
      state.pendingDeleteId = null;
      confirmDialog.close();
    });
    confirmDialog.querySelector("[data-confirm-delete]").addEventListener("click", deleteItem);
  }

  async function boot() {
    state.route = getRoute();
    applyStaticTranslations();
    attachEvents();
    renderSkeleton();
    updateActiveNavigation();
    refreshIcons();

    if (isConfigured && window.supabase?.createClient) {
      supabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      const { data } = await supabaseClient.auth.getSession();
      state.session = data.session;
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        window.setTimeout(() => refreshSessionData(session), 0);
      });
    }

    try {
      await Promise.all([loadItems(), loadUserData()]);
    } catch (error) {
      console.error(error);
      state.items = [];
      showToast(error?.message || t("toast.genericError"), "error");
    } finally {
      state.loading = false;
      updateAdminVisibility();
      updateAccountButton();
      renderRoute();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
