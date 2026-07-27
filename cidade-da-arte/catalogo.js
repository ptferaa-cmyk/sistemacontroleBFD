console.log("catalogo.js carregou");

const listaProdutos = document.getElementById("lista-produtos");

async function carregarProdutos() {

    const { data, error } = await clienteSupabase
        .from("produtos")
        .select("*")
        .eq("categoria", categoriaPagina)
        .order("id", { ascending: false });

    if (error) {

        console.error("Erro ao buscar produtos:", error);

        listaProdutos.innerHTML = `
            <p style="text-align:center;">
                Não foi possível carregar os produtos.
            </p>
        `;

        return;

    }

    mostrarProdutos(data);

}

function mostrarProdutos(produtos) {

    listaProdutos.innerHTML = "";

    if (produtos.length === 0) {

        listaProdutos.innerHTML = `
            <p style="text-align:center;">
                Ainda não existem produtos nesta categoria.
            </p>
        `;

        return;

    }

    produtos.forEach(produto => {

        listaProdutos.innerHTML += `

            <article class="card">

                <img
                    src="${produto.imagem_url}"
                    alt="${produto.nome}"
                    class="card-img"
                >

                <div class="card-body">

                    <h3 class="card-title">
                        ${produto.nome}
                    </h3>

                    <p class="card-text">
                        ${produto.descricao}
                    </p>

                    <span class="card-price">
                        R$ ${Number(produto.preco).toFixed(2).replace(".", ",")}
                    </span>

                    <br><br>

                    <a
                        href="https://wa.me/SEUNUMERO?text=Olá! Tenho interesse no produto: ${encodeURIComponent(produto.nome)}"
                        target="_blank"
                        class="btn btn-primary"
                    >
                        Solicitar pelo WhatsApp
                    </a>

                </div>

            </article>

        `;

    });

}

carregarProdutos();