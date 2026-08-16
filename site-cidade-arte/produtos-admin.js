console.log("produtos-admin.js carregou");

const lista = document.getElementById("lista-produtos-admin");
const pesquisa = document.getElementById("pesquisa-produto");

let produtos = [];

function obterClasseStatus(disponibilidade) {

    if (disponibilidade === "Em estoque") {
        return "status-estoque";
    }

    if (disponibilidade === "Sob encomenda") {
        return "status-encomenda";
    }

    if (disponibilidade === "Indisponível") {
        return "status-indisponivel";
    }

    return "status-consultar";
}

async function carregarProdutos() {

    if (!lista) {
        console.error("Elemento lista-produtos-admin não encontrado.");
        return;
    }

    lista.innerHTML = `
        <p class="mensagem-admin">
            Carregando produtos...
        </p>
    `;

    const { data, error } = await clienteSupabase
        .from("produtos")
        .select("*")
        .order("id", { ascending: false });

    if (error) {

        console.error("Erro ao buscar produtos:", error);

        lista.innerHTML = `
            <p class="mensagem-admin mensagem-erro">
                Erro ao carregar produtos.
            </p>
        `;

        return;
    }

    produtos = data || [];

    mostrarProdutos(produtos);
}

function mostrarProdutos(listaProdutos) {

    lista.innerHTML = `

        <div class="lista-titulo-admin">

            <span>Nome</span>
            <span>Categoria</span>
            <span>Tema</span>
            <span>Tamanho</span>
            <span>Preço</span>
            <span>Status</span>
            <span>Ação</span>

        </div>
    `;

    if (listaProdutos.length === 0) {

        lista.innerHTML += `
            <p class="mensagem-admin">
                Nenhum produto encontrado.
            </p>
        `;

        return;
    }

    listaProdutos.forEach(function(produto) {

        const disponibilidade =
            produto.disponibilidade || "Não informado";

        const classeStatus =
            obterClasseStatus(disponibilidade);

        let textoPreco = "-";
        let textoTema = produto.tema || "Sem tema";

        if (produto.categoria === "Quadros") {

            const precoQuadro = Number(produto.preco_quadro || 0)
                .toFixed(2)
                .replace(".", ",");

            const precoTela = Number(produto.preco_tela || 0)
                .toFixed(2)
                .replace(".", ",");

            textoPreco = `Quadro: R$ ${precoQuadro} / Tela: R$ ${precoTela}`;

        } else {

            const preco = Number(produto.preco || 0)
                .toFixed(2)
                .replace(".", ",");

            textoPreco = `R$ ${preco}`;
        }

        lista.innerHTML += `

            <div class="produto-lista-admin">

                <span data-label="Nome">
                    ${produto.nome || "-"}
                </span>

                <span data-label="Categoria">
                    ${produto.categoria || "-"}
                </span>

                <span data-label="Tema">
                    ${textoTema}
                </span>

                <span data-label="Tamanho">
                    ${produto.tamanho || "-"}
                </span>

                <span data-label="Preço">
                    ${textoPreco}
                </span>

                <span
                    data-label="Status"
                    class="status-produto ${classeStatus}"
                >
                    ${disponibilidade}
                </span>

                <a
                    href="editar-produto.html?id=${produto.id}"
                    class="btn-admin-editar"
                >
                    Editar
                </a>

            </div>
        `;
    });
}

if (pesquisa) {

    pesquisa.addEventListener("input", function() {

        const texto = pesquisa.value
            .toLowerCase()
            .trim();

        const filtrados = produtos.filter(function(produto) {

            const nome = produto.nome || "";
            const categoria = produto.categoria || "";
            const tema = produto.tema || "";
            const tamanho = produto.tamanho || "";
            const disponibilidade = produto.disponibilidade || "";

            return (
                nome.toLowerCase().includes(texto) ||
                categoria.toLowerCase().includes(texto) ||
                tema.toLowerCase().includes(texto) ||
                tamanho.toLowerCase().includes(texto) ||
                disponibilidade.toLowerCase().includes(texto)
            );
        });

        mostrarProdutos(filtrados);
    });
}

carregarProdutos();