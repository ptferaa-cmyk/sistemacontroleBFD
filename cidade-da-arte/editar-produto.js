console.log("editar-produto.js carregou");


const formulario = document.getElementById("formEditarProduto");

const botaoExcluir = document.getElementById("btnExcluirProduto");


const parametros = new URLSearchParams(window.location.search);

const idProduto = parametros.get("id");


let produtoAtual = null;





async function carregarProduto(){


    const { data, error } = await clienteSupabase
        .from("produtos")
        .select("*")
        .eq("id", idProduto)
        .single();



    if(error){


        console.error("Erro ao buscar produto:", error);

        alert("Erro ao carregar produto.");

        return;


    }



    produtoAtual = data;



    document.getElementById("nome").value = data.nome;

    document.getElementById("categoria").value = data.categoria;

    document.getElementById("preco").value = data.preco;

    document.getElementById("descricao").value = data.descricao || "";

    document.getElementById("disponibilidade").value = data.disponibilidade;



}








formulario.addEventListener("submit", async function(evento){


    evento.preventDefault();



    const nome = document.getElementById("nome").value;

    const categoria = document.getElementById("categoria").value;

    const preco = document.getElementById("preco").value;

    const descricao = document.getElementById("descricao").value;

    const disponibilidade = document.getElementById("disponibilidade").value;



    const arquivoImagem = document.getElementById("imagem").files[0];



    let imagemUrl = produtoAtual.imagem_url;





    // Se escolheu uma nova imagem

    if(arquivoImagem){


        const nomeArquivo = Date.now() + "-" + arquivoImagem.name;



        const { error: erroUpload } = await clienteSupabase
            .storage
            .from("imagens-produtos")
            .upload(nomeArquivo, arquivoImagem);





        if(erroUpload){


            console.error(
                "Erro ao enviar imagem:",
                erroUpload
            );


            alert("Erro ao enviar imagem.");

            return;


        }






        const { data } = clienteSupabase
            .storage
            .from("imagens-produtos")
            .getPublicUrl(nomeArquivo);




        imagemUrl = data.publicUrl;



    }








    const { error } = await clienteSupabase
        .from("produtos")
        .update({


            nome: nome,

            categoria: categoria,

            preco: preco,

            descricao: descricao,

            disponibilidade: disponibilidade,

            imagem_url: imagemUrl



        })
        .eq("id", idProduto);








    if(error){


        console.error(
            "Erro ao atualizar:",
            error
        );


        alert("Erro ao salvar alterações.");

        return;


    }





    alert("Produto atualizado com sucesso!");



    window.location.href = "produtos-admin.html";



});









botaoExcluir.addEventListener("click", async function(){



    const confirmar = confirm(
        "Tem certeza que deseja excluir este produto?"
    );



    if(!confirmar){

        return;

    }






    // Remove imagem do Storage

    if(produtoAtual.imagem_url){



        const nomeImagem = produtoAtual.imagem_url
            .split("/imagens-produtos/")
            .pop();





        const { error: erroImagem } = await clienteSupabase
            .storage
            .from("imagens-produtos")
            .remove([
                nomeImagem
            ]);





        if(erroImagem){


            console.error(
                "Erro ao apagar imagem:",
                erroImagem
            );


        }



    }







    // Remove produto da tabela

    const { error } = await clienteSupabase
        .from("produtos")
        .delete()
        .eq("id", idProduto);







    if(error){


        console.error(
            "Erro ao excluir produto:",
            error
        );


        alert("Erro ao excluir produto.");

        return;


    }







    alert("Produto excluído com sucesso!");



    window.location.href = "produtos-admin.html";



});







carregarProduto();