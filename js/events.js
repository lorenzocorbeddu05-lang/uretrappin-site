/* =========================================================
   SEZIONE EVENTI — lettura di data/events.json e generazione
   automatica delle locandine. Usato solo in index.html.

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
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  try {
    const response = await fetch('data/events.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const events = await response.json();

    renderUpcomingEvents(events);
    setupFlipCardInteractions();
  } catch (err) {
    console.error('Errore nel caricamento di data/events.json:', err);
    grid.innerHTML = '<p class="no-events">Impossibile caricare gli eventi al momento.</p>';
  }
}

loadEvents();
