// Cidade da Arte — pequenas interações da página (sem dependências externas)

document.addEventListener('DOMContentLoaded', function () {

  // Atualiza o ano do rodapé automaticamente
  var anoAtual = document.getElementById('ano-atual');
  if (anoAtual) {
    anoAtual.textContent = new Date().getFullYear();
  }

  // Adiciona sombra no header quando a página é rolada
  var header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 10);
    });
  }

  // Efeito de fade-in ao rolar a página (categorias, sobre, localização)
  var elementosAnimados = document.querySelectorAll('.section-title, .card, .sobre-text, .localizacao-text');
  elementosAnimados.forEach(function (el) {
    el.classList.add('fade-in');
  });

  var observer = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('is-visible');
        observer.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.15 });

  elementosAnimados.forEach(function (el) {
    observer.observe(el);
  });

});
