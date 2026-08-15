console.log("auth.js carregou");

async function protegerPagina() {

    const { data, error } =
        await clienteSupabase.auth.getSession();

    if (error) {

        console.error(
            "Erro ao verificar login:",
            error
        );

        window.location.replace("login.html");

        return;
    }

    if (!data.session) {

        window.location.replace("login.html");

        return;
    }

    document.body.classList.add("pagina-autorizada");

    console.log("Usuário autenticado.");
}

protegerPagina();