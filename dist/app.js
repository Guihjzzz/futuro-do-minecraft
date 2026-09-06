(() => {
  "use strict";

  const config = window.__APP_CONFIG__ || {};
  const firebaseConfig = config.FIREBASE_CONFIG || {};
  const isConfigured =
    /^https:\/\/.+\.supabase\.co$/i.test(config.SUPABASE_URL || "") &&
    Boolean(config.SUPABASE_ANON_KEY) &&
    !String(config.SUPABASE_ANON_KEY).includes("SUA_SUPABASE");
  const isFirebaseConfigured =
    Boolean(firebaseConfig.apiKey) &&
    Boolean(firebaseConfig.authDomain) &&
    Boolean(firebaseConfig.projectId) &&
    Boolean(firebaseConfig.appId);

  const ADMIN_EMAIL = "junindacosta00241@gmail.com";
  const CATEGORIES = ["Houses", "Decorations", "Farms", "Hologram Pack"];

  const demoItems = [
    { id: "demo-1", name: "Pagode Carmesim", atlasIndex: 0, category: "Houses" },
    { id: "demo-2", name: "Fortaleza Obsidiana", atlasIndex: 1, category: "Hologram Pack" },
    { id: "demo-3", name: "Casa Sakura", atlasIndex: 2, category: "Houses" },
    { id: "demo-4", name: "Laboratorio Redstone", atlasIndex: 3, category: "Farms" },
    { id: "demo-5", name: "Porto Nordico", atlasIndex: 4, category: "Decorations" },
    { id: "demo-6", name: "Templo do Deserto", atlasIndex: 5, category: "Hologram Pack" },
  ].map((item, index) => ({
    ...item,
    slug: `estrutura-demo-${index + 1}`,
    description: "",
    texture_url: "",
    mcstructure_url: "",
    image_url: "",
    downloads: [142, 96, 81, 67, 54, 39][index],
    created_at: new Date(Date.now() - index * 86_400_000).toISOString(),
    demo: true,
  }));

  const state = {
    route: "home",
    search: "",
    filter: "Houses",
    sort: "recent",
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
    authProvider: null,
    sharedItemToken: null,
  };

  let supabaseClient = null;
  let firebaseSupabaseClient = null;
  let firebaseAuthApi = null;
  const app = document.getElementById("app");
  const authDialog = document.getElementById("auth-dialog");
  const confirmDialog = document.getElementById("confirm-dialog");

  const translationManager = (() => {
    const SOURCE_LANGUAGE = "pt";
    const LANGUAGE_CODES = { "pt-BR": "pt", en: "en", es: "es" };
    const STORAGE_KEY = "app_lang";
    const CACHE_KEY = "hololab-translations-v1";
    const TRANSLATABLE_ATTRIBUTES = ["alt", "aria-label", "placeholder", "title"];
    const SKIP_SELECTOR =
      'script, style, noscript, code, pre, kbd, samp, svg, textarea, #language-select, #language-select option, #item-category, #item-category option, [translate="no"], [data-no-translate]';
    const originalText = new WeakMap();
    const appliedText = new WeakMap();
    const originalAttributes = new WeakMap();
    const appliedAttributes = new WeakMap();
    const pendingRoots = new Set();
    const memoryCache = new Map();
    let observer = null;
    const requestControllers = new Set();
    const requestQueue = new Map();
    const inFlightTranslations = new Map();
    let targetLanguage = SOURCE_LANGUAGE;
    let locale = "pt-BR";
    let revision = 0;
    let flushTimer = 0;
    let requestTimer = 0;
    let translationErrorShown = false;

    try {
      const savedCache = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
      if (Array.isArray(savedCache)) {
        savedCache.slice(-400).forEach(([key, value]) => {
          if (typeof key === "string" && typeof value === "string") memoryCache.set(key, value);
        });
      }
    } catch (error) {
      console.warn("Cache de tradução ignorado:", error);
    }

    function persistCache() {
      try {
        const entries = Array.from(memoryCache.entries()).slice(-400);
        localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
      } catch (error) {
        console.warn("Não foi possível salvar o cache de tradução:", error);
      }
    }

    function persistLocale(value) {
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch (error) {
        console.warn("Não foi possível salvar o idioma escolhido:", error);
      }
    }

    function isEligibleElement(element) {
      return Boolean(element && !element.isContentEditable && !element.closest(SKIP_SELECTOR));
    }

    function isEligibleText(value) {
      const text = String(value || "").trim();
      return (
        text.length > 1 &&
        /[A-Za-zÀ-ÿ]/.test(text) &&
        !CATEGORIES.includes(text) &&
        !/^(?:https?:\/\/|mailto:|tel:)/i.test(text)
      );
    }

    function splitWhitespace(value) {
      const leading = value.match(/^\s*/)?.[0] || "";
      const trailing = value.match(/\s*$/)?.[0] || "";
      return { leading, text: value.slice(leading.length, value.length - trailing.length), trailing };
    }

    function rememberText(node) {
      const current = node.nodeValue || "";
      const lastApplied = appliedText.get(node);
      const savedOriginal = originalText.get(node);
      if (
        !originalText.has(node) ||
        (lastApplied && lastApplied.value !== current) ||
        (!lastApplied && savedOriginal !== current)
      ) {
        originalText.set(node, current);
        appliedText.delete(node);
      }
      return originalText.get(node) || "";
    }

    function attributeMap(store, element) {
      if (!store.has(element)) store.set(element, new Map());
      return store.get(element);
    }

    function rememberAttribute(element, attribute) {
      const current = element.getAttribute(attribute) || "";
      const originals = attributeMap(originalAttributes, element);
      const applied = attributeMap(appliedAttributes, element);
      const lastApplied = applied.get(attribute);
      const savedOriginal = originals.get(attribute);
      if (!originals.has(attribute) || (lastApplied && lastApplied.value !== current) || (!lastApplied && savedOriginal !== current)) {
        originals.set(attribute, current);
        applied.delete(attribute);
      }
      return originals.get(attribute) || "";
    }

    async function flushTranslationRequests() {
      const entries = Array.from(requestQueue.values());
      requestQueue.clear();
      if (!entries.length || targetLanguage === SOURCE_LANGUAGE) return;
      entries.forEach((entry) => inFlightTranslations.set(entry.key, entry));

      const requestedLanguage = targetLanguage;
      const controller = new AbortController();
      requestControllers.add(controller);

      try {
        for (let index = 0; index < entries.length; index += 50) {
          const batch = entries.slice(index, index + 50);
          const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetLanguage: requestedLanguage,
              texts: batch.map((entry) => entry.text),
            }),
            signal: controller.signal,
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || "A tradução não respondeu corretamente.");
          if (!Array.isArray(result.translations) || result.translations.length !== batch.length) {
            throw new Error("A resposta da tradução está incompleta.");
          }

          batch.forEach((entry, batchIndex) => {
            const translated = String(result.translations[batchIndex] || entry.text).trim() || entry.text;
            memoryCache.set(entry.key, translated);
            inFlightTranslations.delete(entry.key);
            entry.resolve(translated);
          });
        }
        persistCache();
      } catch (error) {
        entries.forEach((entry) => {
          inFlightTranslations.delete(entry.key);
          entry.reject(error);
        });
        if (error.name !== "AbortError" && !translationErrorShown) {
          translationErrorShown = true;
          showToast(error.message || "Não foi possível traduzir esta página.", "error");
        }
      } finally {
        requestControllers.delete(controller);
      }
    }

    function cancelTranslationRequests() {
      window.clearTimeout(requestTimer);
      requestControllers.forEach((controller) => controller.abort());
      requestControllers.clear();
      const error = new DOMException("Tradução cancelada.", "AbortError");
      requestQueue.forEach((entry) => entry.reject(error));
      inFlightTranslations.forEach((entry) => entry.reject(error));
      requestQueue.clear();
      inFlightTranslations.clear();
    }

    function translateString(text) {
      if (targetLanguage === SOURCE_LANGUAGE) return Promise.resolve(text);
      const key = `${targetLanguage}\u0000${text}`;
      if (memoryCache.has(key)) return Promise.resolve(memoryCache.get(key));
      if (requestQueue.has(key)) return requestQueue.get(key).promise;
      if (inFlightTranslations.has(key)) return inFlightTranslations.get(key).promise;

      let resolve;
      let reject;
      const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
      });
      requestQueue.set(key, { key, text, promise, resolve, reject });
      window.clearTimeout(requestTimer);
      requestTimer = window.setTimeout(flushTranslationRequests, 35);
      return promise;
    }

    async function translateTextNode(node, activeRevision) {
      if (!node.isConnected || !isEligibleElement(node.parentElement)) return;
      const lastApplied = appliedText.get(node);
      if (lastApplied?.language === targetLanguage && lastApplied.value === node.nodeValue) return;
      const source = rememberText(node);
      const { leading, text, trailing } = splitWhitespace(source);
      if (!isEligibleText(text)) return;
      try {
        const translated = await translateString(text);
        if (!node.isConnected || activeRevision !== revision) return;
        const value = `${leading}${translated}${trailing}`;
        appliedText.set(node, { language: targetLanguage, value });
        node.nodeValue = value;
      } catch (error) {
        if (error.name !== "AbortError") console.error("Falha ao traduzir texto:", error);
      }
    }

    async function translateAttribute(element, attribute, activeRevision) {
      if (!element.isConnected || !element.hasAttribute(attribute) || !isEligibleElement(element)) return;
      const applied = attributeMap(appliedAttributes, element);
      const lastApplied = applied.get(attribute);
      if (lastApplied?.language === targetLanguage && lastApplied.value === element.getAttribute(attribute)) return;
      const source = rememberAttribute(element, attribute);
      if (!isEligibleText(source)) return;
      try {
        const translated = await translateString(source);
        if (!element.isConnected || activeRevision !== revision) return;
        applied.set(attribute, { language: targetLanguage, value: translated });
        element.setAttribute(attribute, translated);
      } catch (error) {
        if (error.name !== "AbortError") console.error(`Falha ao traduzir ${attribute}:`, error);
      }
    }

    function scan(root) {
      if (!root || targetLanguage === SOURCE_LANGUAGE) return;
      const activeRevision = revision;
      if (root.nodeType === Node.TEXT_NODE) {
        void translateTextNode(root, activeRevision);
        return;
      }
      if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
      const element = root.nodeType === Node.ELEMENT_NODE ? root : null;
      if (element && !isEligibleElement(element)) return;

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          return isEligibleElement(node.parentElement) && isEligibleText(node.nodeValue)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      });
      let textNode = walker.nextNode();
      while (textNode) {
        void translateTextNode(textNode, activeRevision);
        textNode = walker.nextNode();
      }

      const elements = [];
      if (element) elements.push(element);
      if (root.querySelectorAll) elements.push(...root.querySelectorAll("[alt], [aria-label], [placeholder], [title]"));
      elements.forEach((entry) => {
        TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
          if (entry.hasAttribute(attribute)) void translateAttribute(entry, attribute, activeRevision);
        });
      });
    }

    function queue(root) {
      if (!root || targetLanguage === SOURCE_LANGUAGE) return;
      pendingRoots.add(root);
      window.clearTimeout(flushTimer);
      flushTimer = window.setTimeout(() => {
        const roots = Array.from(pendingRoots);
        pendingRoots.clear();
        roots.forEach(scan);
      }, 50);
    }

    function restore(root = document.body) {
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        if (originalText.has(node)) {
          const value = originalText.get(node);
          appliedText.set(node, { language: SOURCE_LANGUAGE, value });
          node.nodeValue = value;
        }
        node = walker.nextNode();
      }
      root.querySelectorAll?.("[alt], [aria-label], [placeholder], [title]").forEach((element) => {
        const originals = originalAttributes.get(element);
        if (!originals) return;
        originals.forEach((value, attribute) => {
          attributeMap(appliedAttributes, element).set(attribute, { language: SOURCE_LANGUAGE, value });
          element.setAttribute(attribute, value);
        });
      });
    }

    async function setLanguage(nextLocale) {
      const normalizedLocale = Object.hasOwn(LANGUAGE_CODES, nextLocale) ? nextLocale : "pt-BR";
      const nextTarget = LANGUAGE_CODES[normalizedLocale];
      cancelTranslationRequests();
      locale = normalizedLocale;
      targetLanguage = nextTarget;
      revision += 1;
      translationErrorShown = false;
      pendingRoots.clear();
      window.clearTimeout(flushTimer);
      document.documentElement.lang = normalizedLocale;
      persistLocale(normalizedLocale);

      if (nextTarget === SOURCE_LANGUAGE) {
        restore();
        return true;
      }

      scan(document.body);
      return true;
    }

    function start() {
      if (observer || !document.body) return;
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "characterData") queue(mutation.target);
          else if (mutation.type === "attributes") queue(mutation.target);
          else mutation.addedNodes.forEach(queue);
        });
      });
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: TRANSLATABLE_ATTRIBUTES,
        characterData: true,
        childList: true,
        subtree: true,
      });
    }

    function savedLocale() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) || "pt-BR";
        return Object.hasOwn(LANGUAGE_CODES, saved) ? saved : "pt-BR";
      } catch (error) {
        console.warn("Não foi possível recuperar o idioma escolhido:", error);
        return "pt-BR";
      }
    }

    return { locale: () => locale, queue, savedLocale, setLanguage, start };
  })();


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
      return url.protocol === "https:" && !url.username && !url.password ? url.toString() : "";
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

  function isAdminUser() {
    return (
      state.authProvider === "supabase" &&
      state.profile?.role === "admin" &&
      state.session?.user?.email?.trim().toLowerCase() === ADMIN_EMAIL
    );
  }

  function getDataClient() {
    return state.authProvider === "firebase" ? firebaseSupabaseClient : supabaseClient;
  }

  function firebaseSession(user, accessToken) {
    return {
      access_token: accessToken,
      provider: "firebase",
      user: {
        id: user.uid,
        email: user.email,
        user_metadata: { username: user.displayName || "" },
      },
    };
  }

  function firebaseAuthMessage(error) {
    const messages = {
      "auth/email-already-in-use": "Este e-mail já está em uso. Por favor, faça login ou use outro e-mail.",
      "auth/invalid-credential": "E-mail ou senha incorretos.",
      "auth/invalid-email": "Informe um e-mail válido.",
      "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente novamente.",
    };
    return messages[error?.code] || error?.message || String(error);
  }

  async function initializeFirebase() {
    if (!isFirebaseConfigured) throw new Error("A configuração pública do Firebase está incompleta.");
    const version = "12.18.0";
    const [appSdk, authSdk] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`),
    ]);
    const firebaseApp = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(firebaseConfig);
    const auth = authSdk.getAuth(firebaseApp);
    firebaseAuthApi = {
      auth,
      createUserWithEmailAndPassword: authSdk.createUserWithEmailAndPassword,
      signInWithEmailAndPassword: authSdk.signInWithEmailAndPassword,
      signOut: authSdk.signOut,
      updateProfile: authSdk.updateProfile,
      onAuthStateChanged: authSdk.onAuthStateChanged,
    };
  }

  async function waitForInitialFirebaseUser() {
    return new Promise((resolve, reject) => {
      const unsubscribe = firebaseAuthApi.onAuthStateChanged(
        firebaseAuthApi.auth,
        (user) => {
          unsubscribe();
          resolve(user);
        },
        reject,
      );
    });
  }

  async function authorizeFirebaseUser(user) {
    if (!user || user.email?.trim().toLowerCase() === ADMIN_EMAIL) {
      throw new Error("A conta administrativa só pode entrar pelo Supabase.");
    }
    const currentToken = await user.getIdToken(false);
    const response = await fetch("/api/set-role", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Não foi possível autorizar a conta no servidor.");
    }
    const tokenResult = await user.getIdTokenResult(true);
    if (tokenResult.claims.role !== "authenticated") {
      throw new Error("O token do Firebase ainda não recebeu a permissão do Supabase.");
    }
    return firebaseSession(user, tokenResult.token);
  }

  async function ensureFirebaseProfile(username = "") {
    if (!firebaseSupabaseClient || state.authProvider !== "firebase" || !state.session?.user) return;
    const id = state.session.user.id;
    const { data, error } = await firebaseSupabaseClient.from("profiles").select("id").eq("id", id).maybeSingle();
    if (error) throw error;
    if (data) return;
    const fallbackName = state.session.user.email?.split("@")[0] || "Player";
    const result = await firebaseSupabaseClient.from("profiles").insert({
      id,
      username: (username || state.session.user.user_metadata?.username || fallbackName).slice(0, 60),
      language: localeCode(),
    });
    if (result.error && result.error.code !== "23505") throw result.error;
  }

  function localeCode() {
    return translationManager.locale();
  }

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat(localeCode(), {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  }

  function itemDownloads(item) {
    const value = Number(item?.downloads || 0);
    return Number.isFinite(value) && value >= 0 ? Math.trunc(value) : 0;
  }

  function formatDownloads(value) {
    return new Intl.NumberFormat(localeCode(), { notation: "compact", maximumFractionDigits: 1 }).format(value);
  }

  function downloadCountLabel(value) {
    return value === 1 ? "baixou" : "baixaram";
  }

  function getRoute() {
    const route = window.location.hash.replace(/^#\//, "").split("?")[0] || "home";
    return ["home", "favorites", "profile", "admin"].includes(route) ? route : "home";
  }

  function refreshIcons() {
    window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });
  }

  function applyLanguage() {
    const select = document.getElementById("language-select");
    const savedLocale = translationManager.savedLocale();
    if (select) select.value = savedLocale;
    document.documentElement.lang = savedLocale;
  }

  function updateAccountButton() {
    const button = document.getElementById("account-button");
    if (!button) return;
    const label = state.session ? "Minha conta" : "Entrar";
    button.innerHTML = `<i data-lucide="${state.session ? "user-round" : "log-in"}"></i><span>${escapeHtml(label)}</span>`;
  }

  function updateAdminVisibility() {
    const isAdmin = isAdminUser();
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
          "Carregando...",
        )}</h2></div></div>
        <div class="items-grid">${Array.from({ length: 6 }, () => '<div class="skeleton"></div>').join("")}</div>
      </div>`;
  }

  function mediaMarkup(item, compact = false) {
    if (item.demo) {
      return `<div class="${compact ? "activity-thumb " : ""}atlas-image atlas-${Number(item.atlasIndex) || 0}" role="img" aria-label="${escapeHtml(item.name)}"></div>`;
    }
    const image = safeHttpUrl(item.image_url);
    return `<img class="${compact ? "activity-thumb" : "card-image"}" src="${escapeHtml(image)}" alt="${escapeHtml(
      item.name,
    )}" loading="lazy" decoding="async"${compact ? "" : " data-card-image"} />`;
  }

  function itemCard(item) {
    const isFavorite = state.favoriteIds.has(item.id);
    const textureUrl = item.demo ? "" : safeHttpUrl(item.texture_url);
    const mcstructureUrl = item.demo ? "" : safeHttpUrl(item.mcstructure_url);
    const favoriteLabel = isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos";
    const description = item.description || "Textura e estrutura prontas para baixar e construir.";
    const category = CATEGORIES.includes(item.category) ? item.category : "Houses";
    const downloads = itemDownloads(item);

    return `
      <article class="item-card" data-card-id="${escapeHtml(item.id)}">
        <div class="card-media${item.demo ? "" : " is-image-loading"}">
          ${mediaMarkup(item)}
          <button class="favorite-button${isFavorite ? " active" : ""}" type="button" data-favorite-id="${escapeHtml(
            item.id,
          )}" aria-label="${escapeHtml(favoriteLabel)}" title="${escapeHtml(favoriteLabel)}">
            <i data-lucide="heart"></i>
          </button>
          <div class="media-meta">
            <span class="tag">${escapeHtml(category)}</span>
          </div>
        </div>
        <div class="card-body">
          <h3 title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(description)}</p>
          <time class="upload-date" datetime="${escapeHtml(item.created_at)}"><i data-lucide="calendar-days"></i>${escapeHtml("Publicado em")}: ${escapeHtml(formatDate(item.created_at))}</time>
          <div class="card-meta-actions">
            <span class="download-count" data-download-count="${escapeHtml(item.id)}">
              <i data-lucide="download"></i><strong>${escapeHtml(formatDownloads(downloads))}</strong>
              <span data-download-label>${escapeHtml(downloadCountLabel(downloads))}</span>
            </span>
            <button class="share-button" type="button" data-share-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(
              `Compartilhar ${item.name}`,
            )}"><i data-lucide="share-2"></i><span>${escapeHtml("Compartilhar")}</span></button>
          </div>
          <div class="download-actions">
            ${[["texture", "Textura", textureUrl], ["mcstructure", "Mcstructure", mcstructureUrl]].map(([format, label, url]) =>
              url ? `<a class="download-button" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" data-download-id="${escapeHtml(item.id)}" data-format="${format}"><i data-lucide="download"></i><span>${label}</span></a>`
                : `<button class="download-button" disabled aria-label="${label}: ${escapeHtml("Indisponível")}">${label}</button>`
            ).join("")}
          </div>
        </div>
      </article>`;
  }

  function filteredItems(items = state.items) {
    const query = state.search.trim().toLocaleLowerCase(localeCode());
    return items.filter((item) => {
      const matchesSearch = !query || `${item.name} ${item.description || ""}`.toLocaleLowerCase(localeCode()).includes(query);
      const matchesFilter = item.category === state.filter;
      return matchesSearch && matchesFilter;
    });
  }

  function sortedItems(items) {
    return [...items].sort((left, right) => {
      if (state.sort === "downloads") {
        const downloadDifference = itemDownloads(right) - itemDownloads(left);
        if (downloadDifference) return downloadDifference;
      }
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });
  }

  function renderEmptyState(kind) {
    const isSearch = kind === "search";
    const isFavorites = kind === "favorites";
    const title = isSearch
      ? "Nenhuma estrutura encontrada"
      : isFavorites
        ? "Nenhum favorito por enquanto"
        : "Seu catálogo está pronto para receber estruturas";
    const text = isSearch
      ? "Tente outro termo ou limpe o filtro atual."
      : isFavorites
        ? "Toque no coração de uma estrutura para guardar aqui."
        : isAdminUser() ? "Acesse o painel admin e publique o primeiro item." : "Tente outro termo ou limpe o filtro atual.";
    const href = isFavorites ? "#/home" : "#/home";
    const label = isSearch ? "Limpar busca" : isFavorites || !isAdminUser() ? "Explorar catálogo" : "Painel admin";
    const action = !isSearch && !isFavorites && isAdminUser() ? "#/admin" : href;

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
    const sharedToken = new URLSearchParams(window.location.hash.split("?")[1] || "").get("item");
    const sharedItem = sharedToken
      ? state.items.find((item) => String(item.id) === sharedToken || item.slug === sharedToken)
      : null;
    const shouldRevealSharedItem = Boolean(sharedItem && sharedToken !== state.sharedItemToken);
    if (shouldRevealSharedItem) {
      state.filter = sharedItem.category;
      state.search = "";
      const searchInput = document.getElementById("search-input");
      if (searchInput) searchInput.value = "";
    }
    const items = sortedItems(filteredItems());
    const hasCatalogItems = state.items.length > 0;
    app.innerHTML = `
      <div class="page">
        <section class="catalog-hero" aria-labelledby="catalog-title">
          <div class="hero-copy">
            <span class="eyebrow">${escapeHtml("Blueprints sem limites")}</span>
            <h1 id="catalog-title">${"Construa grande. <span>Baixe agora.</span>"}</h1>
            <p>${escapeHtml("Texturas e estruturas selecionadas para Minecraft, com downloads diretos e imediatos.")}</p>
          </div>
          <div class="hero-art" aria-hidden="true">
            <span class="hero-badge"><i data-lucide="package-check"></i>${escapeHtml("HOLOLAB")}</span>
          </div>
        </section>
        ${
          !isConfigured
            ? `<div class="config-notice"><i data-lucide="info"></i><span>${escapeHtml("Modo demonstração: conecte o Supabase em config.js para carregar seu catálogo real.")}</span></div>`
            : ""
        }
        <div class="catalog-toolbar">
          <div class="section-title">
            <h2>${escapeHtml("Estruturas em destaque")}</h2>
            <p>${items.length} estruturas prontas para construir</p>
          </div>
          <div class="catalog-controls">
            <label class="sort-control" for="catalog-sort">
              <span>${escapeHtml("Ordenar por")}</span>
              <select id="catalog-sort" data-catalog-sort aria-label="${escapeHtml("Ordenar estruturas")}">
                <option value="recent"${state.sort === "recent" ? " selected" : ""}>${escapeHtml("Mais recentes")}</option>
                <option value="downloads"${state.sort === "downloads" ? " selected" : ""}>${escapeHtml("Mais baixados")}</option>
              </select>
            </label>
            <div class="filters" role="group" aria-label="Categorias">
              ${CATEGORIES.map(
                (category) => `<button class="filter-pill${state.filter === category ? " active" : ""}" type="button" data-filter="${escapeHtml(
                  category,
                )}"><span class="filter-dot"></span>${escapeHtml(category)}</button>`,
              ).join("")}
            </div>
          </div>
        </div>
        ${
          items.length
            ? `<section class="items-grid" aria-label="${escapeHtml("Estruturas em destaque")}">${items.map(itemCard).join("")}</section>`
            : renderEmptyState(hasCatalogItems ? "search" : "catalog")
        }
      </div>`;
    state.sharedItemToken = sharedToken;
    if (shouldRevealSharedItem) {
      window.setTimeout(() => {
        const card = Array.from(app.querySelectorAll("[data-card-id]")).find(
          (entry) => entry.dataset.cardId === String(sharedItem.id),
        );
        card?.classList.add("shared-item");
        card?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    }
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
            <span class="eyebrow">${escapeHtml("Sua coleção")}</span>
            <h1>${escapeHtml("Meus favoritos")}</h1>
            <p>${escapeHtml("As estruturas que você salvou ficam reunidas aqui.")}</p>
          </div>
          <span class="counter"><i data-lucide="heart"></i><strong>${items.length}</strong> salvos</span>
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
          <h2>${escapeHtml(isAdmin ? "Área exclusiva do administrador" : "Entre para salvar estruturas")}</h2>
          <p>${escapeHtml(isAdmin ? (state.session ? "A permissão é validada pela role do seu perfil no Supabase." : "Entre com a conta de administrador para continuar.") : "Sincronize favoritos e acompanhe seus downloads.")}</p>
          ${
            !state.session
              ? `<button class="primary-button" type="button" data-open-auth>${escapeHtml("Entrar")}<i data-lucide="log-in"></i></button>`
              : `<a class="secondary-button" href="#/home">${escapeHtml("Catálogo")}</a>`
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
    if (!state.downloads.length) return `<p class="activity-empty">${escapeHtml("Seus downloads recentes aparecerão aqui.")}</p>`;
    return state.downloads.slice(0, 5).map((download) => {
      const item = download.items || state.items.find((entry) => entry.id === download.item_id);
      if (!item) return "";
      return `
        <div class="activity-row">
          ${activityThumb(item)}
          <div class="activity-info">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml("Download realizado")}</span>
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
    if (!items.length) return `<p class="activity-empty">${escapeHtml("Seus favoritos recentes aparecerão aqui.")}</p>`;
    return items.map((item) => `
      <div class="activity-row">
        ${activityThumb(item)}
        <div class="activity-info">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml("Estrutura salva")}</span>
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
    const isAdmin = isAdminUser();
    const name = state.profile?.username || state.session.user.email?.split("@")[0] || "Player";
    app.innerHTML = `
      <div class="page">
        <header class="page-heading">
          <div>
            <span class="eyebrow">${escapeHtml("Sua atividade")}</span>
            <h1>${escapeHtml("Perfil")}</h1>
            <p>${escapeHtml("Favoritos e downloads recentes sincronizados com sua conta.")}</p>
          </div>
        </header>
        <div class="profile-grid">
          <aside class="profile-card">
            <div class="profile-avatar">${escapeHtml(profileInitial())}</div>
            <h2>${escapeHtml(name)}</h2>
            <p>${escapeHtml(state.session.user.email || "")}</p>
            <span class="profile-role"><i data-lucide="${isAdmin ? "shield-check" : "badge-check"}"></i>${escapeHtml(
              isAdmin ? "Administrador" : "Membro",
            )}</span>
            <div class="profile-stats">
              <div class="profile-stat"><strong>${state.favoriteIds.size}</strong><span>${escapeHtml("Favoritos")}</span></div>
              <div class="profile-stat"><strong>${state.downloads.length}</strong><span>${escapeHtml("Downloads")}</span></div>
            </div>
            <button class="secondary-button" type="button" data-sign-out><i data-lucide="log-out"></i>${escapeHtml("Sair da conta")}</button>
          </aside>
          <div>
            <section class="activity-card">
              <div class="activity-heading"><h2>${escapeHtml("Downloads recentes")}</h2></div>
              <div class="activity-list">${renderDownloadActivity()}</div>
            </section>
            <section class="activity-card">
              <div class="activity-heading"><h2>${escapeHtml("Favoritos recentes")}</h2><a href="#/favorites">${escapeHtml(
                "Ver todos",
              )}</a></div>
              <div class="activity-list">${renderFavoriteActivity()}</div>
            </section>
          </div>
        </div>
      </div>`;
  }

  function adminThumb(item) {
    if (item.demo) return `<div class="atlas-image atlas-${Number(item.atlasIndex) || 0}"></div>`;
    return `<img src="${escapeHtml(safeHttpUrl(item.image_url))}" alt="" loading="lazy" decoding="async" />`;
  }

  function renderAdmin() {
    if (!state.session || !isAdminUser()) {
      renderAccessState("admin");
      return;
    }
    const editingItem = state.items.find((item) => item.id === state.editingItemId && !item.demo);
    const realItems = state.items.filter((item) => !item.demo);
    app.innerHTML = `
      <div class="page">
        <header class="page-heading">
          <div>
            <span class="eyebrow">${escapeHtml("Gestão do catálogo")}</span>
            <h1>${escapeHtml("Painel administrativo")}</h1>
            <p>${escapeHtml("Publique cada item com links diretos para Textura e Mcstructure.")}</p>
          </div>
        </header>
        <div class="admin-layout">
          <section class="admin-form-card">
            <h2>${escapeHtml(editingItem ? "Editar estrutura" : "Nova estrutura")}</h2>
            <p>${escapeHtml("Descrição, imagem por URL e links separados para cada formato.")}</p>
            <form class="admin-form" id="admin-form">
              <label class="field">
                <span>${escapeHtml("Nome da estrutura")}</span>
                <input id="item-name" name="name" type="text" maxlength="100" required placeholder="${escapeHtml(
                  "Ex.: Castelo da Montanha",
                )}" value="${escapeHtml(editingItem?.name || "")}" />
              </label>
              <label class="field">
                <span>${escapeHtml("Categoria")}</span>
                <select id="item-category" name="category" required>
                  ${CATEGORIES.map(
                    (category) => `<option value="${escapeHtml(category)}"${(editingItem?.category || state.filter) === category ? " selected" : ""}>${escapeHtml(category)}</option>`,
                  ).join("")}
                </select>
              </label>
              <label class="field">
                <span>${escapeHtml("Descrição")}</span>
                <textarea id="item-description" name="description" maxlength="500" required>${escapeHtml(editingItem?.description || "")}</textarea>
              </label>
              <label class="field">
                <span>${escapeHtml("URL da imagem")}</span>
                <input id="item-image-url" name="imageUrl" type="url" required value="${escapeHtml(editingItem?.image_url || "")}" placeholder="https://..." />
              </label>
              <label class="field">
                <span>${escapeHtml("Link da Textura")}</span>
                <input id="item-texture-url" name="textureUrl" type="url" required value="${escapeHtml(editingItem?.texture_url || "")}" placeholder="https://..." />
              </label>
              <label class="field">
                <span>${escapeHtml("Link do Mcstructure")}</span>
                <input id="item-mcstructure-url" name="mcstructureUrl" type="url" required value="${escapeHtml(editingItem?.mcstructure_url || "")}" placeholder="https://..." />
              </label>
              <div class="form-actions">
                <button class="primary-button" type="submit"><i data-lucide="${editingItem ? "save" : "upload-cloud"}"></i>${escapeHtml(
                  editingItem ? "Salvar alterações" : "Publicar estrutura",
                )}</button>
                ${editingItem ? `<button class="secondary-button" type="button" data-reset-admin>${escapeHtml("Cancelar edição")}</button>` : ""}
              </div>
            </form>
          </section>
          <section class="admin-list-card">
            <h2>${escapeHtml("Itens publicados")}</h2>
            <p>${escapeHtml("Gerencie as estruturas visíveis no catálogo.")}</p>
            <div class="admin-items">
              ${
                realItems.length
                  ? realItems
                      .map(
                        (item) => `
                    <div class="admin-row">
                      ${adminThumb(item)}
                      <div class="admin-row-info"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.category)}</span></div>
                      <div class="admin-row-actions">
                        <button class="icon-button" type="button" data-edit-id="${escapeHtml(item.id)}" title="${escapeHtml("Editar")}" aria-label="${escapeHtml("Editar")}"><i data-lucide="pencil"></i></button>
                        <button class="icon-button" type="button" data-delete-id="${escapeHtml(item.id)}" title="${escapeHtml("Excluir")}" aria-label="${escapeHtml("Excluir")}"><i data-lucide="trash-2"></i></button>
                      </div>
                    </div>`,
                      )
                      .join("")
                  : `<p class="activity-empty">${escapeHtml("Nenhuma estrutura publicada.")}</p>`
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
    translationManager.queue(app);
    // Preserve focus while search and card actions update their results.
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
    if (!isConfigured || !firebaseAuthApi) {
      showToast("A autenticação ainda não está disponível.", "error");
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
    authDialog.querySelector(".auth-submit span").textContent = state.authMode === "signup" ? "Criar minha conta" : "Entrar";
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (!supabaseClient || !firebaseAuthApi) return;
    const authForm = event.currentTarget;
    const submit = authForm.querySelector("button[type='submit']");
    const feedback = document.getElementById("auth-feedback");
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const username = document.getElementById("auth-name").value.trim();
    submit.disabled = true;
    feedback.className = "auth-feedback";
    feedback.textContent = "Carregando...";

    try {
      const normalizedEmail = email.toLowerCase();
      if (normalizedEmail === ADMIN_EMAIL) {
        if (state.authMode === "signup") {
          throw new Error("A conta administrativa já deve existir no Supabase. Use a aba Entrar.");
        }
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.session) throw new Error("Sessão administrativa não retornada pelo Supabase.");
        if (data.session.user.email?.trim().toLowerCase() !== ADMIN_EMAIL) {
          await supabaseClient.auth.signOut();
          throw new Error("Conta sem permissão administrativa.");
        }
        if (firebaseAuthApi.auth.currentUser) await firebaseAuthApi.signOut(firebaseAuthApi.auth);
        state.authProvider = "supabase";
        state.session = data.session;
      } else {
        const credential = state.authMode === "signup"
          ? await firebaseAuthApi.createUserWithEmailAndPassword(firebaseAuthApi.auth, email, password)
          : await firebaseAuthApi.signInWithEmailAndPassword(firebaseAuthApi.auth, email, password);
        if (state.authMode === "signup" && username) {
          await firebaseAuthApi.updateProfile(credential.user, { displayName: username });
        }
        const { data: supabaseAuth } = await supabaseClient.auth.getSession();
        if (supabaseAuth.session) await supabaseClient.auth.signOut({ scope: "local" });
        state.authProvider = "firebase";
        state.session = await authorizeFirebaseUser(credential.user);
        await ensureFirebaseProfile(username);
      }

      authDialog.close();
      authForm.reset();
      await refreshSessionData(state.session);
    } catch (error) {
      console.error("Erro de autenticação:", error);
      const message = firebaseAuthMessage(error);
      alert(message);
      feedback.classList.add("error");
      feedback.textContent = message;
      feedback.setAttribute("role", "alert");
    } finally {
      submit.disabled = false;
    }
  }

  async function loadItems() {
    if (!supabaseClient) {
      state.items = demoItems;
      return;
    }
    const columns =
      "id,name,slug,description,category,image_url,texture_url,mcstructure_url,downloads,is_published,created_at,updated_at";
    const legacyColumns =
      "id,name,slug,description,category,image_url,texture_url,mcstructure_url,is_published,created_at,updated_at";
    let query = supabaseClient
      .from("items")
      .select(columns)
      .order(state.sort === "downloads" ? "downloads" : "created_at", { ascending: false });
    if (state.sort === "downloads") query = query.order("created_at", { ascending: false });

    let result = await query;
    const downloadsColumnMissing = result.error && /downloads/i.test(`${result.error.code} ${result.error.message}`);
    if (downloadsColumnMissing) {
      result = await supabaseClient.from("items").select(legacyColumns).order("created_at", { ascending: false });
    }
    if (result.error) throw result.error;
    state.items = (result.data || []).map((item) => ({ ...item, downloads: itemDownloads(item) }));
  }

  async function loadUserData() {
    state.profile = null;
    state.favoriteIds = new Set();
    state.favoriteDates = new Map();
    state.downloads = [];
    const client = getDataClient();
    if (!client || !state.session?.user) return;

    const [profileResult, favoritesResult, downloadsResult] = await Promise.all([
      client.from("profiles").select("id,username,role,created_at").eq("id", state.session.user.id).maybeSingle(),
      client.from("favorites").select("item_id,created_at").order("created_at", { ascending: false }),
      client
        .from("download_history")
        .select("id,item_id,format,created_at,items(id,name,category,image_url,texture_url,mcstructure_url)")
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
      showToast("Não foi possível concluir. Tente novamente.", "error");
    }
    updateAdminVisibility();
    updateAccountButton();
    renderRoute();
  }

  async function toggleFavorite(itemId) {
    const client = getDataClient();
    if (!client) {
      showToast("Conecte o Supabase antes de usar contas.", "error");
      return;
    }
    if (!state.session) {
      showToast("Entre para salvar favoritos e histórico.", "info");
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
      ? await client.from("favorites").delete().eq("user_id", state.session.user.id).eq("item_id", itemId)
      : await client.from("favorites").insert({ user_id: state.session.user.id, item_id: itemId });

    if (result.error) {
      if (wasFavorite) state.favoriteIds.add(itemId);
      else state.favoriteIds.delete(itemId);
      renderRoute();
      showToast(result.error.message || "Não foi possível concluir. Tente novamente.", "error");
      return;
    }
    showToast(wasFavorite ? "Estrutura removida dos favoritos." : "Estrutura adicionada aos favoritos.", "success");
  }

  function recordDownload(itemId, format) {
    const client = getDataClient();
    if (!client || !state.session || !isConfigured) return;
    client.from("download_history").insert({
      user_id: state.session.user.id,
      item_id: itemId,
      format,
    }).then(({ error }) => {
      if (error) console.error("Falha ao registrar download:", error);
    });
    state.downloads.unshift({
      id: `pending-${Date.now()}`,
      item_id: itemId,
      format,
      created_at: new Date().toISOString(),
      items: state.items.find((item) => item.id === itemId),
    });
  }

  function updateDownloadCounters(item) {
    const downloads = itemDownloads(item);
    document.querySelectorAll("[data-download-count]").forEach((counter) => {
      if (counter.dataset.downloadCount !== String(item.id)) return;
      const number = counter.querySelector("strong");
      const label = counter.querySelector("[data-download-label]");
      if (number) number.textContent = formatDownloads(downloads);
      if (label) label.textContent = downloadCountLabel(downloads);
    });
  }

  async function incrementDownloadCount(item) {
    if (!supabaseClient || !item || item.demo) return;
    try {
      const { data, error } = await supabaseClient.rpc("increment_item_download", {
        p_item_id: item.id,
      });
      if (error) throw error;
      const confirmedDownloads = Number(data);
      if (!Number.isFinite(confirmedDownloads)) throw new Error("Contagem de downloads inválida.");
      item.downloads = Math.max(itemDownloads(item), confirmedDownloads);
      if (state.route === "home" && state.sort === "downloads") {
        renderHome();
        refreshIcons();
      } else {
        updateDownloadCounters(item);
      }
    } catch (error) {
      console.error("Falha ao incrementar downloads:", error);
      showToast(error?.message || "Não foi possível atualizar o contador de downloads.", "error");
    }
  }

  function itemShareUrl(item) {
    const url = new URL(window.location.href);
    url.hash = `/home?item=${encodeURIComponent(item.slug || item.id)}`;
    return url.toString();
  }

  async function shareItem(item) {
    if (!item) return;
    const shareData = {
      title: `${item.name} | HOLOLAB`,
      text: item.description || "Confira esta estrutura de Minecraft no HOLOLAB.",
      url: itemShareUrl(item),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(shareData.url);
      showToast("Link copiado para compartilhar.", "success");
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Falha ao compartilhar:", error);
        showToast("Não foi possível compartilhar este item.", "error");
      }
    }
  }

  async function changeCatalogSort(select) {
    const nextSort = select.value === "downloads" ? "downloads" : "recent";
    state.sort = nextSort;
    select.disabled = true;
    try {
      await loadItems();
      renderHome();
      refreshIcons();
    } catch (error) {
      console.error("Falha ao ordenar catálogo:", error);
      select.disabled = false;
      showToast("Não foi possível ordenar as estruturas.", "error");
    }
  }

  async function handleAdminSubmit(event) {
    event.preventDefault();
    if (!supabaseClient || !isAdminUser()) return;
    const form = event.currentTarget;
    const submit = form.querySelector("button[type='submit']");
    const name = document.getElementById("item-name").value.trim();
    const category = document.getElementById("item-category").value;
    const description = document.getElementById("item-description").value.trim();
    const imageUrl = safeHttpUrl(document.getElementById("item-image-url").value.trim());
    const textureUrl = safeHttpUrl(document.getElementById("item-texture-url").value.trim());
    const mcstructureUrl = safeHttpUrl(document.getElementById("item-mcstructure-url").value.trim());
    const editingItem = state.items.find((item) => item.id === state.editingItemId);

    if (!imageUrl || !textureUrl || !mcstructureUrl) {
      showToast("Informe URLs HTTPS válidas.", "error");
      return;
    }
    if (!CATEGORIES.includes(category)) {
      showToast("Não foi possível concluir. Tente novamente.", "error");
      return;
    }
    submit.disabled = true;
    try {
      const payload = {
        name,
        category,
        slug: `${slugify(name)}-${String(editingItem?.id || crypto.randomUUID()).slice(0, 8)}`,
        image_url: imageUrl,
        description,
        texture_url: textureUrl,
        mcstructure_url: mcstructureUrl,
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
      showToast(wasEditing ? "Estrutura atualizada com sucesso." : "Estrutura publicada com sucesso.", "success");
    } catch (error) {
      console.error(error);
      showToast(error?.message || "Não foi possível concluir. Tente novamente.", "error");
    } finally {
      submit.disabled = false;
    }
  }

  async function deleteItem() {
    const item = state.items.find((entry) => entry.id === state.pendingDeleteId);
    if (!item || !supabaseClient || !isAdminUser()) return;
    const { error } = await supabaseClient.from("items").delete().eq("id", item.id);
    if (error) {
      showToast(error.message || "Não foi possível concluir. Tente novamente.", "error");
      return;
    }
    state.pendingDeleteId = null;
    if (state.editingItemId === item.id) state.editingItemId = null;
    await loadItems();
    confirmDialog.close();
    renderRoute();
    showToast("Estrutura excluída.", "success");
  }

  async function signOut() {
    if (state.authProvider === "firebase" && firebaseAuthApi) {
      await firebaseAuthApi.signOut(firebaseAuthApi.auth);
    } else if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    state.authProvider = null;
    await refreshSessionData(null);
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
    const share = event.target.closest("[data-share-id]");
    if (share) {
      const item = state.items.find((entry) => entry.id === share.dataset.shareId);
      void shareItem(item);
      return;
    }
    const download = event.target.closest("[data-download-id]");
    if (download) {
      const item = state.items.find((entry) => entry.id === download.dataset.downloadId);
      const format = download.dataset.format;
      const url = item && safeHttpUrl(format === "texture" ? item.texture_url : item.mcstructure_url);
      if (!item || item.demo || !url || !["texture", "mcstructure"].includes(format)) {
        event.preventDefault();
        showToast("Adicione um link real pelo painel admin para iniciar o download.", "info");
        return;
      }
      recordDownload(item.id, format);
      void incrementDownloadCount(item);
      showToast("Download direto iniciado.", "success");
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
      state.filter = "Houses";
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
    const finishCardImageLoading = (event) => {
      if (!(event.target instanceof HTMLImageElement) || !event.target.matches("[data-card-image]")) return;
      event.target.closest(".card-media")?.classList.remove("is-image-loading");
    };
    app.addEventListener("load", finishCardImageLoading, true);
    app.addEventListener("error", finishCardImageLoading, true);
    app.addEventListener("change", (event) => {
      if (event.target.matches("[data-catalog-sort]")) void changeCatalogSort(event.target);
    });
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
      await translationManager.setLanguage(event.target.value);
      renderRoute();
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
    applyLanguage();
    attachEvents();
    translationManager.start();
    void translationManager.setLanguage(translationManager.savedLocale());
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
      try {
        await initializeFirebase();
        firebaseSupabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
          accessToken: async () => firebaseAuthApi.auth.currentUser?.getIdToken(false) ?? null,
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        });
      } catch (error) {
        console.error("Falha ao iniciar o Firebase:", error);
        showToast(error?.message || "Não foi possível iniciar a autenticação.", "error");
      }

      const [{ data }, firebaseUser] = await Promise.all([
        supabaseClient.auth.getSession(),
        firebaseAuthApi ? waitForInitialFirebaseUser() : Promise.resolve(null),
      ]);
      const supabaseSession = data.session;
      const hasAdminSession = supabaseSession?.user?.email?.trim().toLowerCase() === ADMIN_EMAIL;

      if (hasAdminSession) {
        state.authProvider = "supabase";
        state.session = supabaseSession;
      } else if (firebaseUser) {
        try {
          state.authProvider = "firebase";
          state.session = await authorizeFirebaseUser(firebaseUser);
          await ensureFirebaseProfile();
        } catch (error) {
          console.error("Falha ao autorizar a sessão Firebase no Supabase:", error);
          state.authProvider = null;
          state.session = null;
          showToast(error?.message || "Não foi possível sincronizar sua conta.", "error");
        }
      } else if (supabaseSession) {
        // Mantém sessões antigas do Supabase funcionando durante a migração.
        state.authProvider = "supabase";
        state.session = supabaseSession;
      }

      supabaseClient.auth.onAuthStateChange((_event, session) => {
        window.setTimeout(() => {
          const isAdminSession = session?.user?.email?.trim().toLowerCase() === ADMIN_EMAIL;
          if (isAdminSession || state.authProvider !== "firebase") {
            state.authProvider = session ? "supabase" : null;
            void refreshSessionData(session);
          }
        }, 0);
      });

      if (firebaseAuthApi) {
        let initialFirebaseEvent = true;
        firebaseAuthApi.onAuthStateChanged(firebaseAuthApi.auth, (user) => {
          if (initialFirebaseEvent) {
            initialFirebaseEvent = false;
            return;
          }
          window.setTimeout(async () => {
            const { data: currentSupabaseAuth } = await supabaseClient.auth.getSession();
            const adminIsActive = currentSupabaseAuth.session?.user?.email?.trim().toLowerCase() === ADMIN_EMAIL;
            if (adminIsActive) return;
            if (!user) {
              if (state.authProvider === "firebase") {
                state.authProvider = null;
                await refreshSessionData(null);
              }
              return;
            }
            try {
              state.authProvider = "firebase";
              const session = await authorizeFirebaseUser(user);
              state.session = session;
              await ensureFirebaseProfile();
              await refreshSessionData(session);
            } catch (error) {
              console.error("Falha ao atualizar a sessão Firebase:", error);
              showToast(error?.message || "Não foi possível sincronizar sua conta.", "error");
            }
          }, 0);
        });
      }
    }

    try {
      await Promise.all([loadItems(), loadUserData()]);
    } catch (error) {
      console.error(error);
      state.items = [];
      showToast(error?.message || "Não foi possível concluir. Tente novamente.", "error");
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
