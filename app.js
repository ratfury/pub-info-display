import { CONFIG } from './config.js';
import { loadAllCalendars } from './calendar-feed.js';
import { initClock } from './clock.js';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isMeaningfulDienstleiter(value) {
  const text = String(value || '').trim();
  return text.length > 0 && text !== '-';
}

function getGemeindeServiceInfo(time) {
  const text = String(time || '').trim();
  if (!text) {
    return { hasService: null, time: '', status: '' };
  }
  if (/kein gottesdienst/i.test(text)) {
    return { hasService: false, time: '', status: 'Kein Gottesdienst' };
  }
  if (/^\d{1,2}:\d{2}/.test(text)) {
    return { hasService: true, time: text, status: 'Gottesdienst' };
  }
  return { hasService: false, time: '', status: text };
}

function renderGemeindeCard(event) {
  const lead = isMeaningfulDienstleiter(event.dienstleiter) ? event.dienstleiter : '';
  const service = getGemeindeServiceInfo(event.time);

  const mainParts = [];
  if (event.weekday) mainParts.push(`<span class="card-gemeinde-weekday">${escapeHtml(event.weekday)}</span>`);
  if (event.date) mainParts.push(`<span class="card-gemeinde-date">${escapeHtml(event.date)}</span>`);

  if (service.hasService === false) {
    mainParts.push(`<span class="card-gemeinde-status card-gemeinde-status--no">${escapeHtml(service.status)}</span>`);
  } else if (service.hasService === true) {
    mainParts.push(`<span class="card-gemeinde-status card-gemeinde-status--yes">${escapeHtml(service.status)}</span>`);
    mainParts.push(`<span class="card-gemeinde-time">${escapeHtml(service.time)}</span>`);
  }

  const detailParts = [];
  if (lead) detailParts.push(`<span class="card-gemeinde-lead">✝️ ${escapeHtml(lead)}</span>`);
  if (event.title) detailParts.push(`<span class="card-gemeinde-textwort">📖 ${escapeHtml(event.title)}</span>`);

  return `
    <article class="card card--gemeinde">
      <p class="card-line card-gemeinde-main">${mainParts.join('<span class="card-sep">·</span>')}</p>
      ${detailParts.length ? `<p class="card-line card-gemeinde-details">${detailParts.join('<span class="card-sep">·</span>')}</p>` : ''}
    </article>
  `;
}

function renderBezirkCard(event) {
  const mainParts = [];
  if (event.weekday) mainParts.push(`<span class="card-bezirk-weekday">${escapeHtml(event.weekday)}</span>`);
  if (event.date) mainParts.push(`<span class="card-bezirk-date">${escapeHtml(event.date)}</span>`);
  if (event.time) mainParts.push(`<span class="card-bezirk-time">${escapeHtml(event.time)}</span>`);
  if (event.title) mainParts.push(`<span class="card-bezirk-title">${escapeHtml(event.title)}</span>`);

  const location = String(event.location || '').trim();

  return `
    <article class="card card--bezirk">
      <p class="card-line card-bezirk-main">${mainParts.join('<span class="card-sep">·</span>')}</p>
      ${location ? `<p class="card-line card-bezirk-location-line">${escapeHtml(location)}</p>` : ''}
    </article>
  `;
}

function renderColumn(key, feed, events, error) {
  const cards = events.length
    ? events.map((event) => (feed.layout === 'gemeinde' ? renderGemeindeCard(event) : renderBezirkCard(event))).join('')
    : `<div class="state state-empty">Keine Termine</div>`;

  return `
    <section class="column column--${key}" aria-labelledby="heading-${key}">
      <h2 id="heading-${key}" class="column-title">${escapeHtml(feed.label)}</h2>
      ${error ? `<div class="state state-error" role="alert">${escapeHtml(error)}</div>` : ''}
      <div class="column-cards">${cards}</div>
    </section>
  `;
}

function renderLoading() {
  return `
    <div class="state state-loading">Termine werden geladen …</div>
    <div class="state state-loading">Termine werden geladen …</div>
    <div class="state state-loading">Termine werden geladen …</div>
  `;
}

function updateTitle(month) {
  document.title = month ? `${CONFIG.siteTitle} – ${month}` : CONFIG.siteTitle;
}

function fitBoardToViewport() {
  const page = document.querySelector('.page-board');
  if (!page) return;

  const gemeindeCol = page.querySelector('.column--gemeinde');
  const bezirkCols = page.querySelectorAll('.column--bezirk, .column--vorschau');

  const measureColumn = (column) => {
    if (!column) return 1;
    let scale = 1;

    const list = column.querySelector('.column-cards');
    if (list && list.scrollHeight > list.clientHeight + 1 && list.clientHeight > 0) {
      scale = Math.min(scale, list.clientHeight / list.scrollHeight);
    }

    for (const card of column.querySelectorAll('.card')) {
      if (card.scrollHeight > card.clientHeight + 1 && card.clientHeight > 0) {
        scale = Math.min(scale, card.clientHeight / card.scrollHeight);
      }
    }

    return scale;
  };

  const applyScales = (gemeinde, bezirk) => {
    page.style.setProperty('--fit-scale-gemeinde', String(Math.max(0.35, Math.min(2.2, gemeinde))));
    page.style.setProperty('--fit-scale-bezirk', String(Math.max(0.5, Math.min(2.2, bezirk))));
  };

  applyScales(1, 1);

  requestAnimationFrame(() => {
    let gScale = 1;
    let bScale = 1;

    for (let pass = 0; pass < 10; pass += 1) {
      let changed = false;

      if (gemeindeCol) {
        const factor = measureColumn(gemeindeCol);
        if (factor < 0.995) {
          gScale *= factor * 0.97;
          changed = true;
        }
      }

      let bezFactor = 1;
      for (const col of bezirkCols) {
        bezFactor = Math.min(bezFactor, measureColumn(col));
      }
      if (bezFactor < 0.995) {
        bScale *= bezFactor * 0.97;
        changed = true;
      }

      applyScales(gScale, bScale);
      if (!changed) break;
    }

    if (page.scrollHeight > window.innerHeight + 1) {
      const pageFactor = (window.innerHeight / page.scrollHeight) * 0.98;
      gScale *= pageFactor;
      bScale *= pageFactor;
      applyScales(gScale, bScale);
    }
  });
}

async function initBoard() {
  const board = document.getElementById('board-columns');
  try {
    document.getElementById('site-title').textContent = CONFIG.siteTitle;
    initClock(document.getElementById('analog-clock'), document.getElementById('digital-clock'));
    board.innerHTML = renderLoading();

    const data = await loadAllCalendars(CONFIG);
    document.getElementById('month-label').textContent = data.month || '';
    updateTitle(data.month);

    board.innerHTML = Object.entries(CONFIG.feeds)
      .map(([key, feed]) => renderColumn(key, feed, data.calendars[key] || [], data.errors[key]))
      .join('');

    fitBoardToViewport();
  } catch (error) {
    console.error(error);
    board.innerHTML = `<div class="state state-error" role="alert">Fehler beim Laden: ${escapeHtml(error.message)}<br>Bitte ./scripts/dev.sh nutzen und Seite neu laden (F5).</div>`;
  }
}

initBoard();

window.addEventListener('resize', fitBoardToViewport);
