/* Animación de scroll del apartado Sistemas (#/sistemas).
   1) El encabezado se aleja y se atenúa un poco al bajar.
   2) Las filas aparecen con un ligero ascenso escalonado al entrar en pantalla.
   Es sutil a propósito y se apaga si la persona pidió reducir el movimiento. */
(function () {
  "use strict";
  var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (quieto) return;
  var vista = document.getElementById("view");
  if (!vista) return;

  var io = null, ticking = false, cabecera = null, FIN = 170;

  function enSistemas() { return /^#\/sistemas(\/|$|\?)/.test(location.hash); }

  function limpiar() {
    if (io) { io.disconnect(); io = null; }
    document.body.classList.remove("sx-activo");
    document.documentElement.style.removeProperty("--sx-p");
    cabecera = null;
  }

  function progreso() {
    ticking = false;
    var p = Math.min(1, Math.max(0, (window.scrollY || 0) / FIN));
    document.documentElement.style.setProperty("--sx-p", p.toFixed(3));
  }
  function alScroll() { if (!ticking) { ticking = true; requestAnimationFrame(progreso); } }

  function iniciar() {
    limpiar();
    if (!enSistemas()) return;
    var filas = Array.prototype.slice.call(vista.querySelectorAll(".rows .row"));
    cabecera = vista.querySelector(".pagehead");
    if (cabecera) { document.body.classList.add("sx-activo"); progreso(); }
    if (!filas.length || !("IntersectionObserver" in window)) return;

    filas.forEach(function (f) { f.classList.add("sx"); });
    var lote = 0, t = null;
    io = new IntersectionObserver(function (entradas) {
      var visibles = entradas.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left; });
      visibles.forEach(function (e, i) {
        var f = e.target;
        f.style.setProperty("--sx-d", Math.min(i, 6) * 55 + "ms");
        f.classList.add("sx-in");
        io.unobserve(f);
        // Al terminar, se quita todo para no interferir con hover, foco ni otros estilos
        setTimeout(function () { f.classList.remove("sx", "sx-in"); f.style.removeProperty("--sx-d"); }, 900 + Math.min(i, 6) * 55);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    filas.forEach(function (f) { io.observe(f); });
  }

  var pendiente = false;
  new MutationObserver(function () {
    if (pendiente) return; pendiente = true;
    requestAnimationFrame(function () { pendiente = false; iniciar(); });
  }).observe(vista, { childList: true });

  window.addEventListener("scroll", alScroll, { passive: true });
  iniciar();
})();
