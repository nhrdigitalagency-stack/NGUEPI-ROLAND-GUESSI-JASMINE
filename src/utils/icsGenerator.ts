/**
 * Génère et télécharge un fichier .ics conforme RFC 5545.
 * - Tant que l'heure n'est pas précisée : crée un événement sur la journée entière (VALUE=DATE)
 *   avec date de fin exclusive (20261202 pour le 1er décembre 2026) et signale dans la description
 *   que l'horaire reste à confirmer.
 * - Lorsque l'heure est précisée : utilise le fuseau Africa/Douala.
 */
export function downloadWeddingIcs(params: {
  groomName: string;
  brideName: string;
  eventDate: string; // YYYY-MM-DD
  eventStartTime: string | null; // HH:MM or null
  eventEndTime: string | null;
  city: string;
  region: string;
  villageName: string;
  address: string;
  locale: 'fr' | 'en';
}) {
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(params.eventDate) ? params.eventDate : '2026-12-01';
  const [y, m, d] = safeDate.split('-').map(Number);

  const formatDateOnly = (dateObj: Date): string => {
    const yy = dateObj.getUTCFullYear();
    const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  };

  const startDateObj = new Date(Date.UTC(y, m - 1, d));
  // Date de fin exclusive (+1 jour) pour un événement journée entière en .ics
  const endDateExclusiveObj = new Date(Date.UTC(y, m - 1, d + 1));

  const summary =
    params.locale === 'fr'
      ? `Mariage traditionnel — ${params.groomName} & ${params.brideName}`
      : `Traditional Wedding Celebration — ${params.groomName} & ${params.brideName}`;

  const locationParts = [
    params.villageName || (params.locale === 'fr' ? 'Village de la mariée' : "Bride's family village"),
    params.city,
    `${params.region}, Cameroun`,
  ].filter(Boolean);
  const location = locationParts.join(', ');

  const hasValidStartTime = Boolean(params.eventStartTime && /^\d{2}:\d{2}$/.test(params.eventStartTime.trim()));

  const description =
    params.locale === 'fr'
      ? hasValidStartTime
        ? `Mariage traditionnel et cérémonie de dot de ${params.groomName} et ${params.brideName} à ${params.city}.`
        : `Mariage traditionnel et cérémonie de dot de ${params.groomName} et ${params.brideName} à ${params.city}. Horaire exact à confirmer par les familles.`
      : hasValidStartTime
      ? `Traditional marriage ceremony and presentation of family gifts of ${params.groomName} and ${params.brideName} in ${params.city}.`
      : `Traditional marriage ceremony and presentation of family gifts of ${params.groomName} and ${params.brideName} in ${params.city}. Exact start time to be confirmed by the families.`;

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `mariage-roland-jasmine-${safeDate}@bangangte.cm`;

  let dtStartLine = '';
  let dtEndLine = '';

  if (hasValidStartTime && params.eventStartTime) {
    const [sh, sm] = params.eventStartTime.trim().split(':');
    const startCompact = `${safeDate.replace(/-/g, '')}T${sh}${sm}00`;
    let endCompact = `${safeDate.replace(/-/g, '')}T220000`;
    if (params.eventEndTime && /^\d{2}:\d{2}$/.test(params.eventEndTime.trim())) {
      const [eh, em] = params.eventEndTime.trim().split(':');
      endCompact = `${safeDate.replace(/-/g, '')}T${eh}${em}00`;
    }
    dtStartLine = `DTSTART;TZID=Africa/Douala:${startCompact}`;
    dtEndLine = `DTEND;TZID=Africa/Douala:${endCompact}`;
  } else {
    dtStartLine = `DTSTART;VALUE=DATE:${formatDateOnly(startDateObj)}`;
    dtEndLine = `DTEND;VALUE=DATE:${formatDateOnly(endDateExclusiveObj)}`;
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nguepi Roland & Guessi Jasmine//Mariage Traditionnel//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Africa/Douala',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0100',
    'TZNAME:WAT',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStamp}`,
    dtStartLine,
    dtEndLine,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const icsContent = lines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mariage-nguepi-roland-guessi-jasmine-2026-12-01.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
