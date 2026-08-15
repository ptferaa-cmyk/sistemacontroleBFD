# Cidade da Arte

🔗 **Site no ar:** [cidade-da-arte.netlify.app](https://cidade-da-arte.netlify.app)

Site institucional e painel administrativo da **Cidade da Arte**, loja de fábrica de quadros e espelhos decorativos em Ilhéus, BA.

O projeto é composto por:

- **Site público**: catálogo de Quadros e Espelhos, com pedido finalizado via WhatsApp (sem carrinho/checkout).
- **Painel administrativo**: área protegida por login para cadastrar, editar e excluir produtos.

---

## 🛠️ Tecnologias

- HTML5, CSS3 e JavaScript puro (sem frameworks/build step)
- [Supabase](https://supabase.com) como backend:
  - **Auth** — login do painel administrativo
  - **Database (Postgres)** — tabela `produtos`
  - **Storage** — upload das imagens dos produtos
  - **Edge Functions** — criação de novos logins de admin
- [Netlify](https://netlify.com) para hospedagem/deploy do site

---

## 📁 Estrutura de páginas

| Arquivo | Descrição |
|---|---|
| `index.html` | Página inicial (landing page) |
| `quadros.html` | Catálogo de quadros (com filtro por tema) |
| `espelhos.html` | Catálogo de espelhos |
| `login.html` | Login da área administrativa |
| `recuperar-senha.html` | Solicitar link de recuperação de senha |
| `redefinir-senha.html` | Definir nova senha (via link do e-mail) |
| `admin.html` | Painel principal (protegido) |
| `cadastrar-produto.html` | Cadastro de novo produto (protegido) |
| `editar-produto.html` | Edição/exclusão de produto (protegido) |
| `produtos-admin.html` | Listagem/gerenciamento de produtos (protegido) |

Páginas com `class="pagina-protegida"` no `<body>` exigem login (ver `auth.js`).

### Scripts

| Arquivo | Função |
|---|---|
| `supabase.js` | Configuração do cliente Supabase (URL + chave pública) |
| `auth.js` | Protege as páginas administrativas, redireciona se não houver sessão |
| `catalogo.js` | Carrega e exibe os produtos nas páginas de catálogo |
| `login.js` | Login |
| `recuperar-senha.js` / `redefinir-senha.js` | Fluxo de recuperação de senha |
| `admin.js` | Sair, alterar senha, cadastrar novo login de admin |
| `cadastrar-produto.js` / `editar-produto.js` | Cadastro e edição de produtos |
| `produtos-admin.js` | Listagem, busca e gerenciamento de produtos no painel |

---

## ⚙️ Configuração (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em `supabase.js`, configure:
   - `SUPABASE_URL`: URL do seu projeto
   - `SUPABASE_KEY`: a **publishable key** (chave pública/anon) do projeto — **essa chave é feita para ser pública**, pode ficar no código sem problema, desde que as políticas de RLS estejam corretas.
3. Crie a tabela `produtos` — veja [`schema.sql`](./schema.sql) para o script completo.
4. Crie um bucket de Storage chamado `imagens-produtos` (público para leitura).
5. Configure a Edge Function `criar-admin`, usada pelo botão "Cadastrar novo login" no painel (permite criar outros usuários administradores).
6. Ative **Row Level Security (RLS)** na tabela `produtos` com as políticas descritas em `schema.sql`.

> Veja o diagrama de entidades em [`DER.md`](./DER.md) para entender a estrutura de dados.

---

## ▶ Como rodar localmente

Por ser um site estático, basta servir os arquivos com qualquer servidor HTTP simples. Exemplo:

```bash
# usando Python
python3 -m http.server 8000

# ou usando a extensão Live Server do VS Code
```

Depois acesse `http://localhost:8000`.

> **Importante:** os fluxos de login, catálogo e painel dependem do Supabase configurado (passo acima). Sem isso, as páginas carregam mas as funcionalidades de dados não funcionam.

---

##  Deploy (Netlify)

O site está hospedado no Netlify em **[cidade-da-arte.netlify.app](https://cidade-da-arte.netlify.app)**.

Como é um site estático (sem build step), o deploy é direto:

- O Netlify publica os arquivos da raiz do repositório como estão.
- Não é necessário nenhum comando de build nem arquivo `netlify.toml` — basta conectar o repositório do GitHub ao projeto Netlify e cada `git push` na branch principal gera um novo deploy automaticamente.
- As configurações do Supabase (URL/chave) ficam direto no `supabase.js`, então não é preciso configurar variáveis de ambiente no Netlify para o site funcionar.

---

## 📖 Documentação adicional

- [`DER.md`](./DER.md) — Diagrama de Entidade-Relacionamento do banco de dados
- [`schema.sql`](./schema.sql) — Script SQL da tabela `produtos` e políticas de acesso
- [`manual-admin.md`](./manual-admin.md) — Manual de uso do painel administrativo

---

## 📄 Licença

Projeto de uso interno da Cidade da Arte. Todos os direitos reservados.
Desenvolvido por [@vivianrcdev](https://github.com/vivianrcdev)
