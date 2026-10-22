/* Flechas de la galería «Vista previa» de cada sistema (se agregan solas al aparecer una galería). */
(function(){
  var SVGL='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
      SVGR='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  function paso(g){var a=g.children[0],b=g.children[1];return a&&b?(b.offsetLeft-a.offsetLeft):g.clientWidth;}
  function mk(cls,lbl,html){var b=document.createElement('button');b.type='button';b.className='gal2-arrow '+cls;b.setAttribute('aria-label',lbl);b.innerHTML=html;return b;}
  function setup(g){
    if(g.__gal2) return; g.__gal2=true;
    var w=g.closest('.gal-wrap')||g.parentElement; if(!w) return; var olds=w.querySelectorAll('.gal-arrow'); for(var k=0;k<olds.length;k++) olds[k].remove();
    if(!w.classList.contains('gal-wrap')) w.classList.add('gal-wrap');
    var p=mk('gal2-prev','Imagen anterior',SVGL), n=mk('gal2-next','Imagen siguiente',SVGR);
    w.appendChild(p); w.appendChild(n);
    function act(){var max=g.scrollWidth-g.clientWidth; p.disabled=g.scrollLeft<=2; n.disabled=g.scrollLeft>=max-2;}
    p.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();g.scrollBy({left:-paso(g),behavior:'smooth'});});
    n.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();g.scrollBy({left:paso(g),behavior:'smooth'});});
    g.addEventListener('scroll',act,{passive:true});
    if('ResizeObserver' in window) new ResizeObserver(act).observe(g);
    g.addEventListener('load',act,true);
    act(); setTimeout(act,300);
  }
  function scan(){var l=document.querySelectorAll('.gallery');for(var i=0;i<l.length;i++) setup(l[i]);}
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  scan();
})();
