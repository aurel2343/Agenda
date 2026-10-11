import axios from 'axios';
import ICAL from 'ical.js';

export const COLOR_PALETTE = ['#007AFF', '#248A3D', '#FF9500', '#8E44AD', '#0097B2', '#E91E63', '#5856D6', '#27AE60'];
export const EXAM_COLOR = '#8E8E93';

export const isExamTitle = (title) => {
  if (!title) return false;
  const upper = title.trim().toUpperCase();
  return upper.startsWith('EXAM') || upper.startsWith('MIDTERM');
};

export const extractSubject = (title) => {
  if (!title) return '';
  const parts = title.split('-');
  if (parts.length >= 3) return parts.slice(2).join('-').trim();
  return title.trim();
};

export const normalizeIcsUrl = (rawUrl) => {
  let url = (rawUrl || '').trim();
  if (url.startsWith('webcal://')) url = 'https://' + url.slice(9);
  if (url.startsWith('webcals://')) url = 'https://' + url.slice(10);
  return url;
};

export const isValidIcs = (text) => typeof text === 'string' && text.includes('BEGIN:VCALENDAR');

// Cascade de proxies CORS pour contourner le blocage dans le navigateur
const PUBLIC_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
];

export const fetchIcsRaw = async (url) => {
  const normalized = normalizeIcsUrl(url);
  const errors = [];

  // 1. Tentative fetch direct
  try {
    const res = await axios.get(normalized, { timeout: 8000 });
    if (isValidIcs(res.data)) return res.data;
    errors.push('direct: contenu invalide');
  } catch (e) {
    errors.push(`direct: ${e.message}`);
  }

  // 2. Cascade de proxies
  for (const getProxyUrl of PUBLIC_PROXIES) {
    try {
      const pUrl = getProxyUrl(normalized);
      const res = await axios.get(pUrl, { timeout: 7000 });
      let rawData = res.data;
      if (rawData && rawData.contents) rawData = rawData.contents; // Format allorigins /get
      if (isValidIcs(rawData)) return rawData;
      errors.push(`proxy: contenu invalide`);
    } catch (e) {
      errors.push(`proxy: ${e.message}`);
    }
  }

  throw new Error('Impossible de récupérer le fichier ICS. Vérifiez l\'URL ou réessayez.');
};

export const parseIcsData = (rawData) => {
  const comp = new ICAL.Component(ICAL.parse(rawData));
  const subjectToColorMap = new Map();
  let colorIndex = 0;

  const courses = comp.getAllSubcomponents('vevent').map(vevent => {
    const event = new ICAL.Event(vevent);
    const summary = event.summary || '';
    const isExam = isExamTitle(summary);
    const subjectName = extractSubject(summary);

    if (!isExam && !subjectToColorMap.has(subjectName)) {
      subjectToColorMap.set(subjectName, COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]);
      colorIndex++;
    }
    const color = isExam ? EXAM_COLOR : subjectToColorMap.get(subjectName);

    const description = event.description || '';
    const parseField = (label) => {
      const lines = description.split('\n');
      const results = [];
      let inSection = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith(label + ' :') || trimmed.startsWith(label + ':')) {
          inSection = true;
          continue;
        }
        if (inSection) {
          if (trimmed.startsWith('-')) results.push(trimmed.replace(/^-\s*/, '').trim());
          else if (trimmed.length > 0) break;
        }
      }
      return results;
    };

    return {
      id: event.uid || Math.random().toString(),
      title: summary,
      location: event.location || '?',
      start: event.startDate.toJSDate(),
      end: event.endDate.toJSDate(),
      color,
      isExam,
      formateurs: parseField('Formateurs'),
    };
  }).sort((a, b) => a.start - b.start);

  return courses;
};
