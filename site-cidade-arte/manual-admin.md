# Manual de uso — Painel Administrativo

Guia rápido de como usar a área administrativa do site Cidade da Arte.

---

## 1. Fazer login

1. Acesse `login.html`.
2. Digite o e-mail e a senha cadastrados.
3. Clique em **Entrar**.

Se o e-mail ou senha estiverem errados, o site avisa e não deixa entrar.

### Esqueci minha senha

1. Na tela de login, clique em **Esqueci minha senha**.
2. Digite o e-mail cadastrado e clique em **Enviar link de recuperação**.
3. Verifique sua caixa de entrada (e o spam) — um e-mail com um link vai chegar.
4. Ao clicar no link, você será levado para a tela de **Criar nova senha**.
5. Digite a nova senha duas vezes e clique em **Salvar nova senha**.

> Por segurança, o site sempre mostra a mesma mensagem de sucesso, mesmo que o e-mail digitado não esteja cadastrado — assim ninguém descobre quais e-mails têm acesso ao painel.

---

## 2. Painel principal

Após o login, você chega no **Painel Administrativo**, com os seguintes botões:

- **Cadastrar Produto** — adicionar um novo quadro ou espelho ao catálogo
- **Gerenciar Produtos** — ver, buscar, editar e excluir produtos já cadastrados
- **Cadastrar novo login** — criar acesso para outro administrador
- **Alterar senha** — trocar sua própria senha
- **Sair** — encerrar a sessão

---

## 3. Cadastrar um novo produto

1. No painel, clique em **Cadastrar Produto**.
2. Preencha:
   - **Nome do produto**
   - **Categoria**: Quadros ou Espelhos
   - Se for **Quadros**: preencha o preço do Quadro, o preço da Tela e o **Tema**
   - Se for **Espelhos**: preencha apenas o **Preço**
   - **Tamanho** (ex: `40x60cm`) — obrigatório
   - **Descrição** (opcional, mas recomendado)
   - **Imagem** — escolha um arquivo de imagem (até 5 MB)
   - **Disponibilidade**: Em estoque, Sob encomenda ou Indisponível
3. Clique em **Cadastrar Produto**.
4. O produto aparece automaticamente no catálogo do site (`quadros.html` ou `espelhos.html`), exceto se marcado como "Indisponível" — nesse caso ele aparece, mas sem botão de compra.

---

## 4. Editar ou excluir um produto

1. No painel, clique em **Gerenciar Produtos**.
2. Use a barra de pesquisa para localizar um produto por nome, categoria, tema, tamanho ou status.
3. Clique em **Editar** ao lado do produto desejado.
4. Altere os campos necessários (inclusive a imagem, se quiser trocar).
5. Clique em **Salvar alterações**.

### Para excluir

1. Na mesma tela de edição, clique em **Excluir produto**.
2. Confirme a exclusão.

> Ao excluir um produto ou trocar a imagem, a imagem antiga é apagada automaticamente do armazenamento.

---

## 5. Cadastrar um novo login de administrador

1. No painel principal, clique em **Cadastrar novo login**.
2. Digite o e-mail da pessoa.
3. Digite uma senha (mínimo 6 caracteres).
4. Pronto — a nova pessoa já pode fazer login com esses dados em `login.html`.

> É preciso estar logado para usar essa função — se sua sessão tiver expirado, o site vai pedir para você entrar novamente.

---

## 6. Alterar sua senha

1. No painel principal, clique em **Alterar senha**.
2. Digite a nova senha (mínimo 6 caracteres).
3. Após confirmar, você será desconectado automaticamente e precisará entrar de novo com a nova senha.

---

## 7. Sair

Clique em **Sair** no painel principal e confirme. Isso encerra sua sessão — da próxima vez será preciso fazer login novamente.

---

## Dúvidas frequentes

**O produto que cadastrei não aparece no site.**
Confira se a categoria foi selecionada corretamente e se a disponibilidade não está como "Indisponível" com algum filtro de tema ativo na página que esconda ele.

**Não consigo enviar a imagem.**
Verifique se o arquivo é realmente uma imagem (jpg, png, etc.) e se tem no máximo 5 MB.

**Esqueci a senha do painel.**
Siga o passo 1 → "Esqueci minha senha" nesta mesma página.
