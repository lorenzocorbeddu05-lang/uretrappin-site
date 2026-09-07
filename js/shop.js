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
  // La foto n.2 (se esiste) è sovrapposta alla prima e mostrata al
  // passaggio del mouse su desktop (vedi .product-photo--hover in CSS).
  const hoverPhoto = product.photos[1]
    ? `<img class="product-photo product-photo--hover" src="${product.photos[1]}" alt="" loading="lazy">`
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
      : '<p class="no-events">Prodotti in arrivo.</p>';
  } catch (err) {
    console.error('Errore nel caricamento di data/products.json:', err);
    grid.innerHTML = '<p class="no-events">Impossibile caricare i prodotti al momento.</p>';
  }
}

loadProducts();
