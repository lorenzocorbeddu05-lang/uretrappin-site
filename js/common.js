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

/* ===== VIDEO DI SFONDO HERO (prova, vedi index.html) =====
   L'attributo "autoplay" da solo a volte non basta (alcuni browser
   sono più affidabili se il play() viene richiamato anche via JS).
   Se il browser blocca l'autoplay di proposito (es. iOS con Risparmio
   energetico attivo) o il video fallisce per un altro motivo, invece
   di lasciar vedere il video fermo col pulsante play ci nascondiamo:
   sotto c'è già la foto di sfondo originale (.hero::before, la stessa
   usata prima di aggiungere il video), quindi torna visibile da sola,
   senza dover caricare nient'altro. */
const heroVideo = document.querySelector('.hero-video');
if (heroVideo){
  heroVideo.muted = true;
  const hideVideo = () => heroVideo.classList.add('hero-video--hidden');
  const playPromise = heroVideo.play();
  if (playPromise !== undefined) playPromise.catch(hideVideo);
  heroVideo.addEventListener('error', hideVideo);
}

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

/* ===== STRISCIA ANNUNCIO (marquee) =====
   Il loop senza scatti (vedi @keyframes marquee-scroll in
   css/style.css) funziona solo se ogni "metà" della striscia (i due
   .marquee-content in partials/nav.html) è già larga almeno quanto lo
   schermo: se il contenuto ripetuto è più STRETTO della finestra, a un
   certo punto dello scorrimento non c'è più testo da mostrare finché
   il loop non riparte da capo — è il vuoto/scatto che si vede su
   schermi desktop larghi (sul cellulare non si notava perché lì il
   contenuto era già più largo dello schermo).

   Qui duplichiamo gli elementi delle due metà (stesso numero in
   entrambe, per tenerle sempre della stessa identica larghezza) finché
   ciascuna non supera la larghezza della striscia — qualunque sia,
   anche su un futuro monitor ultra-wide. La durata dell'animazione
   viene poi ricalcolata mantenendo la stessa velocità in pixel/secondo
   di partenza, così la striscia non scorre più veloce su schermi che
   hanno richiesto più duplicati. */
function setupMarquee(){
  const marquee = document.querySelector('.marquee');
  const track = document.querySelector('.marquee-track');
  if (!marquee || !track) return;

  const halfA = track.children[0];
  const halfB = track.children[1];
  if (!halfA || !halfB) return;

  const baseItems = Array.from(halfA.children);
  const baseWidth = halfA.getBoundingClientRect().width;
  if (!baseWidth) return; // niente contenuto o non ancora visibile: non c'è nulla da misurare
  const pxPerSecond = baseWidth / 18; // velocità di riferimento: 18s per il contenuto di partenza

  let guard = 0; // limite di sicurezza, evita loop infiniti in casi limite
  while (halfA.getBoundingClientRect().width < marquee.getBoundingClientRect().width && guard < 20){
    baseItems.forEach(item => {
      halfA.appendChild(item.cloneNode(true));
      halfB.appendChild(item.cloneNode(true));
    });
    guard++;
  }

  track.style.animationDuration = `${halfA.getBoundingClientRect().width / pxPerSecond}s`;
}

let marqueeResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(marqueeResizeTimer);
  marqueeResizeTimer = setTimeout(setupMarquee, 200);
});

loadPartial('partials/nav.html', 'nav-mount', () => {
  setupNav();
  setupMarquee();
});
loadPartial('partials/footer.html', 'footer-mount');
