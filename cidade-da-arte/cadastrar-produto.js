console.log("cadastrar-produto.js carregou");


const formulario = document.getElementById("formProduto");



formulario.addEventListener("submit", async function(evento){


    evento.preventDefault();



    const nome = document.getElementById("nome").value;

    const categoria = document.getElementById("categoria").value;

    const preco = document.getElementById("preco").value;

    const descricao = document.getElementById("descricao").value;

    const disponibilidade = document.getElementById("disponibilidade").value;

    const arquivoImagem = document.getElementById("imagem").files[0];



    let imagemUrl = null;



    // Enviar imagem para o Storage

    if(arquivoImagem){


        const nomeArquivo = Date.now() + "-" + arquivoImagem.name.replace(/\s/g, "-");



        const { error: erroUpload } = await clienteSupabase
            .storage
            .from("imagens-produtos")
            .upload(nomeArquivo, arquivoImagem, {

                contentType: arquivoImagem.type

            });



        if(erroUpload){


            console.error("Erro ao enviar imagem:", erroUpload);

            alert("Erro ao enviar imagem");

            return;


        }



        const { data } = clienteSupabase
            .storage
            .from("imagens-produtos")
            .getPublicUrl(nomeArquivo);



        imagemUrl = data.publicUrl;


    }




    // Salvar produto no banco


    const { error } = await clienteSupabase
        .from("produtos")
        .insert([{


            nome: nome,

            categoria: categoria,

            preco: preco,

            descricao: descricao,

            imagem_url: imagemUrl,

            disponibilidade: disponibilidade


        }]);





    if(error){


        console.error("Erro ao cadastrar produto:", error);

        alert("Erro ao cadastrar produto");

        return;


    }





    alert("Produto cadastrado com sucesso!");



    formulario.reset();



    window.location.href = "produtos-admin.html";



});