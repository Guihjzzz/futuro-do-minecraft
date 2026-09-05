# Guizz HOLOLAB — atualização da base existente

Os arquivos completos modificados estão em dist/index.html, dist/app.js e dist/styles.css. Nenhuma dependência foi adicionada. A conexão pública existente em dist/config.js foi preservada; não há senha nem service_role no frontend.

## Supabase

1. Faça um backup do banco e execute o arquivo supabase.sql completo no SQL Editor. O script é transacional e preserva os links antigos copiando download_url para texture_url e mcstructure_url. A coluna antiga permanece apenas para compatibilidade. Se registros antigos não tiverem link, a transação falha sem aplicar parcialmente: corrija esses registros e execute novamente.
2. Em Authentication → Providers → Email (ou Sign In / Providers → Email), mantenha Confirm email desativado para que um cadastro válido já retorne uma sessão. O frontend aplica essa sessão e fecha o modal imediatamente.
3. Não altere a role padrão: novos perfis recebem user pelo trigger. A conta admin existente deve manter role admin. O frontend exige o e-mail administrativo e a role; a função RLS também verifica o e-mail atual e confirmado em auth.users.
4. Recarregue o site. No admin, informe nome, categoria, descrição, URL de imagem, link da Textura e link do Mcstructure. Use URLs HTTPS finais.

## Cadastro duplicado

O Supabase impede contas duplicadas. A interface converte os erros user_already_exists/email_exists e identifica a resposta com identities vazias para exibir um alerta amigável. Não há consulta pública à lista de e-mails.

## Idioma do navegador

O seletor PT/EN/ES altera somente o atributo lang do elemento html. Não existem dicionários ou substituições de texto no JavaScript; qualquer oferta de tradução fica a cargo do navegador do visitante.

## Downloads e verificação

Cada botão usa seu próprio campo de URL. A navegação ocorre no clique, sem aguardar o registro de histórico. O servidor do arquivo determina se o navegador salva ou abre o conteúdo; para forçar salvamento, o servidor de origem deve responder com Content-Disposition: attachment.

Documentação: https://supabase.com/docs/reference/javascript/auth-signup
