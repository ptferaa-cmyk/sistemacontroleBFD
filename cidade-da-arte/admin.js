console.log("admin.js carregou");



async function verificarLogin(){


    const { data } = await clienteSupabase.auth.getSession();



    if(!data.session){


        window.location.href = "login.html";


    }


}







const btnSair = document.getElementById("btnSair");

const btnAlterarSenha = document.getElementById("btnAlterarSenha");









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








verificarLogin();