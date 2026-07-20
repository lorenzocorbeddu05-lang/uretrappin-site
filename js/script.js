  function openLightbox(src){
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox').classList.add('open');
  }
  function closeLightbox(){
    document.getElementById('lightbox').classList.remove('open');
  }

  const nav = document.getElementById('mainNav');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

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

  const overlay = document.getElementById("menuOverlay");

  overlay.addEventListener("click", () => {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
  });

/* =========================================================
   GESTIONE DINAMICA EVENTI E FOTO — data/events.json
   ========================================================= */

/**
 * Converte una stringa "YYYY-MM-DD" in un oggetto Date
 * impostato a mezzanotte locale (evita problemi di fuso orario
 * che si avrebbero con new Date("YYYY-MM-DD") diretto).
 */
function parseEventDate(dateStr){
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Restituisce la data odierna a mezzanotte, per confronti puliti. */
function getTodayMidnight(){
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Da un oggetto Date estrae {dd, mm} con zero iniziale. */
function formatDayMonth(dateObj){
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  return { dd, mm };
}

/**
 * Genera il markup di una singola card evento (sezione "Eventi").
 * La locandina è l'elemento principale; nessuna informazione testuale
 * viene duplicata, dato che è già presente nella grafica stessa.
 */
/**
 * Genera il markup del RETRO della card (info specifiche dell'evento).
 * Combina i campi fissi (location, start) con la lista libera "details",
 * cosi' si possono aggiungere nuovi campi in events.json senza toccare il codice.
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
 * Genera il markup di una singola card evento (sezione "Eventi").
 * La card ha due facce: fronte (locandina + pulsanti) e retro (info),
 * che si alternano con un effetto "flip" quando si preme "Info".
 */
function renderEventCard(ev){
  const altText = `Locandina evento: ${ev.name}${ev.location ? ' – ' + ev.location : ''}`;

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
 * Gestisce il click sui pulsanti "Info" e "← Indietro" tramite event
 * delegation sul contenitore #eventsGrid. Va agganciato una sola volta:
 * funziona anche dopo che le card vengono rigenerate, perche' il
 * contenitore stesso non viene mai ricreato, solo il suo contenuto.
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
 * Genera il markup di una riga nell'archivio foto (Google Drive).
 */
function renderDriveRow(ev){
  const { dd, mm } = formatDayMonth(parseEventDate(ev.date));
  return `
    <div class="drive-row">
      <span class="drive-date bubble-num">${dd}/${mm}</span>
      <span class="drive-name">${ev.name}</span>
      <a class="drive-link" href="${ev.photos}" target="_blank" rel="noopener">Apri cartella →</a>
    </div>
  `;
}

/**
 * Filtra e ordina gli eventi FUTURI (data >= oggi), dal più vicino al più lontano,
 * e li disegna dentro #eventsGrid.
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
 * Filtra gli eventi PASSATI con foto disponibili, li ordina dal più recente
 * al più lontano, mostra i primi 3 come "ultime foto" e sposta il resto
 * in un archivio nascosto, espandibile tramite pulsante.
 */
function renderPhotoArchive(events){
  const recentContainer = document.getElementById('drivePhotosRecent');
  const archiveContainer = document.getElementById('drivePhotosArchive');
  const archiveWrapper = document.getElementById('archiveWrapper');
  const archiveToggle = document.getElementById('archiveToggle');
  if (!recentContainer || !archiveContainer || !archiveWrapper) return;

  const today = getTodayMidnight();

  const pastWithPhotos = events
    .filter(ev => parseEventDate(ev.date) < today && ev.photos)
    .sort((a, b) => parseEventDate(b.date) - parseEventDate(a.date)); // più recente prima

  const recent = pastWithPhotos.slice(0, 3);
  const archived = pastWithPhotos.slice(3);

  recentContainer.innerHTML = recent.length
    ? recent.map(renderDriveRow).join('')
    : '<p class="no-events">Foto disponibili a breve dopo il prossimo evento.</p>';

  if (archived.length > 0){
    archiveContainer.innerHTML = archived.map(renderDriveRow).join('');
    archiveWrapper.classList.remove('archive-hidden');
  } else {
    archiveWrapper.classList.add('archive-hidden');
  }

  if (archiveToggle && !archiveToggle.dataset.bound){
    archiveToggle.addEventListener('click', () => {
      const isHidden = archiveContainer.classList.toggle('archive-hidden');
      archiveToggle.setAttribute('aria-expanded', String(!isHidden));
      archiveToggle.textContent = isHidden
        ? 'Mostra serate precedenti ↓'
        : 'Nascondi serate precedenti ↑';
    });
    archiveToggle.dataset.bound = 'true';
  }
}

/**
 * Punto di ingresso: carica events.json e disegna entrambe le sezioni.
 */
async function loadEvents(){
  try {
    const response = await fetch('data/events.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const events = await response.json();

    renderUpcomingEvents(events);
    renderPhotoArchive(events);
    setupFlipCardInteractions();
  } catch (err) {
    console.error('Errore nel caricamento di data/events.json:', err);
    const grid = document.getElementById('eventsGrid');
    if (grid) grid.innerHTML = '<p class="no-events">Impossibile caricare gli eventi al momento.</p>';
  }
}

loadEvents();
