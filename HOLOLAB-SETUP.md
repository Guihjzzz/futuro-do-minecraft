# Guizz HOLOLAB — autenticação híbrida

O administrador continua no Supabase Auth. Contas comuns usam Firebase Auth e apresentam o JWT do Firebase à API do Supabase para acessar favoritos, histórico e perfil sob RLS. Não há senha nem chave `service_role` no frontend.

## Supabase

1. Faça backup e execute `supabase.sql` inteiro no SQL Editor.
2. Em **Authentication → Third-Party Auth**, adicione Firebase com o Project ID `ghuizz-hololab`.
3. Mantenha a conta admin em Supabase Auth, confirmada e com `role = 'admin'` em `profiles`.

## Firebase e Vercel Function

1. Em Firebase Console → Authentication → Sign-in method, ative Email/Password.
2. Em Authentication → Settings → Authorized domains, adicione o domínio da Vercel.
3. Gere uma chave em Firebase → Configurações do projeto → Contas de serviço → Gerar nova chave privada.
4. Na Vercel → Project → Settings → Environment Variables, cadastre `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY` com os valores do JSON.
5. Faça um novo deployment na Vercel.

A rota `api/set-role.mjs` usa o Admin SDK para validar o ID token e atribuir somente `role: authenticated`. Ela remove qualquer claim `admin` de contas comuns; o administrador continua validado pelo usuário real do Supabase, perfil e e-mail confirmado. O JSON privado nunca deve ser enviado ao GitHub.

## Cadastro e sessão

O Firebase impede contas duplicadas. Após cadastro ou login, o frontend força a renovação do ID token e usa esse JWT no cliente de dados do Supabase. A conta administrativa é recusada no Firebase e entra somente pelo Supabase.

## Idioma do navegador

O seletor PT/EN/ES altera somente o atributo lang do elemento html. Não existem dicionários ou substituições de texto no JavaScript; qualquer oferta de tradução fica a cargo do navegador do visitante.

## Downloads e verificação

Cada botão usa seu próprio campo de URL. A navegação ocorre no clique, sem aguardar o registro de histórico. O servidor do arquivo determina se o navegador salva ou abre o conteúdo; para forçar salvamento, o servidor de origem deve responder com Content-Disposition: attachment.

Documentação: https://supabase.com/docs/reference/javascript/auth-signup
