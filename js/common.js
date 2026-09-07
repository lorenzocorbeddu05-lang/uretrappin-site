/* ===== SCHERMATA DI CARICAMENTO =====
   L'evento "load" scatta quando la pagina E tutte le sue risorse
   (immagini comprese) hanno finito di caricare — a differenza di
   DOMContentLoaded, che scatta prima, quando magari le foto sono
   ancora in caricamento. Aggiungendo la classe "loaded", il CSS
   (vedi #pageLoader in style.css) fa sparire l'overlay con una
   dissolvenza di 0.5s. */
window.addEventListener('load', () => {
  const loader = document.getElementById('pageLoader');
  if (loader) loader.classList.add('loaded');
});

/* =========================================================
   NAV E FOOTER CONDIVISI — un solo file sorgente ciascuno
   (partials/nav.html, partials/footer.html) invece di una copia
   incollata in ogni pagina HTML. Ogni pagina ha solo un
   <div id="nav-mount"> / <div id="footer-mount"> che viene
   sostituito con il contenuto del frammento corrispondente.

   {{ROOT}} e {{LEGALI}} dentro i frammenti sono segnaposto per i
   link, sostituiti qui in base alla posizione della pagina corrente
   (root del sito oppure dentro legali/). */
const inLegali = location.pathname.includes('/legali/');
const ROOT = inLegali ? '../' : '';
const LEGALI = inLegali ? '' : 'legali/';

function fillTokens(html){
  return html.replaceAll('{{ROOT}}', ROOT).replaceAll('{{LEGALI}}', LEGALI);
}

async function loadPartial(path, mountId, afterInject){
  const mount = document.getElementById(mountId);
  if (!mount) return;

  try {
    const response = await fetch(ROOT + path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    mount.outerHTML = fillTokens(await response.text());
    if (afterInject) afterInject();
  } catch (err) {
    console.error(`Errore nel caricamento di ${path}:`, err);
  }
}

/* Va richiamata DOPO che la navbar è stata iniettata nel DOM, non
   prima: se no gli elementi #mainNav/#navToggle/#navMenu non esistono
   ancora e gli event listener non si agganciano a nulla. */
function setupNav(){
  const nav = document.getElementById('mainNav');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (navToggle && navMenu){
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const overlay = document.getElementById('menuOverlay');
  if (overlay){
    overlay.addEventListener('click', () => {
      nav.classList.remove('open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    });
  }
}

loadPartial('partials/nav.html', 'nav-mount', setupNav);
loadPartial('partials/footer.html', 'footer-mount');
