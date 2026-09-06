import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const ADMIN_EMAIL = "junindacosta00241@gmail.com";

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function adminAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin não está configurado na Vercel.");
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  return getAuth();
}

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return json({ error: "Método não permitido." }, 405);
    }

    const authorization = request.headers.get("authorization") || "";
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return json({ error: "Token de autenticação ausente." }, 401);
    }

    try {
      const auth = adminAuth();
      const decodedToken = await auth.verifyIdToken(match[1], true);
      const normalizedEmail = decodedToken.email?.trim().toLowerCase();

      if (!decodedToken.uid || normalizedEmail === ADMIN_EMAIL) {
        return json({ error: "Esta conta não pode usar a autenticação comum." }, 403);
      }

      const user = await auth.getUser(decodedToken.uid);
      const { admin: _admin, role: _role, ...existingClaims } = user.customClaims || {};

      if (user.customClaims?.role !== "authenticated" || user.customClaims?.admin === true) {
        await auth.setCustomUserClaims(user.uid, {
          ...existingClaims,
          role: "authenticated",
        });
      }

      return json({ ok: true, role: "authenticated" });
    } catch (error) {
      console.error("set-role:", error?.code || error?.message || error);
      const invalidToken = [
        "auth/argument-error",
        "auth/id-token-expired",
        "auth/id-token-revoked",
        "auth/invalid-id-token",
        "auth/user-disabled",
        "auth/user-not-found",
      ].includes(error?.code);
      return json(
        { error: invalidToken ? "Sessão Firebase inválida ou expirada." : "Não foi possível autorizar a conta." },
        invalidToken ? 401 : 500,
      );
    }
  },
};
