/* Panel izquierdo: atajo del buscador, etiquetas con puntos suspensivos y panel plegable. */
(function () {
  var KEY = "gobhub-panel-mini", root = document.documentElement;
  var side = document.querySelector(".sidebar"); if (!side) return;
  var nav = document.getElementById("sidenav"), box = side.querySelector(".searchbox"), qs = document.getElementById("qs");
  var mac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);

  /* 1 · Atajo visible en el buscador */
  if (box && qs) {
    var k = document.createElement("kbd"); k.className = "kbd-hint"; k.setAttribute("aria-hidden", "true");
    k.textContent = mac ? "⌘K" : "Ctrl K"; box.appendChild(k);
    box.title = "Buscar (" + (mac ? "⌘K" : "Ctrl+K") + ")";
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); if (root.classList.contains("side-mini")) setMini(false); qs.focus(); qs.select();
      }
    });
    box.addEventListener("click", function () { if (root.classList.contains("side-mini")) { setMini(false); qs.focus(); } });
  }

  /* 2 · Etiquetas: texto en <span class="lbl"> (puntos suspensivos) + tooltip con el nombre completo */
  function etiquetar() {
    if (!nav) return;
    nav.querySelectorAll("a").forEach(function (a) {
      var t = null;
      for (var n = a.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.textContent.trim()) { t = n; break; }
      if (t) { var s = document.createElement("span"); s.className = "lbl"; s.textContent = t.textContent.trim(); a.replaceChild(s, t); }
      var l = a.querySelector(".lbl"); if (l && a.title !== l.textContent) a.title = l.textContent;
    });
  }
  if (nav) { etiquetar(); new MutationObserver(function () { etiquetar(); }).observe(nav, { childList: true }); }

  /* 3 · Panel plegable */
  var btn = document.createElement("button");
  btn.type = "button"; btn.className = "side-toggle";
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
  side.appendChild(btn);
  function setMini(v) {
    root.classList.toggle("side-mini", v);
    btn.setAttribute("aria-expanded", String(!v));
    btn.setAttribute("aria-label", v ? "Expandir panel" : "Contraer panel");
    btn.title = v ? "Expandir panel" : "Contraer panel";
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) {}
  }
  btn.addEventListener("click", function () { setMini(!root.classList.contains("side-mini")); });
  setMini(root.classList.contains("side-mini"));
})();
