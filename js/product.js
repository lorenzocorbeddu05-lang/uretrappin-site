/* =========================================================
   PAGINA PRODOTTO — lettura di data/products.json in base al
   parametro ?id= nell'URL (product.html?id=1) e popolamento del
   template in product.html. id è 1-based, nello stesso ordine
   della lista in products.json (e dei nomi file product-N-*.jpg).

   Usa renderProductCard() definita in js/shop.js per la lista
   "Altri prodotti" — questo file va incluso DOPO shop.js.
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

/**
 * Aggiorna titolo e meta description in base al prodotto caricato —
 * l'HTML statico ha valori generici ("Prodotto — U'RE TRAPPIN") per
 * chi non esegue JS, ma la maggior parte dei visitatori/anteprime
 * social vede questi, più utili.
 */
function updateProductMeta(product){
  document.title = `${product.name} — U'RE TRAPPIN`;

  const description = `${product.name} (${product.variant}) — ${product.price}. Disponibile su U're Trappin.`;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) metaDescription.setAttribute('content', description);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', `${product.name} — U'RE TRAPPIN`);

  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) ogDescription.setAttribute('content', description);

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && product.photos[0]) ogImage.setAttribute('content', product.photos[0]);
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

    updateProductMeta(product);

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
    page.innerHTML = '<p class="no-events">Impossibile caricare il prodotto al momento.</p>';
  }
}

loadProductDetail();
