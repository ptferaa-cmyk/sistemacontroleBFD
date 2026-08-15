console.log("editar-produto.js carregou");

const formulario = document.getElementById("formEditarProduto");
const botaoExcluir = document.getElementById("btnExcluirProduto");

const seletorCategoria = document.getElementById("categoria");
const blocoPrecoDuplo = document.getElementById("precoDuplo");
const blocoPrecoUnico = document.getElementById("precoUnico");
const blocoTema = document.getElementById("blocoTema");
const seletorTema = document.getElementById("tema");

function atualizarCamposPreco() {

    if (seletorCategoria.value === "Quadros") {

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

const parametros = new URLSearchParams(window.location.search);
const idProduto = parametros.get("id");

let produtoAtual = null;

if (!idProduto) {

    alert("Produto não identificado.");

    window.location.replace("produtos-admin.html");
}

function obterNomeImagem(imagemUrl) {

    if (!imagemUrl) {
        return null;
    }

    const partes = imagemUrl.split("/imagens-produtos/");

    if (partes.length < 2) {
        return null;
    }

    return decodeURIComponent(partes[1]);
}

async function apagarImagem(imagemUrl) {

    const nomeImagem = obterNomeImagem(imagemUrl);

    if (!nomeImagem) {
        return;
    }

    const { error } = await clienteSupabase
        .storage
        .from("imagens-produtos")
        .remove([nomeImagem]);

    if (error) {

        console.error(
            "Erro ao apagar imagem:",
            error
        );
    }
}

async function carregarProduto() {

    const { data, error } = await clienteSupabase
        .from("produtos")
        .select("*")
        .eq("id", idProduto)
        .single();

    if (error || !data) {

        console.error(
            "Erro ao buscar produto:",
            error
        );

        alert("Produto não encontrado.");

        window.location.replace("produtos-admin.html");

        return;
    }

    produtoAtual = data;

    document.getElementById("nome").value =
        data.nome || "";

    document.getElementById("categoria").value =
        data.categoria || "Quadros";

    document.getElementById("precoQuadro").value =
        data.preco_quadro || "";

    document.getElementById("precoTela").value =
        data.preco_tela || "";

    document.getElementById("preco").value =
        data.preco || "";

    seletorTema.value =
        data.tema || "";

    document.getElementById("descricao").value =
        data.descricao || "";

    document.getElementById("tamanho").value =
        data.tamanho || "";

    document.getElementById("disponibilidade").value =
        data.disponibilidade || "Em estoque";

    atualizarCamposPreco();
}

formulario.addEventListener(
    "submit",
    async function(evento) {

        evento.preventDefault();

        if (!produtoAtual) {

            alert("Aguarde o produto terminar de carregar.");

            return;
        }

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

        let imagemUrl = produtoAtual.imagem_url;
        let nomeNovaImagem = null;

        if (arquivoImagem) {

            nomeNovaImagem =
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
                        nomeNovaImagem,
                        arquivoImagem,
                        {
                            contentType: arquivoImagem.type
                        }
                    );

            if (erroUpload) {

                console.error(
                    "Erro ao enviar imagem:",
                    erroUpload
                );

                alert("Erro ao enviar a nova imagem.");

                return;
            }

            const { data } = clienteSupabase
                .storage
                .from("imagens-produtos")
                .getPublicUrl(nomeNovaImagem);

            imagemUrl = data.publicUrl;
        }

        const imagemAntiga = produtoAtual.imagem_url;

        const { error } = await clienteSupabase
            .from("produtos")
            .update({
                nome: nome,
                categoria: categoria,
                preco: preco,
                preco_quadro: precoQuadro,
                preco_tela: precoTela,
                tema: tema,
                tamanho: tamanho,
                descricao: descricao,
                disponibilidade: disponibilidade,
                imagem_url: imagemUrl
            })
            .eq("id", idProduto);

        if (error) {

            console.error(
                "Erro ao atualizar produto:",
                error
            );

            if (nomeNovaImagem) {

                await clienteSupabase
                    .storage
                    .from("imagens-produtos")
                    .remove([nomeNovaImagem]);
            }

            alert("Erro ao salvar as alterações.");

            return;
        }

        if (
            arquivoImagem &&
            imagemAntiga &&
            imagemAntiga !== imagemUrl
        ) {

            await apagarImagem(imagemAntiga);
        }

        alert("Produto atualizado com sucesso!");

        window.location.href = "produtos-admin.html";
    }
);

botaoExcluir.addEventListener(
    "click",
    async function() {

        if (!produtoAtual) {

            alert("Aguarde o produto terminar de carregar.");

            return;
        }

        const confirmar = confirm(
            "Tem certeza que deseja excluir este produto?"
        );

        if (!confirmar) {
            return;
        }

        const imagemProduto = produtoAtual.imagem_url;

        const { error } = await clienteSupabase
            .from("produtos")
            .delete()
            .eq("id", idProduto);

        if (error) {

            console.error(
                "Erro ao excluir produto:",
                error
            );

            alert("Erro ao excluir o produto.");

            return;
        }

        if (imagemProduto) {
            await apagarImagem(imagemProduto);
        }

        alert("Produto excluído com sucesso!");

        window.location.href = "produtos-admin.html";
    }
);

carregarProduto();