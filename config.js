export const CONFIG = {
  monthUrl: './data/month.json',
  feeds: {
    gemeinde: {
      label: 'Gemeinde Neustadt',
      path: './data/gemeinde-neustadt.ics',
      filename: 'gemeinde-neustadt.ics',
      layout: 'gemeinde',
    },
    bezirk: {
      label: 'Bezirk Hannover-Südwest',
      path: './data/bezirk-hannover-suedwest.ics',
      filename: 'bezirk-hannover-suedwest.ics',
      layout: 'bezirk',
    },
    vorschau: {
      label: 'Vorschau Bezirk',
      path: './data/vorschau-bezirk.ics',
      filename: 'vorschau-bezirk.ics',
      layout: 'bezirk',
    },
  },
  layouts: {
    gemeinde: { fields: ['weekday', 'date', 'time', 'title', 'dienstleiter'] },
    bezirk: { fields: ['weekday', 'date', 'time', 'title', 'location'] },
  },
  siteTitle: 'Termine NAK Gemeinde Neustadt am Rübenberge',
};
