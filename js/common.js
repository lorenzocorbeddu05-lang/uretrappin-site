/* ===== SCHERMATA DI CARICAMENTO =====
   L'evento "load" scatta quando la pagina E tutte le sue risorse
   (immagini comprese) hanno finito di caricare — a differenza di
   DOMContentLoaded, che scatta prima, quando magari le foto sono
   ancora in caricamento. Aggiungendo la classe "loaded", il CSS
   (vedi #pageLoader in style.css) fa sparire l'overlay con una
   dissolvenza di 0.5s.

   Aspetta anche che le traduzioni siano applicate (i18nReady, vedi
   sotto): se no chi ha scelto l'inglese vedrebbe per un attimo la
   pagina in italiano appena tolto il loader. */
window.addEventListener('load', () => {
  i18nReady.then(() => {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.classList.add('loaded');
  });
});

/* ===== VIDEO DI SFONDO HERO (prova, vedi index.html) =====
   L'attributo "autoplay" da solo a volte non basta (alcuni browser
   sono più affidabili se il play() viene richiamato anche via JS).
   Se il browser blocca l'autoplay di proposito (es. iOS con Risparmio
   energetico attivo) o il video fallisce per un altro motivo, invece
   di lasciar vedere il video fermo col pulsante play ci nascondiamo:
   sotto c'è già la foto di sfondo originale (.hero::before, la stessa
   usata prima di aggiungere il video), quindi torna visibile da sola,
   senza dover caricare nient'altro.

   Il file video è diverso per mobile e desktop (data-src-mobile /
   data-src-desktop in index.html): lo scegliamo qui in base alla
   larghezza, così il browser scarica solo quello che serve. Se la
   finestra attraversa i 720px (es. rotazione del telefono) si cambia
   file al volo. */
const heroVideo = document.querySelector('.hero-video');
if (heroVideo){
  const mobileQuery = window.matchMedia('(max-width:720px)');
  heroVideo.muted = true;

  const hideVideo = () => heroVideo.classList.add('hero-video--hidden');

  const loadHeroVideo = () => {
    const src = mobileQuery.matches ? heroVideo.dataset.srcMobile : heroVideo.dataset.srcDesktop;
    if (!src) return hideVideo();
    heroVideo.classList.remove('hero-video--hidden');
    heroVideo.src = src;
    const playPromise = heroVideo.play();
    if (playPromise !== undefined) playPromise.catch(hideVideo);
  };

  heroVideo.addEventListener('error', hideVideo);
  mobileQuery.addEventListener('change', loadHeroVideo);
  loadHeroVideo();
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

/* =========================================================
   LINGUA (italiano / inglese)
   Ogni testo traducibile nell'HTML ha un attributo data-i18n="chiave"
   (il testo scritto lì dentro è quello italiano, di riserva); le
   traduzioni vere stanno in data/i18n.json, una sezione per lingua.
   - data-i18n="chiave"            → sostituisce il testo dell'elemento
   - data-i18n-attr="attr:chiave"  → sostituisce un attributo (es.
     "aria-label:nav.menuOpen", "content:meta.home.desc"); più coppie
     separate da virgola.
   Cosa NON viene tradotto di proposito: striscia scorrevole, tagline
   dell'hero, nomi/dettagli prodotto (già in inglese in products.json).

   La lingua scelta viene ricordata nel browser (localStorage); se non
   c'è una scelta salvata si parte in italiano. Per aggiungere/cambiare
   una traduzione basta editare data/i18n.json (stessa chiave in
   entrambe le lingue), non questo file. */
const SUPPORTED_LANGS = ['it', 'en'];
let currentLang = 'it';
try {
  const saved = localStorage.getItem('lang');
  if (SUPPORTED_LANGS.includes(saved)) currentLang = saved;
} catch (err) { /* localStorage non disponibile (es. navigazione privata): resta l'italiano */ }
document.documentElement.lang = currentLang;

let i18nDict = {};

/* Non fallisce mai: se il dizionario non si carica, la pagina resta
   semplicemente nel testo italiano scritto nell'HTML. */
const i18nReady = fetch(ROOT + 'data/i18n.json')
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(dict => {
    i18nDict = dict;
    applyTranslations(document);
  })
  .catch(err => console.error('Errore nel caricamento di data/i18n.json:', err));

function lookup(key){
  const inCurrent = i18nDict[currentLang] && i18nDict[currentLang][key];
  if (inCurrent !== undefined) return inCurrent;
  return i18nDict.it ? i18nDict.it[key] : undefined;
}

/* Come lookup ma restituisce sempre una stringa: per il testo generato
   da JS (js/product.js). Da usare solo dopo "await i18nReady". */
function t(key){
  const value = lookup(key);
  return value !== undefined ? value : key;
}

function applyTranslations(root){
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const value = lookup(el.dataset.i18n);
    if (value !== undefined) el.textContent = value;
  });

  root.querySelectorAll('[data-i18n-attr]').forEach(el => {
    el.dataset.i18nAttr.split(',').forEach(pair => {
      const [attr, key] = pair.split(':').map(part => part.trim());
      const value = lookup(key);
      if (attr && value !== undefined) el.setAttribute(attr, value);
    });
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    const active = btn.dataset.lang === currentLang;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active);
  });
}

/* Per il contenuto inserito dopo il caricamento (es. i messaggi
   generati da js/shop.js e js/product.js): appena inserito, chiamare
   translate(elementoContenitore). */
function translate(root){
  return i18nReady.then(() => applyTranslations(root));
}

function setLang(lang){
  if (!SUPPORTED_LANGS.includes(lang) || lang === currentLang) return;
  currentLang = lang;
  try { localStorage.setItem('lang', lang); } catch (err) { /* vedi sopra */ }
  document.documentElement.lang = lang;
  applyTranslations(document);
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

/* Delegato sul document: i bottoni lingua stanno nella navbar, che
   viene inserita dopo il caricamento della pagina. */
document.addEventListener('click', event => {
  const button = event.target.closest('[data-lang]');
  if (button) setLang(button.dataset.lang);
});

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
    translate(document);
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
