console.log("cadastrar-produto.js carregou");

const formulario = document.getElementById("formProduto");
const botaoCadastrar = formulario.querySelector('button[type="submit"]');

const seletorCategoria = document.getElementById("categoria");
const blocoPrecoDuplo = document.getElementById("precoDuplo");
const blocoPrecoUnico = document.getElementById("precoUnico");
const blocoTema = document.getElementById("blocoTema");
const seletorTema = document.getElementById("tema");

function atualizarCamposPreco() {

    const categoriaSelecionada = seletorCategoria.value;

    if (categoriaSelecionada === "Quadros") {

        blocoPrecoDuplo.classList.remove("oculto");
        blocoPrecoUnico.classList.add("oculto");
        blocoTema.classList.remove("oculto");

    } else {

        blocoPrecoDuplo.classList.add("oculto");
        blocoPrecoUnico.classList.remove("oculto");
        blocoTema.classList.add("oculto");
    }
}

seletorCategoria.addEventListener("change", atualizarCamposPreco);

atualizarCamposPreco();

formulario.addEventListener("submit", async function (evento) {

    evento.preventDefault();

    const nome = document
        .getElementById("nome")
        .value
        .trim();

    const categoria =
        document.getElementById("categoria").value;

    const ehQuadro = categoria === "Quadros";

    let precoQuadro = null;
    let precoTela = null;
    let preco = null;
    let tema = null;

    if (ehQuadro) {

        precoQuadro = Number(
            document.getElementById("precoQuadro").value
        );

        precoTela = Number(
            document.getElementById("precoTela").value
        );

        tema = seletorTema.value;

    } else {

        preco = Number(
            document.getElementById("preco").value
        );
    }

    const descricao = document
        .getElementById("descricao")
        .value
        .trim();

    const tamanho = document
        .getElementById("tamanho")
        .value
        .trim();

    const disponibilidade =
        document.getElementById("disponibilidade").value;

    const arquivoImagem =
        document.getElementById("imagem").files[0];

    if (!nome) {
        alert("Digite o nome do produto.");
        return;
    }

    if (!tamanho) {
        alert("Digite o tamanho do produto.");
        return;
    }

    if (ehQuadro) {

        if (!Number.isFinite(precoQuadro) || precoQuadro <= 0) {
            alert("Digite um preço válido para o Quadro.");
            return;
        }

        if (!Number.isFinite(precoTela) || precoTela <= 0) {
            alert("Digite um preço válido para a Tela.");
            return;
        }

        if (!tema) {
            alert("Escolha o tema do quadro.");
            return;
        }

    } else {

        if (!Number.isFinite(preco) || preco <= 0) {
            alert("Digite um preço válido.");
            return;
        }
    }

    if (!arquivoImagem) {
        alert("Escolha uma imagem para o produto.");
        return;
    }

    if (!arquivoImagem.type.startsWith("image/")) {
        alert("O arquivo selecionado precisa ser uma imagem.");
        return;
    }

    const tamanhoMaximo = 5 * 1024 * 1024;

    if (arquivoImagem.size > tamanhoMaximo) {
        alert("A imagem deve ter no máximo 5 MB.");
        return;
    }

    botaoCadastrar.disabled = true;
    botaoCadastrar.textContent = "Cadastrando...";

    let nomeArquivo = null;

    try {

        nomeArquivo =
            Date.now() +
            "-" +
            arquivoImagem.name
                .replace(/\s+/g, "-")
                .replace(/[^a-zA-Z0-9._-]/g, "");

        const { error: erroUpload } =
            await clienteSupabase
                .storage
                .from("imagens-produtos")
                .upload(
                    nomeArquivo,
                    arquivoImagem,
                    {
                        contentType: arquivoImagem.type
                    }
                );

        if (erroUpload) {
            throw erroUpload;
        }

        const { data: dadosImagem } =
            clienteSupabase
                .storage
                .from("imagens-produtos")
                .getPublicUrl(nomeArquivo);

        const imagemUrl = dadosImagem.publicUrl;

        const { error: erroCadastro } =
            await clienteSupabase
                .from("produtos")
                .insert([
                    {
                        nome: nome,
                        categoria: categoria,
                        preco: preco,
                        preco_quadro: precoQuadro,
                        preco_tela: precoTela,
                        tema: tema,
                        tamanho: tamanho,
                        descricao: descricao,
                        imagem_url: imagemUrl,
                        disponibilidade: disponibilidade
                    }
                ]);

        if (erroCadastro) {

            await clienteSupabase
                .storage
                .from("imagens-produtos")
                .remove([nomeArquivo]);

            throw erroCadastro;
        }

        alert("Produto cadastrado com sucesso!");

        formulario.reset();

        atualizarCamposPreco();

        window.location.href = "produtos-admin.html";

    } catch (erro) {

        console.error(
            "Erro ao cadastrar produto:",
            erro
        );

        alert(
            "Não foi possível cadastrar o produto. Tente novamente."
        );

        botaoCadastrar.disabled = false;
        botaoCadastrar.textContent = "Cadastrar Produto";
    }
});