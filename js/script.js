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

/* ---------- LIGHTBOX ---------- */
function openLightbox(src){
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox(){
  document.getElementById('lightbox').classList.remove('open');
}

/* ---------- NAV MOBILE ---------- */
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

/* =========================================================
   SEZIONE EVENTI — lettura di data/events.json e generazione
   automatica delle locandine.

   Per aggiungere un evento: apri data/events.json e aggiungi un
   blocco con date/name/location/lineup/booking/photos/poster/info.
   Non serve toccare questo file per aggiungere eventi.
   ========================================================= */

/**
 * Converte una stringa "YYYY-MM-DD" in un oggetto Date a mezzanotte
 * locale (evita problemi di fuso orario rispetto a new Date(str) diretto).
 */
function parseEventDate(dateStr){
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Restituisce la data di oggi a mezzanotte, per confronti puliti. */
function getTodayMidnight(){
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Genera il markup del RETRO della card (info specifiche dell'evento).
 * "location" e "start" sono campi fissi; "details" è una lista libera
 * di {label, value} che puoi riempire come vuoi per ogni evento.
 */
function renderInfoBack(ev, iscrivitiHtml){
  const info = ev.info || {};
  const fixedRows = [];
  if (info.location) fixedRows.push({ label: 'Posizione', value: info.location });
  if (info.start) fixedRows.push({ label: 'Inizio', value: info.start });

  const detailRows = Array.isArray(info.details) ? info.details : [];
  const allRows = [...fixedRows, ...detailRows];

  const rowsHtml = allRows.length
    ? allRows.map(r => `
        <div class="info-back-row">
          <span class="info-back-label">${r.label}</span>
          <span class="info-back-value">${r.value}</span>
        </div>
      `).join('')
    : '<p class="no-events">Info in arrivo.</p>';

  return `
    <div class="card-face card-back">
      <div class="info-back-header">${ev.name}</div>
      <div class="info-back-rows">${rowsHtml}</div>
      <div class="event-actions">
        ${iscrivitiHtml}
        <button class="event-cta card-flip-back" type="button">Indietro</button>
      </div>
    </div>
  `;
}

/**
 * Genera il markup di una singola card evento: fronte (locandina +
 * pulsanti) e retro (info), che si alternano con l'effetto "flip".
 */
function renderEventCard(ev){
  const altText = `Locandina evento: ${ev.name}${ev.location ? ' – ' + ev.location : ''}`;

  // Se c'è un link di prenotazione (booking) mostra "Iscriviti" cliccabile,
  // altrimenti mostra "Iscrizioni a breve" non cliccabile.
  const iscrivitiHtml = ev.booking
    ? `<a class="event-cta" href="${ev.booking}" target="_blank" rel="noopener">Iscriviti</a>`
    : `<span class="event-cta event-cta--disabled" aria-disabled="true">Iscrizioni a breve</span>`;

  return `
    <div class="event-poster-card">
      <div class="card-inner">
        <div class="card-face card-front">
          <img src="${ev.poster}" alt="${altText}" loading="lazy">
          <div class="event-actions">
            ${iscrivitiHtml}
            <button class="event-cta event-cta--info" type="button">Info</button>
          </div>
        </div>
        ${renderInfoBack(ev, iscrivitiHtml)}
      </div>
    </div>
  `;
}

/**
 * Click su "Info" o "Indietro" tramite event delegation su #eventsGrid.
 * Va agganciato una sola volta: funziona anche dopo che le card vengono
 * rigenerate, perché il contenitore stesso non viene mai ricreato.
 */
function setupFlipCardInteractions(){
  const grid = document.getElementById('eventsGrid');
  if (!grid || grid.dataset.flipBound) return;

  grid.addEventListener('click', (e) => {
    const infoBtn = e.target.closest('.event-cta--info');
    const backBtn = e.target.closest('.card-flip-back');

    if (infoBtn){
      e.preventDefault();
      infoBtn.closest('.event-poster-card').classList.add('flipped');
    } else if (backBtn){
      e.preventDefault();
      backBtn.closest('.event-poster-card').classList.remove('flipped');
    }
  });

  grid.dataset.flipBound = 'true';
}

/**
 * Filtra gli eventi FUTURI (data >= oggi), li ordina dal più vicino
 * al più lontano, e li disegna dentro #eventsGrid. Se c'è un solo
 * evento, la card viene centrata (vedi classe "single-event" nel CSS).
 */
function renderUpcomingEvents(events){
  const grid = document.getElementById('eventsGrid');
  const swipeHint = document.querySelector('.events-swipe-hint');
  if (!grid) return;

  const today = getTodayMidnight();

  const upcoming = events
    .filter(ev => parseEventDate(ev.date) >= today)
    .sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date));

  if (upcoming.length === 0){
    grid.innerHTML = '<p class="no-events">Nessun evento in programma al momento — torna presto!</p>';
    grid.classList.remove('single-event');
    if (swipeHint) swipeHint.style.display = 'none';
    return;
  }

  grid.innerHTML = upcoming.map(renderEventCard).join('');

  const isSingle = upcoming.length === 1;
  grid.classList.toggle('single-event', isSingle);
  if (swipeHint) swipeHint.style.display = isSingle ? 'none' : '';
}

/**
 * Punto di ingresso: carica data/events.json e disegna le locandine.
 * NB: fetch() richiede un server locale (Live Server), non funziona
 * aprendo index.html direttamente con doppio click.
 */
async function loadEvents(){
  try {
    const response = await fetch('data/events.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const events = await response.json();

    renderUpcomingEvents(events);
    setupFlipCardInteractions();
  } catch (err) {
    console.error('Errore nel caricamento di data/events.json:', err);
    const grid = document.getElementById('eventsGrid');
    if (grid) grid.innerHTML = '<p class="no-events">Impossibile caricare gli eventi al momento.</p>';
  }
}

loadEvents();

/* =========================================================
   SEZIONE SHOP — lettura di data/products.json e generazione
   automatica delle card prodotto.

   Per aggiungere/togliere un prodotto: apri data/products.json e
   modifica la lista (name/price/photo). Non serve toccare questo
   file né shop.html.
   ========================================================= */

function renderProductCard(product, id){
  return `
    <a class="product-card" href="product.html?id=${id}">
      <img class="product-photo" src="${product.photos[0]}" alt="${product.name}" loading="lazy">
      <span class="product-name">${product.name}</span>
      <span class="product-price">${product.price}</span>
    </a>
  `;
}

async function loadProducts(){
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  try {
    const response = await fetch('data/products.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const products = await response.json();

    grid.innerHTML = products.length
      ? products.map((product, i) => renderProductCard(product, i + 1)).join('')
      : '<p class="no-events">Prodotti in arrivo.</p>';
  } catch (err) {
    console.error('Errore nel caricamento di data/products.json:', err);
    grid.innerHTML = '<p class="no-events">Impossibile caricare i prodotti al momento.</p>';
  }
}

loadProducts();

/* =========================================================
   PAGINA PRODOTTO — lettura di data/products.json in base al
   parametro ?id= nell'URL (product.html?id=1) e popolamento del
   template in product.html. id è 1-based, nello stesso ordine
   della lista in products.json (e dei nomi file product-N-*.jpg).
   ========================================================= */

function setupProductThumbs(photos, mainPhotoEl, thumbsEl){
  thumbsEl.innerHTML = photos.map((src, i) => `
    <img src="${src}" alt="Foto ${i + 1}" class="${i === 0 ? 'active' : ''}" loading="lazy">
  `).join('');

  thumbsEl.querySelectorAll('img').forEach(thumb => {
    thumb.addEventListener('click', () => {
      mainPhotoEl.src = thumb.src;
      thumbsEl.querySelectorAll('img').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
}

function setupProductQty(){
  const qtyValue = document.getElementById('qtyValue');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  if (!qtyValue || !qtyMinus || !qtyPlus) return;

  let qty = 1;
  qtyMinus.addEventListener('click', () => {
    if (qty > 1){
      qty -= 1;
      qtyValue.textContent = qty;
    }
  });
  qtyPlus.addEventListener('click', () => {
    qty += 1;
    qtyValue.textContent = qty;
  });
}

function setupProductAccordion(){
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      trigger.closest('.accordion-item').classList.toggle('open');
    });
  });
}

/**
 * Aggiorna il pulsante "Acquista" in base alla taglia selezionata
 * (product.stripeLinksBySize) o al link unico (product.stripeLink)
 * per i prodotti senza taglie.
 */
function updateBuyButton(product, buyButton, sizeSelect){
  if (product.sizes && product.sizes.length){
    const size = sizeSelect.value;
    buyButton.href = (product.stripeLinksBySize && product.stripeLinksBySize[size]) || '#';
  } else {
    buyButton.href = product.stripeLink || '#';
  }
}

async function loadProductDetail(){
  const page = document.getElementById('productPage');
  if (!page) return;

  const id = Number(new URLSearchParams(location.search).get('id'));

  try {
    const response = await fetch('data/products.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const products = await response.json();
    const product = products[id - 1];

    if (!product){
      page.innerHTML = '<p class="no-events">Prodotto non trovato.</p>';
      return;
    }

    document.title = `${product.name} — U'RE TRAPPIN`;

    document.getElementById('productVariant').textContent = `// ${product.variant}`;
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productPrice').textContent = product.price;

    const availabilityEl = document.getElementById('productAvailability');
    availabilityEl.textContent = product.available ? 'Disponibile' : 'Esaurito';
    availabilityEl.classList.toggle('is-soldout', !product.available);

    const mainPhotoEl = document.getElementById('productMainPhoto');
    mainPhotoEl.src = product.photos[0];
    mainPhotoEl.alt = product.name;
    setupProductThumbs(product.photos, mainPhotoEl, document.getElementById('productThumbs'));

    document.getElementById('productDetails').innerHTML = product.details.map(d => `<li>${d}</li>`).join('');

    const sizeField = document.getElementById('sizeField');
    const sizeSelect = document.getElementById('sizeSelect');
    const buyButton = document.getElementById('buyButton');

    if (product.sizes && product.sizes.length){
      sizeSelect.innerHTML = product.sizes.map(s => `<option value="${s}">${s}</option>`).join('');
      sizeSelect.addEventListener('change', () => updateBuyButton(product, buyButton, sizeSelect));
    } else {
      sizeField.style.display = 'none';
    }
    updateBuyButton(product, buyButton, sizeSelect);

    if (!product.available){
      buyButton.classList.add('is-disabled');
    }

    setupProductQty();
    setupProductAccordion();
  } catch (err) {
    console.error('Errore nel caricamento di data/products.json:', err);
    page.innerHTML = '<p class="no-events">Impossibile caricare il prodotto al momento.</p>';
  }
}

loadProductDetail();
