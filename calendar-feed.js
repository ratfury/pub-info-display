const LABEL_PATTERN = /^([^:]+):\s*(.+)$/;

function unfoldIcal(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const unfolded = [];
  for (const line of lines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }
  return unfolded;
}

function parseDescription(text) {
  const fields = {};
  if (!text) {
    return fields;
  }
  for (const line of text.split('\n')) {
    const match = line.match(LABEL_PATTERN);
    if (match) {
      fields[match[1].trim()] = match[2].trim();
    }
  }
  return fields;
}

function parseIcalDate(value) {
  if (!value) {
    return { date: '', time: '', iso: null };
  }
  const clean = value.replace(/^TZID=[^:]*:/, '');
  if (/^\d{8}$/.test(clean)) {
    const date = `${clean.slice(6, 8)}.${clean.slice(4, 6)}.${clean.slice(0, 4)}`;
    return { date, time: '', iso: `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}` };
  }
  if (/^\d{8}T\d{6}Z?$/.test(clean)) {
    const date = `${clean.slice(6, 8)}.${clean.slice(4, 6)}.${clean.slice(0, 4)}`;
    const time = `${clean.slice(9, 11)}:${clean.slice(11, 13)}`;
    return {
      date,
      time,
      iso: `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T${time}`,
    };
  }
  return { date: clean, time: '', iso: null };
}

function parseEvents(icsText) {
  const lines = unfoldIcal(icsText);
  const events = [];
  let current = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (line === 'END:VEVENT' && current) {
      events.push(current);
      current = null;
      continue;
    }
    if (!current) {
      continue;
    }

    const separator = line.indexOf(':');
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).split(';')[0].toUpperCase();
    const value = line.slice(separator + 1).trim();

    if (key === 'DTSTART') {
      current.dtstart = value;
    } else if (key === 'SUMMARY') {
      current.summary = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
    } else if (key === 'LOCATION') {
      current.location = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
    } else if (key === 'DESCRIPTION') {
      current.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
    }
  }

  return events;
}

function normalizeEvent(raw, layout) {
  const descriptionFields = parseDescription(raw.description || '');
  const parsedDate = parseIcalDate(raw.dtstart);
  const weekday = descriptionFields.Wochentag || '';
  const date = descriptionFields.Datum || parsedDate.date;
  const time = descriptionFields.Uhrzeit || parsedDate.time;
  const title = raw.summary || descriptionFields.Textwort || descriptionFields.Was || '';

  if (layout === 'gemeinde') {
    return {
      weekday,
      date,
      time,
      title,
      dienstleiter: descriptionFields.Dienstleiter || '',
      sortKey: parsedDate.iso || `${date} ${time}`,
    };
  }

  return {
    weekday,
    date,
    time,
    title,
    location: raw.location || descriptionFields.Ort || '',
    sortKey: parsedDate.iso || `${date} ${time}`,
  };
}

async function fetchText(url) {
  const bust = `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
  const response = await fetch(bust, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

export async function loadMonth(monthUrl) {
  try {
    const text = await fetchText(monthUrl);
    const data = JSON.parse(text);
    return data.month || '';
  } catch (error) {
    throw new Error(`Monat konnte nicht geladen werden (${error.message})`);
  }
}

export async function loadFeed(key, feed) {
  try {
    const text = await fetchText(feed.path);
    const events = parseEvents(text)
      .map((event) => normalizeEvent(event, feed.layout))
      .sort((a, b) => String(a.sortKey).localeCompare(String(b.sortKey)));
    if (!events.length) {
      console.warn(`${feed.label}: keine VEVENT-Einträge in ${feed.path}`);
    }
    return events;
  } catch (error) {
    throw new Error(`${feed.label}: ${error.message}`);
  }
}

export async function loadAllCalendars(config) {
  const result = {
    month: '',
    calendars: {},
    errors: {},
    loading: true,
  };

  try {
    result.month = await loadMonth(config.monthUrl);
  } catch (error) {
    result.errors.month = error.message;
  }

  await Promise.all(
    Object.entries(config.feeds).map(async ([key, feed]) => {
      try {
        result.calendars[key] = await loadFeed(key, feed);
      } catch (error) {
        result.calendars[key] = [];
        result.errors[key] = error.message;
      }
    }),
  );

  result.loading = false;
  return result;
}
