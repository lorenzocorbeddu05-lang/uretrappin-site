/* =========================================================
   PAGINA PRODOTTO — lettura di data/products.json in base al
   parametro ?id= nell'URL (product.html?id=1) e popolamento del
   template in product.html. id è 1-based, nello stesso ordine
   della lista in products.json (le foto di ogni prodotto sono invece
   elencate esplicitamente nel campo "photos", quindi i nomi file non
   devono per forza seguire l'ordine).

   Usa renderProductCard() definita in js/shop.js per la lista
   "Altri prodotti" — questo file va incluso DOPO shop.js.
   ========================================================= */

function setupProductThumbs(photos, name, mainPhotoEl, thumbsEl){
  thumbsEl.innerHTML = photos.map((src, i) => `
    <img src="${src}" alt="${name} ${i + 1}" class="${i === 0 ? 'active' : ''}" loading="lazy">
  `).join('');

  thumbsEl.querySelectorAll('img').forEach(thumb => {
    thumb.addEventListener('click', () => {
      mainPhotoEl.src = thumb.src;
      thumbsEl.querySelectorAll('img').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
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
 * Elenco delle taglie di un prodotto con lo stato di ciascuna
 * (product.soldOutSizes in data/products.json — vuoto se nessuna
 * taglia è esaurita). Usato sia per popolare il <select> sia da
 * updateAvailability per sapere se la taglia scelta è disponibile.
 */
function isSizeSoldOut(product, size){
  return (product.soldOutSizes || []).includes(size);
}

/**
 * Rigenera le <option> del <select> taglia, segnando quelle esaurite
 * (testo diverso, restano comunque selezionabili — così chi guarda
 * vede che esistono ma non sono disponibili, invece di sparire dalla
 * lista). Richiamata anche al cambio lingua, perché "Esaurito"/"Sold
 * out" è tradotto: mantiene la taglia già scelta dall'utente.
 */
function renderSizeSelect(product, sizeSelect){
  const previous = sizeSelect.value;
  sizeSelect.innerHTML = product.sizes.map(s => {
    const label = isSizeSoldOut(product, s) ? `${s} — ${t('product.soldOut')}` : s;
    return `<option value="${s}">${label}</option>`;
  }).join('');
  if (product.sizes.includes(previous)) sizeSelect.value = previous;
}

/**
 * Aggiorna INSIEME il badge "Disponibile/Esaurito" sotto il prezzo e
 * il pulsante Acquista (testo, link, stato disabilitato) — devono
 * sempre dire la stessa cosa, quindi li calcola in un punto solo
 * invece di due funzioni separate che potrebbero disallinearsi.
 * "Esaurito" scatta se il prodotto intero non è disponibile, oppure
 * (per i prodotti con taglie) se lo è la taglia scelta al momento.
 * Richiamata al cambio taglia e al cambio lingua.
 */
function updateAvailability(product, sizeSelect, availabilityEl, buyButton){
  const hasSizes = product.sizes && product.sizes.length;
  const size = hasSizes ? sizeSelect.value : null;
  const soldOut = !product.available || (hasSizes && isSizeSoldOut(product, size));

  availabilityEl.dataset.i18n = soldOut ? 'product.soldOut' : 'product.available';
  availabilityEl.textContent = t(availabilityEl.dataset.i18n);
  availabilityEl.classList.toggle('is-soldout', soldOut);

  buyButton.href = hasSizes
    ? (product.stripeLinksBySize && product.stripeLinksBySize[size]) || '#'
    : product.stripeLink || '#';
  buyButton.classList.toggle('is-disabled', soldOut);
  buyButton.textContent = t(soldOut ? 'product.soldOut' : 'product.buy');
}

/**
 * Aggiorna titolo e meta description in base al prodotto caricato —
 * l'HTML statico ha valori generici ("Prodotto — U'RE TRAPPIN'") per
 * chi non esegue JS, ma la maggior parte dei visitatori/anteprime
 * social vede questi, più utili.
 */
function updateProductMeta(product){
  document.title = `${product.name} — U'RE TRAPPIN'`;

  const description = `${product.name} (${product.variant}) — ${product.price}. ${t('product.metaAvailable')}`;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) metaDescription.setAttribute('content', description);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', `${product.name} — U'RE TRAPPIN'`);

  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) ogDescription.setAttribute('content', description);

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && product.photos[0]) ogImage.setAttribute('content', product.photos[0]);
}

/* product.details è {it:[...], en:[...]} (non una singola lista, a
   differenza di nome/prezzo/foto che sono uguali in entrambe le lingue)
   — currentLang viene da js/common.js. Il fallback a .it copre il caso
   di un prodotto senza traduzione inglese ancora scritta. */
function renderProductDetails(product){
  const list = product.details[currentLang] || product.details.it;
  document.getElementById('productDetails').innerHTML = list.map(d => `<li>${d}</li>`).join('');
}

async function loadProductDetail(){
  const page = document.getElementById('productPage');
  if (!page) return;

  const id = Number(new URLSearchParams(location.search).get('id'));

  try {
    // t() (testi tradotti) è utilizzabile solo dopo che il dizionario è caricato
    await i18nReady;
    const response = await fetch('data/products.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const products = await response.json();
    const product = products[id - 1];

    if (!product){
      page.innerHTML = '<p class="no-events" data-i18n="product.notFound">Prodotto non trovato.</p>';
      translate(page);
      return;
    }

    updateProductMeta(product);
    renderProductDetails(product);

    document.getElementById('productName').textContent = product.name;
    document.getElementById('productPrice').textContent = product.price;

    const availabilityEl = document.getElementById('productAvailability');
    const mainPhotoEl = document.getElementById('productMainPhoto');
    mainPhotoEl.src = product.photos[0];
    mainPhotoEl.alt = product.name;
    setupProductThumbs(product.photos, product.name, mainPhotoEl, document.getElementById('productThumbs'));

    const sizeField = document.getElementById('sizeField');
    const sizeSelect = document.getElementById('sizeSelect');
    const buyButton = document.getElementById('buyButton');

    if (product.sizes && product.sizes.length){
      renderSizeSelect(product, sizeSelect);
      // Cambiando taglia possono cambiare sia il badge sopra il prezzo
      // che il pulsante, quindi si aggiornano sempre insieme.
      sizeSelect.addEventListener('change', () => updateAvailability(product, sizeSelect, availabilityEl, buyButton));
    } else {
      sizeField.style.display = 'none';
    }
    updateAvailability(product, sizeSelect, availabilityEl, buyButton);

    // Testi che dipendono dalla lingua ("Esaurito"/"Sold out" compreso,
    // sia nel badge sopra sia nelle taglie e nel pulsante): vanno
    // rigenerati se l'utente cambia lingua.
    document.addEventListener('langchange', () => {
      updateProductMeta(product);
      renderProductDetails(product);
      if (product.sizes && product.sizes.length) renderSizeSelect(product, sizeSelect);
      updateAvailability(product, sizeSelect, availabilityEl, buyButton);
    });

    setupProductAccordion();

    const relatedGrid = document.getElementById('relatedProducts');
    if (relatedGrid){
      relatedGrid.innerHTML = products
        .map((p, i) => ({ product: p, cardId: i + 1 }))
        .filter(entry => entry.cardId !== id)
        .map(entry => renderProductCard(entry.product, entry.cardId))
        .join('');
    }
  } catch (err) {
    console.error('Errore nel caricamento di data/products.json:', err);
    page.innerHTML = '<p class="no-events" data-i18n="product.error">Impossibile caricare il prodotto al momento.</p>';
    translate(page);
  }
}

loadProductDetail();
