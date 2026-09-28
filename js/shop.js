/* =========================================================
   SEZIONE SHOP — lettura di data/products.json e generazione
   automatica delle card prodotto. Usato in shop.html (griglia
   prodotti) e in product.html (lista "Altri prodotti", che riusa
   renderProductCard — per questo product.html include anche questo
   file, non solo product.js).

   Per aggiungere/togliere un prodotto: apri data/products.json e
   modifica la lista. Non serve toccare questo file né shop.html.
   ========================================================= */

function renderProductCard(product, id){
  // Foto mostrata al passaggio del mouse su desktop (vedi
  // .product-photo--hover in CSS): SEMPRE product.hoverPhoto (il
  // modello frontale, impostato a mano in data/products.json), non
  // semplicemente photos[1] — l'ordine delle foto in "photos" mette
  // prima gli scatti di dettaglio/texture e solo dopo il modello, e
  // quante foto di dettaglio ci sono varia da prodotto a prodotto,
  // quindi la posizione del frontale nell'array non è sempre la stessa.
  const hoverSrc = product.hoverPhoto || product.photos[1];
  const hoverPhoto = hoverSrc
    ? `<img class="product-photo product-photo--hover" src="${hoverSrc}" alt="" loading="lazy">`
    : '';

  return `
    <a class="product-card" href="product.html?id=${id}">
      <span class="product-photo-wrap">
        <img class="product-photo" src="${product.photos[0]}" alt="${product.name}" loading="lazy">
        ${hoverPhoto}
      </span>
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
      : '<p class="no-events" data-i18n="shop.empty">Prodotti in arrivo.</p>';
  } catch (err) {
    console.error('Errore nel caricamento di data/products.json:', err);
    grid.innerHTML = '<p class="no-events" data-i18n="shop.error">Impossibile caricare i prodotti al momento.</p>';
  }
  translate(grid);
}

loadProducts();
