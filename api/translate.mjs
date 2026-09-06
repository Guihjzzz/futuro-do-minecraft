const ALLOWED_LANGUAGES = new Set(["en", "es", "pt"]);
const MAX_TEXTS = 50;
const MAX_TEXT_LENGTH = 3_000;
const MAX_TOTAL_LENGTH = 15_000;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function decodeEntities(value) {
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

export default {
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) return json({ error: "A tradução ainda não foi configurada na Vercel." }, 503);

    try {
      const body = await request.json();
      const targetLanguage = String(body?.targetLanguage || "").toLowerCase();
      const texts = Array.isArray(body?.texts) ? body.texts.map((text) => String(text)) : [];

      if (!ALLOWED_LANGUAGES.has(targetLanguage)) {
        return json({ error: "Idioma de destino inválido." }, 400);
      }
      if (!texts.length || texts.length > MAX_TEXTS) {
        return json({ error: `Envie entre 1 e ${MAX_TEXTS} textos por requisição.` }, 400);
      }
      if (texts.some((text) => !text.trim() || text.length > MAX_TEXT_LENGTH)) {
        return json({ error: "Um dos textos está vazio ou excede o limite permitido." }, 400);
      }
      if (texts.reduce((total, text) => total + text.length, 0) > MAX_TOTAL_LENGTH) {
        return json({ error: "O lote de tradução excede o limite permitido." }, 413);
      }
      if (targetLanguage === "pt") return json({ translations: texts });

      const endpoint = new URL("https://translation.googleapis.com/language/translate/v2");
      endpoint.searchParams.set("key", apiKey);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ q: texts, target: targetLanguage, format: "text" }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Google Translation:", result?.error?.message || response.statusText);
        return json({ error: "O serviço de tradução recusou a requisição." }, 502);
      }

      const translations = result?.data?.translations?.map((entry) => decodeEntities(entry.translatedText));
      if (!Array.isArray(translations) || translations.length !== texts.length) {
        return json({ error: "O serviço retornou uma tradução incompleta." }, 502);
      }

      return json({ translations });
    } catch (error) {
      console.error("translate:", error?.message || error);
      return json({ error: "Não foi possível processar a tradução." }, 500);
    }
  },
};
