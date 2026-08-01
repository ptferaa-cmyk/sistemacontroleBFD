# MARTE ERP — Sistema de Gestão para Molduraria

Sistema de gestão completo para moldurarias: controle de insumos, produtos, receitas de produção, movimentações de estoque e usuários.

**Stack:** Node.js + Express + Prisma + PostgreSQL (backend) · Next.js + React + TypeScript (frontend)

---

## Funcionalidades

- Dashboard com indicadores em tempo real (estoque, alertas, movimentações do dia)
- Cadastro e controle de insumos (com suporte a cores/tintas)
- Cadastro de produtos com upload de imagem e receita de materiais
- Movimentações de estoque (entrada, saída, baixa de produção)
- Histórico de movimentações com responsável registrado
- Alertas automáticos de estoque mínimo
- Gestão de usuários com controle de acesso (admin / funcionário)
- Autenticação JWT com sessão de 8 horas

---

## Estrutura do projeto

```
marte-erp/
├── src/                        # Backend Node.js/Express
│   ├── index.ts                # Entrada e rotas principais
│   ├── routes/
│   │   ├── auth.ts             # Login, /me, troca de senha
│   │   └── usuarios.ts         # CRUD de usuários
│   ├── middleware/
│   │   └── auth.ts             # requireAuth, requireAdmin
│   └── lib/
│       └── prisma.ts           # Cliente Prisma singleton
├── prisma/
│   └── schema.prisma           # Schema do banco de dados
├── dashboard/                  # Frontend Next.js
│   └── src/
│       ├── app/                # Páginas (estoque, quadros, movimentacoes, usuarios)
│       ├── lib/
│       │   └── api.ts          # Cliente de API centralizado
│       └── _components/        # Componentes reutilizáveis
├── uploads/                    # Imagens de produtos (gerado automaticamente)
├── _legacy/                    # Backend Python original (referência, não usar)
├── .env                        # Variáveis de ambiente (não versionar)
├── .env.example                # Modelo de variáveis de ambiente
└── package.json
```

---

## Pré-requisitos

- **Node.js 22+** — [nodejs.org](https://nodejs.org)
- **PostgreSQL 16+** — veja o tutorial abaixo
- **NPM** (incluído com o Node.js)

---

## 1. Instalando o PostgreSQL no Windows

### Passo 1 — Baixar o instalador

Acesse [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) e clique em **Download the installer**.

Escolha a versão **16** (ou superior) para Windows x86-64.

### Passo 2 — Executar o instalador

Abra o arquivo `.exe` baixado e siga os passos:

1. Clique em **Next** nas primeiras telas
2. **Installation Directory** — deixe o padrão (`C:\Program Files\PostgreSQL\16`)
3. **Select Components** — marque apenas:
   - PostgreSQL Server
   - pgAdmin 4 *(interface gráfica, recomendado)*
   - Command Line Tools
4. **Data Directory** — deixe o padrão
5. **Password** — defina a senha do usuário `postgres`. **Guarde essa senha.**
6. **Port** — deixe `5432`
7. Clique em **Next** até finalizar e instale

### Passo 3 — Criar o banco de dados

Abra o **pgAdmin 4** (instalado junto com o PostgreSQL):

1. No painel à esquerda, expanda **Servers → PostgreSQL 16**
2. Digite a senha que você definiu na instalação
3. Clique com o botão direito em **Databases → Create → Database...**
4. Em **Database**, escreva: `estoque`
5. Clique em **Save**

Alternativamente, pelo terminal (cmd ou PowerShell):

```bash
psql -U postgres -c "CREATE DATABASE estoque;"
```

---

## 2. Configurando o projeto

### Passo 1 — Clonar / extrair o projeto

Extraia ou clone o projeto e abra a pasta raiz no terminal.

### Passo 2 — Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
copy .env.example .env
```

Abra o `.env` e ajuste com a senha que você definiu no PostgreSQL:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/estoque?schema=public"
JWT_SECRET="troque-para-um-valor-secreto-longo-e-aleatorio"
PORT=8000
CORS_ORIGINS=http://localhost:3000
```

> **Importante:** troque o valor de `JWT_SECRET` por algo longo e aleatório.
> Gere um valor seguro com o comando abaixo (após instalar o Node.js):
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

### Passo 3 — Instalar dependências do backend

Na raiz do projeto:

```bash
npm install
```

### Passo 4 — Criar as tabelas no banco

```bash
npx prisma db push
```

Se tudo estiver correto, você verá a mensagem `Your database is now in sync with your Prisma schema`.

> O sistema cria automaticamente um usuário administrador no primeiro acesso:
> - **E-mail:** `admin@marte.com`
> - **Senha:** `Admin@1234`
>
> Troque a senha imediatamente após o primeiro login.

---

## 3. Executando o sistema

O sistema precisa de **dois terminais** abertos ao mesmo tempo.

### Terminal 1 — Backend (API)

Na raiz do projeto:

```bash
npm run dev
```

A API ficará disponível em `http://localhost:8000`.

### Terminal 2 — Frontend (Dashboard)

Entre na pasta do dashboard:

```bash
cd dashboard
```

Instale as dependências (apenas na primeira vez):

```bash
npm install
```

Inicie o frontend:

```bash
npm run dev
```

O dashboard ficará disponível em `http://localhost:3000`.

---

## 4. Primeiro acesso

1. Abra o navegador em `http://localhost:3000`
2. Faça login com:
   - **E-mail:** `admin@marte.com`
   - **Senha:** `Admin@1234`
3. Vá em **Usuários → Minha Senha** e troque a senha padrão

---

## 5. Solução de problemas

### Erro ao conectar ao banco

Verifique se o serviço do PostgreSQL está rodando:

1. Pressione `Win + R`, digite `services.msc` e pressione Enter
2. Procure por `postgresql-x64-16`
3. Se estiver parado, clique com o botão direito e selecione **Iniciar**

Confirme também se a senha no `.env` corresponde à senha definida na instalação.

### Erro "Prisma Client não encontrado"

```bash
npx prisma generate
```

### Porta 8000 já está em uso

Altere no `.env`:

```env
PORT=8001
```

E crie um arquivo `dashboard/.env.local` com:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Dashboard não inicia

Apague as pastas de cache e tente novamente:

```bash
cd dashboard
rmdir /s /q .next
npm run dev
```

### Erro de CORS ao abrir o dashboard

Verifique se o backend está rodando na porta correta e se `CORS_ORIGINS` no `.env` aponta para a URL do dashboard (ex: `http://localhost:3000`).

---

## 6. Hospedagem em produção

Para colocar o sistema em um servidor (VPS/nuvem):

1. **JWT_SECRET** — gere um valor aleatório seguro (veja o comando acima)
2. **CORS_ORIGINS** — coloque a URL real do frontend (ex: `https://marte.suaempresa.com.br`)
3. **`NEXT_PUBLIC_API_URL`** no `dashboard/.env.local` — coloque a URL real do backend
4. Use um gerenciador de processo como **PM2** para manter o backend rodando:
   ```bash
   npm install -g pm2
   npm run build
   pm2 start dist/index.js --name marte-backend
   ```
5. Faça o build do frontend:
   ```bash
   cd dashboard
   npm run build
   npm start
   ```

---

## Tecnologias

| Tecnologia   | Uso                          |
|--------------|------------------------------|
| Node.js      | Runtime do backend           |
| Express.js   | Framework HTTP               |
| Prisma ORM   | Acesso ao banco de dados     |
| PostgreSQL   | Banco de dados               |
| Next.js 16   | Framework do frontend        |
| React 19     | Interface                    |
| TypeScript   | Linguagem (frontend + backend)|
| CSS Modules  | Estilização                  |

---

Desenvolvido por **jotasndev** · MARTE ERP
