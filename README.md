# Guizz HOLOLAB

Marketplace estático e responsivo para texturas e estruturas de Minecraft. O admin usa Supabase Auth; usuários comuns usam Firebase Auth com Third-Party Auth do Supabase. Favoritos, histórico, perfis, itens e RLS permanecem no Supabase.

## Arquivos principais

- `index.html`: entrada do site na raiz para a Vercel.
- `dist/styles.css`: dark mode responsivo com detalhes em vermelho neon.
- `dist/app.js`: catálogo, filtros, seletor de idioma nativo, autenticação, favoritos, histórico e painel admin.
- `dist/config.js`: configurações públicas do Supabase e Firebase.
- `supabase.sql`: tabelas, migração, funções, permissões e políticas RLS.
- `api/set-role.mjs`: Vercel Function que valida o token e atribui o claim `role: authenticated`.
- `package.json`: dependência de servidor `firebase-admin` usada pela Vercel.
- `HOLOLAB-SETUP.md`: roteiro curto de configuração e publicação.

## Preparar o Supabase

1. Abra o projeto no [Supabase Dashboard](https://supabase.com/dashboard).
2. Vá a **SQL Editor > New query**.
3. Cole todo o conteúdo de `supabase.sql` e clique em **Run**.
4. O script cria ou migra `items`, `profiles`, `favorites` e `download_history` de forma transacional.

Itens antigos que usavam `download_url` têm esse valor copiado para `texture_url` e `mcstructure_url`. A coluna legada permanece apenas para compatibilidade.

## Criar o administrador

1. Em **Authentication > Users**, clique em **Add user > Create new user**.
2. Use `junindacosta00241@gmail.com` e uma senha definida somente no painel.
3. Ative **Auto Confirm User** e crie a conta.
4. No SQL Editor, execute:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id::text
  from auth.users
  where email = 'junindacosta00241@gmail.com'
);
```

O link do painel só é renderizado quando o perfil possui `role = 'admin'` e o usuário autenticado tem exatamente esse e-mail. A rota também é protegida, e as políticas RLS repetem a validação no banco. Qualquer cadastro feito pelo site nasce com `role = 'user'`.

## Conectar o frontend

Preencha `dist/config.js` somente com valores públicos:

```js
window.__APP_CONFIG__ = {
  SUPABASE_URL: "https://SEU-ID.supabase.co",
  SUPABASE_ANON_KEY: "SUA_CHAVE_PUBLICA_ANON",
  FIREBASE_CONFIG: {
    apiKey: "SUA_FIREBASE_WEB_API_KEY",
    authDomain: "SEU-PROJETO.firebaseapp.com",
    projectId: "SEU-PROJETO",
    storageBucket: "SEU-PROJETO.firebasestorage.app",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID",
  },
};
```

Nunca coloque a chave `service_role` no navegador. A proteção real das operações vem das políticas RLS.

## Auth híbrido

Ative Email/Password no Firebase, autorize o domínio publicado e registre o projeto `ghuizz-hololab` em **Supabase → Authentication → Third-Party Auth**. Configure `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY` nas variáveis de ambiente da Vercel; a rota `/api/set-role` usa esses segredos somente no servidor.

O seletor PT/EN/ES não mantém traduções no JavaScript: ele altera somente o atributo `lang` do documento para integração com os recursos nativos do navegador.

Em **Authentication > URL Configuration**, configure a **Site URL** com o domínio publicado e inclua os endereços de desenvolvimento necessários em **Redirect URLs**.

## Publicar itens

Publique a raiz do repositório na Vercel. No painel admin, informe:

- nome e descrição;
- uma das quatro categorias: `Houses`, `Decorations`, `Farms` ou `Hologram Pack`;
- URL HTTPS pública da imagem;
- URL HTTPS da Textura;
- URL HTTPS do Mcstructure.

Os links são usados diretamente nos botões do card. Para forçar download em vez de abrir uma página, o servidor de destino deve enviar `Content-Disposition: attachment`.

## Segurança aplicada

- RLS ativo em todas as tabelas públicas.
- Usuários acessam somente seus próprios favoritos e histórico.
- Novos perfis recebem sempre `role = 'user'`.
- Usuários autenticados não podem elevar a própria role.
- Escrita em `items` exige role admin, e-mail exato e e-mail confirmado.
- URLs de imagem e download exigem HTTPS.
- A chave `service_role` não é usada no frontend.
- CSP limita scripts, conexões e recursos externos permitidos.
