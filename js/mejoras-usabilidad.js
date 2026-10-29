/* GobHub · mejoras de usabilidad progresivas. No sustituye lógica ni modifica datos/permisos. */
(function () {
  "use strict";
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  let scheduled = false;
  function enhanceSearch() {
    [$("#qs"), $("#qv")].filter(Boolean).forEach(input => {
      input.setAttribute("aria-label", "Buscar sistemas por nombre, categoría o actividad");
      input.setAttribute("enterkeyhint", "search");
    });
    const res = $("#res"); if (!res) return;
    let status = $("#gh-search-status");
    if (!status) { status = document.createElement("p"); status.id="gh-search-status"; status.className="gh-search-status"; status.setAttribute("role","status"); status.setAttribute("aria-live","polite"); const search=$(".bigsearch"); if(search) search.insertAdjacentElement("afterend",status); }
    const input=$("#qv")||$("#qs"), value=input?input.value.trim():"";
    const rows=$$(".rows",res); const count=rows.reduce((n,row)=>n+$$('a[href*="#/sistema/"], .row, .sys-row, .srow, .cv-card, .rcard, article',row).length,0);
    if(!value) status.textContent="Escribe una palabra o elige una sugerencia para explorar el catálogo.";
    else if(count>0) status.textContent="Resultados actualizados para «"+value+"». Revisa las opciones que aparecen abajo.";
    else if(/Sin resultados/.test(res.textContent)) status.textContent="No encontramos coincidencias. Prueba con una palabra más corta o una categoría.";
    else status.textContent="";
  }
  function enhanceFicha() {
    const body=$(".fx-body"); if(!body||body.dataset.ghEnhanced==="1") return; body.dataset.ghEnhanced="1";
    const sections=$$(".fx-main > .sec, .fx-side > .sec",body).filter(sec=>$("h2",sec)), links=[];
    sections.forEach((sec,i)=>{const h=$("h2",sec),title=(h.textContent||"").replace(/Editar contenido|Editar/g,"").trim();if(!title)return;const id="gh-ficha-"+i;sec.id=id;links.push({id,title});});
    if(links.length<3)return;
    const nav=document.createElement("nav");nav.className="gh-ficha-nav";nav.setAttribute("aria-label","Ir a una sección de la ficha");
    const esc=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    nav.innerHTML='<span class="gh-ficha-nav-title">En esta ficha</span>'+links.slice(0,7).map(x=>'<a href="#'+x.id+'">'+esc(x.title)+'</a>').join("");
    body.insertAdjacentElement("beforebegin",nav);
    nav.addEventListener("click",e=>{const a=e.target.closest("a");if(!a)return;const target=document.getElementById(decodeURIComponent(a.hash.slice(1)));if(target){e.preventDefault();target.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});}});
  }
  function enhanceRequestForm() {
    const form=$("#form-sol");if(!form||form.dataset.ghEnhanced==="1")return;form.dataset.ghEnhanced="1";
    const groups=$$(".grp",form);if(groups.length<3)return;const labels=["Sistemas","Tus datos","Uso previsto"];
    groups.slice(0,3).forEach((g,i)=>{g.id=g.id||"gh-solicitud-paso-"+(i+1);g.setAttribute("data-gh-step",String(i+1));});
    const progress=document.createElement("nav");progress.className="gh-form-progress";progress.setAttribute("aria-label","Secciones del formulario");
    progress.innerHTML=labels.map((label,i)=>'<a href="#'+groups[i].id+'"><span>'+(i+1)+'</span><b>'+label+'</b></a>').join("");form.insertAdjacentElement("afterbegin",progress);
    progress.addEventListener("click",e=>{const a=e.target.closest("a");if(!a)return;$$("a",progress).forEach(link=>link.removeAttribute("aria-current"));a.setAttribute("aria-current","step");const target=document.getElementById(decodeURIComponent(a.hash.slice(1)));if(target){e.preventDefault();target.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});const first=target.querySelector("input:not([type=hidden]), select, textarea, button");if(first&&matchMedia("(max-width: 900px)").matches)setTimeout(()=>first.focus({preventScroll:true}),250);}});
    const submit=$("#btn-enviar",form),help=document.createElement("p");help.id="gh-form-help";help.className="gh-form-help";help.textContent="Revisa tus datos antes de enviar. Los campos con * son obligatorios.";if(submit){submit.setAttribute("aria-describedby","gh-form-help");submit.insertAdjacentElement("beforebegin",help);}
    const summary=document.createElement("div");summary.className="gh-form-error-summary";summary.id="gh-form-error-summary";summary.setAttribute("role","alert");summary.setAttribute("aria-live","assertive");summary.setAttribute("tabindex","-1");form.insertAdjacentElement("afterbegin",summary);
    form.addEventListener("invalid",e=>{const el=e.target;if(el&&el.matches("input,select,textarea"))el.setAttribute("aria-invalid","true");},true);
    form.addEventListener("submit",()=>{setTimeout(()=>{const invalid=$$('input:invalid,select:invalid,textarea:invalid',form);if(invalid.length){summary.textContent="Hay "+invalid.length+" campo(s) por revisar. Completa los datos marcados y vuelve a intentarlo.";summary.focus({preventScroll:true});invalid.forEach(el=>el.setAttribute("aria-invalid","true"));}else{summary.textContent="";}},100);},true);
  }
  function enhanceAdmin() {
    const panel=$(".admin-panel");if(!panel||panel.dataset.ghEnhanced==="1")return;panel.dataset.ghEnhanced="1";
    const nav=$(".adm-flota .seg");if(nav){nav.setAttribute("aria-label","Herramientas de administración");$$('a',nav).forEach(a=>{const t=a.textContent.trim();a.dataset.ghGroup=/Sistemas|Categorías/.test(t)?"catalogo":/Usuarios|Configuración|Pruebas QA/.test(t)?"gestion":"actividad";});}
    if(!$(".gh-admin-tip",panel)){const tip=document.createElement("div");tip.className="gh-admin-tip";tip.innerHTML='<span class="gh-admin-tip-icon" aria-hidden="true">i</span><div><b>Panel de administración</b><p>Elige una sección arriba para gestionar el catálogo. Los cambios de publicación afectan lo que pueden ver las personas usuarias.</p></div>';panel.insertAdjacentElement("afterbegin",tip);}
  }
  function enhanceAccessibility(){
    if(!$(".gh-skip-link")){
      const skip=document.createElement("a");skip.className="gh-skip-link";skip.href="#view";skip.textContent="Saltar al contenido principal";document.body.insertBefore(skip,document.body.firstChild);
    }
    const main=$("#view");if(main&&!main.hasAttribute("aria-label"))main.setAttribute("aria-label","Contenido principal");
    $$('button, [role="button"], a.iconbtn, a.circ, button.icon-button, button.iconbtn').forEach(el=>{
      if(el.getAttribute("aria-label")||el.getAttribute("aria-labelledby"))return;
      const title=(el.getAttribute("title")||"").trim();
      const visible=(el.textContent||"").trim();
      if(title)el.setAttribute("aria-label",title);
      else if(!visible){const hint=el.querySelector("svg use");if(hint){const id=(hint.getAttribute("href")||hint.getAttribute("xlink:href")||"").replace(/^#/,"");const names={"g-x":"Cerrar","g-search":"Buscar","g-edit":"Editar","g-trash":"Eliminar","g-copy":"Copiar","g-download":"Descargar","g-upload":"Subir archivo","g-share":"Compartir","g-info":"Más información","g-back":"Volver","g-out":"Abrir enlace"};if(names[id])el.setAttribute("aria-label",names[id]);}}
    });
  }
  function enhanceFormsAndMobile(){
    $$('input[type="email"]').forEach(el=>{el.setAttribute("autocomplete",el.getAttribute("autocomplete")||"email");el.setAttribute("autocapitalize","none");el.setAttribute("spellcheck","false");});
    $$('input[type="tel"]').forEach(el=>el.setAttribute("inputmode","tel"));
    $$(".field.bad input, .field.bad select, .field.bad textarea").forEach(el=>el.setAttribute("aria-invalid","true"));
    if(matchMedia("(max-width: 900px)").matches) $$(".iconbtn, .circ, .icon-button").forEach(el=>{if(!el.getAttribute("aria-label")&&el.title)el.setAttribute("aria-label",el.title);});
  }
  function run(){scheduled=false;enhanceSearch();enhanceFicha();enhanceRequestForm();enhanceAdmin();enhanceFormsAndMobile();enhanceAccessibility();}
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(run);}
  document.addEventListener("input",e=>{if(e.target.matches("#qs, #qv"))schedule();});
  document.addEventListener("submit",e=>{if(e.target.id!=="form-sol")return;setTimeout(()=>{const bad=$(".field.bad input, .field.bad select, .field.bad textarea, #selblock .err");if(bad){bad.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});if(bad.focus)bad.focus({preventScroll:true});}},180);},true);
  const observer=new MutationObserver(schedule);observer.observe(document.getElementById("view")||document.body,{childList:true,subtree:true});window.addEventListener("hashchange",schedule);document.addEventListener("DOMContentLoaded",schedule);schedule();
})();
