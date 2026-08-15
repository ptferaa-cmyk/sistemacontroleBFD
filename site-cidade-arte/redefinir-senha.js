console.log("redefinir-senha.js carregou");


const formulario = document.getElementById("formNovaSenha");

const botaoSalvar = formulario.querySelector('button[type="submit"]');


// Quando a pessoa clica no link do e-mail, o Supabase já cria
// automaticamente uma sessão temporária de recuperação nesta página.
// Se essa sessão não existir, o link é inválido ou já expirou.
async function verificarLinkValido() {

    const { data, error } = await clienteSupabase.auth.getSession();

    if (error || !data.session) {

        alert(
            "Este link de recuperação é inválido ou expirou. Peça um novo link."
        );

        window.location.href = "recuperar-senha.html";
    }
}

verificarLinkValido();


formulario.addEventListener("submit", async function (evento) {

    evento.preventDefault();


    const novaSenha = document
        .getElementById("novaSenha")
        .value;

    const confirmarSenha = document
        .getElementById("confirmarSenha")
        .value;


    if (novaSenha.length < 6) {

        alert("A senha precisa ter pelo menos 6 caracteres.");

        return;
    }


    if (novaSenha !== confirmarSenha) {

        alert("As senhas digitadas não são iguais.");

        return;
    }


    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";


    const { error } = await clienteSupabase.auth.updateUser({
        password: novaSenha
    });


    if (error) {

        console.error(
            "Erro ao redefinir senha:",
            error
        );

        alert(
            "Não foi possível salvar a nova senha. Tente novamente."
        );

        botaoSalvar.disabled = false;
        botaoSalvar.textContent = "Salvar nova senha";

        return;
    }


    alert(
        "Senha alterada com sucesso! Faça login com a nova senha."
    );

    await clienteSupabase.auth.signOut();

    window.location.href = "login.html";
});
