console.log("menu.js carregou");

const btnAbrirMenu = document.getElementById("btnAbrirMenu");
const btnFecharMenu = document.getElementById("btnFecharMenu");
const menuLateral = document.getElementById("menuLateral");
const fundoMenu = document.getElementById("fundoMenu");
const linksMenu = document.querySelectorAll(".menu-lateral-links a");


function abrirMenu() {
    menuLateral.classList.add("menu-aberto");
    fundoMenu.classList.add("fundo-menu-aberto");
    document.body.classList.add("pagina-menu-aberto");
    btnAbrirMenu.setAttribute("aria-expanded", "true");
    menuLateral.setAttribute("aria-hidden", "false");
    btnFecharMenu.focus();
}

function fecharMenu() {
    menuLateral.classList.remove("menu-aberto");
    fundoMenu.classList.remove("fundo-menu-aberto");
    document.body.classList.remove("pagina-menu-aberto");
    btnAbrirMenu.setAttribute("aria-expanded", "false");
    menuLateral.setAttribute("aria-hidden", "true");
}

if (btnAbrirMenu) {
    btnAbrirMenu.addEventListener("click", abrirMenu);
}

if (btnFecharMenu) {
    btnFecharMenu.addEventListener("click", fecharMenu);
}

if (fundoMenu) {
    fundoMenu.addEventListener("click", fecharMenu);
}

linksMenu.forEach(function (link) {
    link.addEventListener("click", fecharMenu);
});

document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") {
        fecharMenu();
    }
});


/* =================================
   SUBMENU EM CASCATA
   ("Nossos produtos" > Quadros/Espelhos > Temas)
================================= */

const botoesSubmenu =
    document.querySelectorAll(".menu-toggle");

botoesSubmenu.forEach(function (botao) {

    botao.addEventListener("click", function () {

        const alvo =
            document.getElementById(botao.dataset.target);

        if (!alvo) {
            return;
        }

        const jaEstaAberto =
            alvo.classList.contains("submenu-aberto");

        if (jaEstaAberto) {

            alvo.classList.remove("submenu-aberto");
            botao.classList.remove("menu-toggle-ativo");

        } else {

            alvo.classList.add("submenu-aberto");
            botao.classList.add("menu-toggle-ativo");
        }
    });
});
