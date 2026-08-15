console.log("catalogo.js carregou");

const listaProdutos =
    document.getElementById("lista-produtos");

const filtrosTema =
    document.getElementById("filtrosTema");

const NUMERO_WHATSAPP = "557382082439";

/* Guarda todos os produtos já carregados desta categoria,
   para filtrar por tema sem precisar consultar o Supabase de novo. */
let produtosCarregados = [];

/* Tema selecionado no momento ("Todos" = sem filtro). */
let temaSelecionado = "Todos";


/* =================================
   CARREGAR PRODUTOS
================================= */

async function carregarProdutos() {

    if (!listaProdutos) {
        return;
    }

    listaProdutos.innerHTML = `
        <p class="mensagem-catalogo">
            Carregando produtos...
        </p>
    `;

    const { data, error } = await clienteSupabase
        .from("produtos")
        .select("*")
        .eq("categoria", categoriaPagina)
        .order("id", { ascending: false });

    if (error) {

        console.error(
            "Erro ao buscar produtos:",
            error
        );

        listaProdutos.innerHTML = `
            <p class="mensagem-catalogo">
                Não foi possível carregar os produtos.
            </p>
        `;

        return;
    }

    produtosCarregados = data || [];

    aplicarFiltroTema();
}


/* =================================
   FILTRO POR TEMA
================================= */

function aplicarFiltroTema() {

    if (!produtosCarregados) {
        return;
    }

    if (temaSelecionado === "Todos") {
        mostrarProdutos(produtosCarregados);
        return;
    }

    const produtosFiltrados = produtosCarregados.filter(
        function (produto) {
            return produto.tema === temaSelecionado;
        }
    );

    mostrarProdutos(produtosFiltrados);
}


function ativarFiltrosTema() {

    if (!filtrosTema) {
        return;
    }

    const botoesFiltro =
        filtrosTema.querySelectorAll(".filtro-tema");

    botoesFiltro.forEach(function (botao) {

        botao.addEventListener("click", function () {

            temaSelecionado = botao.dataset.tema;

            botoesFiltro.forEach(function (b) {
                b.classList.remove("filtro-tema-ativo");
            });

            botao.classList.add("filtro-tema-ativo");

            aplicarFiltroTema();
        });
    });
}


/* =================================
   MOSTRAR PRODUTOS
================================= */

function mostrarProdutos(produtos) {

    listaProdutos.innerHTML = "";

    if (produtos.length === 0) {

        const mensagemVazio =
            temaSelecionado === "Todos"
                ? "Ainda não existem produtos nesta categoria."
                : `Ainda não existem produtos no tema "${temaSelecionado}".`;

        listaProdutos.innerHTML = `
            <p class="mensagem-catalogo">
                ${mensagemVazio}
            </p>
        `;

        return;
    }

    produtos.forEach(function (produto) {

        const nome =
            produto.nome || "Produto sem nome";

        const descricao =
            produto.descricao ||
            "Entre em contato para obter mais informações.";

        const imagem =
            produto.imagem_url ||
            "https://placehold.co/600x450/F0EBE2/1A1A1A?text=Sem+imagem";

        const disponibilidade =
            produto.disponibilidade ||
            "Consulte disponibilidade";

        const tamanho =
            produto.tamanho || null;

        const categoria =
            produto.categoria || categoriaPagina;

        let classeDisponibilidade =
            "status-consultar";

        if (disponibilidade === "Em estoque") {
            classeDisponibilidade =
                "status-estoque";
        }

        if (disponibilidade === "Sob encomenda") {
            classeDisponibilidade =
                "status-encomenda";
        }

        if (disponibilidade === "Indisponível") {
            classeDisponibilidade =
                "status-indisponivel";
        }

        function montarMensagem(tipoProduto, precoProduto) {

            return encodeURIComponent(
`Olá! Tenho interesse neste produto:

Nome: ${nome}
Categoria: ${categoria}${tipoProduto ? "\nTipo: " + tipoProduto : ""}
Tamanho: ${tamanho || "Consultar"}
Preço: R$ ${precoProduto}
Disponibilidade: ${disponibilidade}
Descrição: ${descricao}
Imagem: ${imagem}`
            );
        }

        let blocoAcao = "";

        if (disponibilidade === "Indisponível") {

            blocoAcao = `
                <div class="acao-produto">
                    <span class="btn-produto-indisponivel">
                        Produto indisponível
                    </span>
                </div>
            `;

        } else if (categoria === "Quadros") {

            const precoQuadro = Number(produto.preco_quadro || 0)
                .toFixed(2)
                .replace(".", ",");

            const precoTela = Number(produto.preco_tela || 0)
                .toFixed(2)
                .replace(".", ",");

            const mensagemQuadro = montarMensagem("Quadro", precoQuadro);
            const mensagemTela = montarMensagem("Tela", precoTela);

            blocoAcao = `
                <div class="opcoes-precos">

                    <div class="opcao-preco">

                        <span class="card-price">
                            Quadro: R$ ${precoQuadro}
                        </span>

                        <a
                            href="https://wa.me/${NUMERO_WHATSAPP}?text=${mensagemQuadro}"
                            target="_blank"
                            rel="noopener"
                            class="btn btn-primary"
                        >
                            Solicitar Quadro
                        </a>

                    </div>

                    <div class="opcao-preco">

                        <span class="card-price">
                            Tela: R$ ${precoTela}
                        </span>

                        <a
                            href="https://wa.me/${NUMERO_WHATSAPP}?text=${mensagemTela}"
                            target="_blank"
                            rel="noopener"
                            class="btn btn-primary"
                        >
                            Solicitar Tela
                        </a>

                    </div>

                </div>
            `;

        } else {

            const preco = Number(produto.preco || 0)
                .toFixed(2)
                .replace(".", ",");

            const mensagem = montarMensagem(null, preco);

            blocoAcao = `
                <div class="informacoes-produto">

                    <span class="card-price">
                        R$ ${preco}
                    </span>

                </div>

                <div class="acao-produto">
                    <a
                        href="https://wa.me/${NUMERO_WHATSAPP}?text=${mensagem}"
                        target="_blank"
                        rel="noopener"
                        class="btn btn-primary"
                    >
                        Solicitar pelo WhatsApp
                    </a>
                </div>
            `;
        }

        listaProdutos.innerHTML += `

            <article class="card">

                <img
                    src="${imagem}"
                    alt="${nome}"
                    class="card-img imagem-com-zoom"
                    loading="lazy"
                    title="Clique para ampliar"
                    tabindex="0"
                    role="button"
                >

                <div class="card-body">

                    <h3 class="card-title">
                        ${nome}
                    </h3>

                    <p class="card-text">
                        ${descricao}
                    </p>

                    ${tamanho ? `
                    <p class="card-tamanho">
                        Tamanho: ${tamanho}
                    </p>
                    ` : ""}

                    <div class="informacoes-produto">

                        <span
                            class="status-produto ${classeDisponibilidade}"
                        >
                            ${disponibilidade}
                        </span>

                    </div>

                    ${blocoAcao}

                </div>

            </article>
        `;
    });

    ativarZoomImagens();
}


/* =================================
   ATIVAR ZOOM NAS IMAGENS
================================= */

function ativarZoomImagens() {

    const imagensProdutos =
        document.querySelectorAll(
            "#lista-produtos .imagem-com-zoom"
        );

    imagensProdutos.forEach(function (imagem) {

        imagem.addEventListener(
            "click",
            function () {

                abrirImagemAmpliada(
                    imagem.src,
                    imagem.alt
                );
            }
        );

        imagem.addEventListener(
            "keydown",
            function (evento) {

                if (
                    evento.key === "Enter" ||
                    evento.key === " "
                ) {

                    evento.preventDefault();

                    abrirImagemAmpliada(
                        imagem.src,
                        imagem.alt
                    );
                }
            }
        );
    });
}


/* =================================
   ABRIR IMAGEM AMPLIADA
================================= */

function abrirImagemAmpliada(
    enderecoImagem,
    textoAlternativo
) {

    const modal =
        document.createElement("div");

    modal.className = "modal-imagem";

    modal.setAttribute(
        "role",
        "dialog"
    );

    modal.setAttribute(
        "aria-modal",
        "true"
    );

    modal.setAttribute(
        "aria-label",
        "Imagem ampliada do produto"
    );

    modal.innerHTML = `

        <button
            type="button"
            class="fechar-modal-imagem"
            aria-label="Fechar imagem ampliada"
        >
            &times;
        </button>

        <img
            src="${enderecoImagem}"
            alt="${textoAlternativo}"
            class="imagem-ampliada"
        >
    `;

    document.body.appendChild(modal);

    document.body.classList.add(
        "modal-aberto"
    );

    const botaoFechar =
        modal.querySelector(
            ".fechar-modal-imagem"
        );

    botaoFechar.focus();

    function fecharModal() {

        modal.remove();

        document.body.classList.remove(
            "modal-aberto"
        );

        document.removeEventListener(
            "keydown",
            fecharComTeclado
        );
    }

    function fecharComTeclado(evento) {

        if (evento.key === "Escape") {
            fecharModal();
        }
    }

    botaoFechar.addEventListener(
        "click",
        fecharModal
    );

    modal.addEventListener(
        "click",
        function (evento) {

            if (evento.target === modal) {
                fecharModal();
            }
        }
    );

    document.addEventListener(
        "keydown",
        fecharComTeclado
    );
}


ativarFiltrosTema();
carregarProdutos();