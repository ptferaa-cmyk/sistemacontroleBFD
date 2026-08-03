console.log("login.js carregou");


const formulario = document.getElementById("formLogin");



formulario.addEventListener("submit", async function(evento){


    evento.preventDefault();



    const email = document.getElementById("email").value;

    const senha = document.getElementById("senha").value;





    const { data, error } = await clienteSupabase.auth.signInWithPassword({

        email: email,

        password: senha

    });







    if(error){


        console.error("Erro no login:", error);


        alert("E-mail ou senha incorretos.");


        return;


    }






    alert("Login realizado com sucesso!");



    window.location.href = "produtos-admin.html";



});