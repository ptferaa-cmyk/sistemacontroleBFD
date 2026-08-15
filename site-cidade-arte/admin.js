console.log("admin.js carregou");



const btnSair = document.getElementById("btnSair");

const btnAlterarSenha = document.getElementById("btnAlterarSenha");

const btnNovoLogin = document.getElementById("btnNovoLogin");

// Troque "jzkfpxoibclszoxyffog" apenas se o endereço do seu
// projeto no Supabase (SUPABASE_URL, no supabase.js) mudar um dia.
const URL_FUNCAO_CRIAR_ADMIN =
    "https://jzkfpxoibclszoxyffog.supabase.co/functions/v1/criar-admin";









// =========================
// SAIR
// =========================


if(btnSair){


    btnSair.addEventListener("click", async function(){



        const confirmar = confirm(
            "Deseja sair da conta?"
        );



        if(!confirmar){

            return;

        }





        const { error } = await clienteSupabase.auth.signOut();





        if(error){


            console.error(
                "Erro ao sair:",
                error
            );


            alert(
                "Erro ao sair da conta."
            );


            return;


        }






        window.location.href = "login.html";



    });



}




// =========================
// CADASTRAR NOVO LOGIN
// =========================


if (btnNovoLogin) {


    btnNovoLogin.addEventListener("click", async function () {



        const email = prompt(
            "Digite o e-mail do novo login:"
        );



        if (!email) {
            return;
        }



        const senha = prompt(
            "Digite a senha para esse login (mínimo 6 caracteres):"
        );



        if (!senha) {
            return;
        }



        if (senha.length < 6) {

            alert(
                "A senha precisa ter pelo menos 6 caracteres."
            );

            return;
        }



        const { data: dadosSessao } =
            await clienteSupabase.auth.getSession();



        if (!dadosSessao.session) {

            alert(
                "Sua sessão expirou. Faça login novamente."
            );

            window.location.href = "login.html";

            return;
        }



        btnNovoLogin.disabled = true;
        btnNovoLogin.textContent = "Cadastrando...";



        try {

            const resposta = await fetch(URL_FUNCAO_CRIAR_ADMIN, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        "Bearer " + dadosSessao.session.access_token
                },

                body: JSON.stringify({
                    email: email,
                    senha: senha
                })
            });



            const resultado = await resposta.json();



            if (!resposta.ok) {

                throw new Error(
                    resultado.error || "Erro ao cadastrar o novo login."
                );
            }



            alert(
                "Novo login criado com sucesso para: " +
                resultado.email
            );



        } catch (erro) {

            console.error(
                "Erro ao criar novo login:",
                erro
            );

            alert(
                "Não foi possível criar o novo login. " +
                erro.message
            );



        } finally {

            btnNovoLogin.disabled = false;
            btnNovoLogin.textContent = "Cadastrar novo login";
        }
    });
}









// =========================
// ALTERAR SENHA
// =========================


if(btnAlterarSenha){


    btnAlterarSenha.addEventListener("click", async function(){



        const novaSenha = prompt(
            "Digite sua nova senha:"
        );






        if(!novaSenha){


            return;


        }






        if(novaSenha.length < 6){


            alert(
                "A senha precisa ter pelo menos 6 caracteres."
            );


            return;


        }








        const { error } = await clienteSupabase.auth.updateUser({


            password: novaSenha


        });







        if(error){


            console.error(
                "Erro ao alterar senha:",
                error
            );



            alert(
                "Não foi possível alterar a senha."
            );



            return;


        }








        alert(
            "Senha alterada com sucesso! Você será desconectado."
        );







        await clienteSupabase.auth.signOut();






        window.location.href = "login.html";





    });



}




