console.log("produtos-admin.js carregou");



const lista = document.getElementById("lista-produtos-admin");

const pesquisa = document.getElementById("pesquisa-produto");



let produtos = [];





async function carregarProdutos(){


    if(!lista){

        console.error("Elemento lista-produtos-admin não encontrado.");

        return;

    }




    const { data, error } = await clienteSupabase
        .from("produtos")
        .select("*")
        .order("id", { ascending: false });





    if(error){


        console.error(
            "Erro ao buscar produtos:",
            error
        );


        lista.innerHTML = `

            <p>
                Erro ao carregar produtos.
            </p>

        `;


        return;


    }





    console.log(
        "Produtos encontrados:",
        data
    );





    produtos = data || [];



    mostrarProdutos(produtos);



}








function mostrarProdutos(listaProdutos){



    lista.innerHTML = "";





    lista.innerHTML += `


        <div class="lista-titulo-admin">


            <span>
                Nome
            </span>



            <span>
                Categoria
            </span>



            <span>
                Preço
            </span>



            <span>
                Status
            </span>



            <span>
                Ação
            </span>



        </div>



    `;






    if(listaProdutos.length === 0){


        lista.innerHTML += `


            <p>

                Nenhum produto cadastrado.

            </p>


        `;


        return;


    }








    listaProdutos.forEach(produto => {



        lista.innerHTML += `



            <div class="produto-lista-admin">



                <span>

                    ${produto.nome || "-"}

                </span>




                <span>

                    ${produto.categoria || "-"}

                </span>





                <span>

                    R$ ${Number(produto.preco || 0)
                    .toFixed(2)
                    .replace(".", ",")}

                </span>





                <span>

                    ${produto.disponibilidade || "-"}

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









if(pesquisa){


    pesquisa.addEventListener(
        "input",
        function(){



            const texto = pesquisa.value
                .toLowerCase()
                .trim();





            const filtrados = produtos.filter(produto =>



                (produto.nome || "")
                .toLowerCase()
                .includes(texto)



            );





            mostrarProdutos(filtrados);



        }

    );


}







carregarProdutos();