# Guizz Structures

Plataforma estatica moderna para catalogar e baixar estruturas de Minecraft. O frontend usa Supabase Auth, Database e Storage; os dois botoes de cada card compartilham o mesmo campo `items.download_url`, sem temporizador ou pagina intermediaria.

## Arquivos principais

- `dist/index.html`: shell acessivel da aplicacao.
- `dist/styles.css`: design responsivo em dark mode com acentos vermelho-neon.
- `dist/app.js`: catalogo, idiomas, autenticacao, favoritos, historico e painel admin.
- `dist/config.js`: URL publica e anon key do Supabase.
- `supabase.sql`: schema, triggers, grants, bucket e politicas RLS.

## 1. Preparar o Supabase

1. Crie um projeto em <https://supabase.com/dashboard>.
2. Abra **SQL Editor > New query**.
3. Cole todo o conteudo de `supabase.sql` e clique em **Run**.
4. O script cria as tabelas `items`, `profiles`, `favorites` e `download_history`, alem do bucket publico `item-images` para as thumbnails.

## 2. Criar o administrador

1. No painel do Supabase, abra **Authentication > Users**.
2. Clique em **Add user > Create new user**.
3. Use o e-mail `junindacosta00241@gmail.com` e a senha definida pelo proprietario do site.
4. Marque **Auto Confirm User** e confirme a criacao.
5. Volte ao **SQL Editor** e execute:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'junindacosta00241@gmail.com'
);
```

6. Entre no site com essa conta. A navegacao do painel admin aparece somente quando `profiles.role = 'admin'`.

A senha nao aparece em nenhum arquivo do frontend. Mesmo que alguem tente abrir `#/admin` manualmente, as politicas RLS impedem escrita em `items` e no Storage sem a role correta.

## 3. Conectar URL e Anon Key

1. No Supabase, abra **Project Settings > API**.
2. Copie a **Project URL** e a chave publica **anon / publishable**.
3. Edite `dist/config.js`:

```js
window.__APP_CONFIG__ = {
  SUPABASE_URL: "https://SEU-ID.supabase.co",
  SUPABASE_ANON_KEY: "SUA_CHAVE_PUBLICA_ANON",
};
```

Nunca coloque a chave `service_role` nesse arquivo. A anon key e feita para o navegador; a seguranca real vem das politicas RLS do `supabase.sql`.

## 4. Configurar o Auth para producao

Em **Authentication > URL Configuration**:

- defina **Site URL** com o dominio final, por exemplo `https://www.guizz.xyz`;
- adicione o dominio local/de preview em **Redirect URLs** se usar confirmacao por e-mail;
- mantenha o provedor **Email** ativado.

## 5. Publicar e cadastrar estruturas

Sirva a pasta `dist` em qualquer hospedagem estatica. Depois:

1. entre com a conta administradora;
2. abra **Painel admin**;
3. informe nome, thumbnail e um unico link HTTPS do arquivo;
4. publique.

O sistema salva somente um `download_url`. Tanto **Holoprint** quanto **MCStructure** renderizam esse mesmo valor em `href`, abrindo o download diretamente.

## Seguranca implementada

- RLS ativo em todas as tabelas publicas.
- Usuarios so leem e alteram seus proprios favoritos e historico.
- A coluna `profiles.role` nao pode ser atualizada por usuarios autenticados.
- Escrita em itens e thumbnails exige `public.is_admin()` no banco.
- Chave `service_role` nunca e usada no cliente.
- URLs de imagem e download exigem HTTPS.
- CSP restringe scripts, conexoes e recursos externos.
- Upload de thumbnail limitado a JPG, PNG ou WebP de ate 5 MB.

