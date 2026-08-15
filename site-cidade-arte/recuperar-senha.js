console.log("recuperar-senha.js carregou");


const formulario = document.getElementById("formRecuperarSenha");

const botaoEnviar = formulario.querySelector('button[type="submit"]');


formulario.addEventListener("submit", async function (evento) {

    evento.preventDefault();


    const email = document
        .getElementById("email")
        .value
        .trim();


    if (!email) {

        alert("Digite seu e-mail.");

        return;
    }


    botaoEnviar.disabled = true;
    botaoEnviar.textContent = "Enviando...";


    // Endereço para onde o link do e-mail vai levar a pessoa,
    // já dentro do site (troque se o domínio do site mudar).
    const urlRedefinirSenha =
        window.location.origin + "/redefinir-senha.html";


    const { error } = await clienteSupabase.auth.resetPasswordForEmail(
        email,
        {
            redirectTo: urlRedefinirSenha
        }
    );


    botaoEnviar.disabled = false;
    botaoEnviar.textContent = "Enviar link de recuperação";


    if (error) {

        console.error(
            "Erro ao enviar e-mail de recuperação:",
            error
        );

        alert(
            "Não foi possível enviar o e-mail. Tente novamente."
        );

        return;
    }


    // Por segurança, o Supabase sempre responde com sucesso aqui,
    // mesmo que o e-mail não esteja cadastrado — assim ninguém
    // consegue "descobrir" quais e-mails têm login no site.
    alert(
        "Se esse e-mail estiver cadastrado, um link de recuperação foi enviado. Confira sua caixa de entrada (e o spam)."
    );

    window.location.href = "login.html";
});
