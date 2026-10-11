/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENDA ESME — icsParser.js
 * Téléchargement du calendrier (.ics), contournement des sécurités CORS,
 * et parsing des événements avec la bibliothèque ICAL.js.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import axios from 'axios';
import ICAL from 'ical.js';

// Palette de 8 couleurs distinctes attribuées cycliquement à chaque matière détectée
export const COLOR_PALETTE = [
  '#007AFF', // Bleu iOS
  '#248A3D', // Vert forêt
  '#FF9500', // Orange
  '#8E44AD', // Violet
  '#0097B2', // Cyan / Canard
  '#E91E63', // Rose
  '#5856D6', // Indigo
  '#27AE60', // Vert émeraude
];

// Couleur grise fixe pour tous les examens et partiels
export const EXAM_COLOR = '#8E8E93';

/**
 * Détermine si le cours est un examen ou un midterm basé sur son titre.
 * @param {string} title - Titre complet de l'événement
 * @returns {boolean}
 */
export const isExamTitle = (title) => {
  if (!title) return false;
  const upper = title.trim().toUpperCase();
  return upper.startsWith('EXAM') || upper.startsWith('MIDTERM');
};

/**
 * Extrait le nom court de la matière depuis le format ICS "TYPE - GROUPE - MATIÈRE".
 * Ex: "TD - SUP H - Mathématiques 2" -> "Mathématiques 2"
 * @param {string} title - Titre de l'événement
 * @returns {string} - Nom de la matière épuré
 */
export const extractSubject = (title) => {
  if (!title) return '';
  const parts = title.split('-');
  if (parts.length >= 3) return parts.slice(2).join('-').trim();
  return title.trim();
};

/**
 * Convertit un lien de calendrier au protocole webcal:// ou webcals://
 * en lien HTTPS standard supporté par fetch et axios.
 * @param {string} rawUrl - URL saisie par l'utilisateur
 * @returns {string} - URL au format https://
 */
export const normalizeIcsUrl = (rawUrl) => {
  let url = (rawUrl || '').trim();
  if (url.startsWith('webcal://')) url = 'https://' + url.slice(9);
  if (url.startsWith('webcals://')) url = 'https://' + url.slice(10);
  return url;
};

/**
 * Vérifie si la réponse contient bien la signature d'un fichier iCalendar valide.
 * Empêche de tenter de parser une page d'erreur HTML 404/500 renvoyée par un proxy.
 * @param {string} text - Contenu brut reçu
 * @returns {boolean}
 */
export const isValidIcs = (text) => typeof text === 'string' && text.includes('BEGIN:VCALENDAR');

/**
 * Liste des relais proxies CORS utilisés pour contourner le blocage du navigateur
 * lorsque l'université ne fournit pas d'en-tête Access-Control-Allow-Origin: *
 */
const PUBLIC_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
];

/**
 * Télécharge le contenu brut d'un calendrier ICS via une cascade de méthodes.
 * Tente d'abord un accès direct, puis bascule successivement sur les proxies en cas d'échec.
 * @param {string} url - URL du calendrier ICS
 * @returns {Promise<string>} - Contenu textuel de l'ICS
 */
export const fetchIcsRaw = async (url) => {
  const normalized = normalizeIcsUrl(url);
  const errors = [];

  // Étape 1 : Tentative de fetch direct
  try {
    const res = await axios.get(normalized, { timeout: 8000 });
    if (isValidIcs(res.data)) return res.data;
    errors.push('direct: contenu non-ICS');
  } catch (e) {
    errors.push(`direct: ${e.message}`);
  }

  // Étape 2 : Cascade des proxies CORS publics
  for (const getProxyUrl of PUBLIC_PROXIES) {
    try {
      const pUrl = getProxyUrl(normalized);
      const res = await axios.get(pUrl, { timeout: 7000 });
      let rawData = res.data;
      // Allorigins /get encapsule le contenu dans un objet JSON { contents: "..." }
      if (rawData && rawData.contents) rawData = rawData.contents;
      if (isValidIcs(rawData)) return rawData;
      errors.push('proxy: contenu invalide');
    } catch (e) {
      errors.push(`proxy: ${e.message}`);
    }
  }

  throw new Error('Impossible de récupérer le fichier ICS. Vérifiez l\'URL ou réessayez.');
};

/**
 * Parse le texte brut iCalendar (.ics) en liste d'objets cours exploitables par React.
 * @param {string} rawData - Fichier ICS textuel
 * @returns {Array<Object>} - Liste des cours triés chronologiquement
 */
export const parseIcsData = (rawData) => {
  const comp = new ICAL.Component(ICAL.parse(rawData));
  const subjectToColorMap = new Map();
  let colorIndex = 0;

  const courses = comp.getAllSubcomponents('vevent').map(vevent => {
    const event = new ICAL.Event(vevent);
    const summary = event.summary || '';
    const isExam = isExamTitle(summary);
    const subjectName = extractSubject(summary);

    // Attribution d'une couleur stable et unique par matière
    if (!isExam && !subjectToColorMap.has(subjectName)) {
      subjectToColorMap.set(subjectName, COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]);
      colorIndex++;
    }
    const color = isExam ? EXAM_COLOR : subjectToColorMap.get(subjectName);

    // Extraction des formateurs depuis le champ DESCRIPTION du VEVENT
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
          else if (trimmed.length > 0) break; // Fin de la section des intervenants
        }
      }
      return results;
    };

    return {
      id: event.uid || Math.random().toString(),
      title: summary,
      location: event.location || '?',
      start: event.startDate.toJSDate(), // Conversion date ICAL vers objet Date JavaScript natif
      end: event.endDate.toJSDate(),
      color,
      isExam,
      formateurs: parseField('Formateurs'),
    };
  }).sort((a, b) => a.start - b.start); // Tri par ordre chronologique de début de cours

  return courses;
};

