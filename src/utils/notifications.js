/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENDA ESME — notifications.js
 * Gestionnaire de notifications Web (Notification API du navigateur).
 * Planifie les alertes de cours (30 min / 10 min avant) et les rappels de tâches.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Demande la permission d'afficher des notifications à l'utilisateur.
 * @returns {Promise<'granted'|'denied'|'default'|'unsupported'>}
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('[Notification] Ce navigateur ne supporte pas l\'API Notification.');
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
};

// Map des timers en cours d'attente pour pouvoir annuler une alerte programmée
const activeTimers = new Map();

/**
 * Annule toutes les alertes de cours planifiées dans le navigateur.
 */
export const cancelAllCourseNotifications = () => {
  for (const [key, timerId] of activeTimers.entries()) {
    if (key.startsWith('cours_')) {
      clearTimeout(timerId);
      activeTimers.delete(key);
    }
  }
};

/**
 * Annule toutes les alertes de tâches planifiées dans le navigateur.
 */
export const cancelAllTaskNotifications = () => {
  for (const [key, timerId] of activeTimers.entries()) {
    if (key.startsWith('task_')) {
      clearTimeout(timerId);
      activeTimers.delete(key);
    }
  }
};

/**
 * Programme l'affichage d'une notification Web à une date et heure précises.
 * @param {string} identifier - Identifiant unique de l'alerte (ex: 'cours_123_30', 'task_456_before1')
 * @param {string} title - Titre affiché sur la bannière de notification
 * @param {NotificationOptions} options - Options supplémentaires (corps du texte, icônes...)
 * @param {Date} triggerDate - Date/heure précise à laquelle afficher la notification
 */
export const scheduleWebNotification = (identifier, title, options, triggerDate) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  // Si une alerte existait déjà avec cet identifiant, on l'annule pour la replanifier
  if (activeTimers.has(identifier)) {
    clearTimeout(activeTimers.get(identifier));
    activeTimers.delete(identifier);
  }

  const msUntil = triggerDate.getTime() - Date.now();
  if (msUntil <= 0) return; // Alerte déjà passée dans le temps

  // Limite de setTimeout en JavaScript (~24.8 jours / 2^31 - 1 millisecondes)
  if (msUntil > 2147483647) return;

  const timerId = setTimeout(() => {
    try {
      new Notification(title, {
        icon: '/icon.svg',
        badge: '/icon.svg',
        ...options,
      });
    } catch (e) {
      console.warn('[Notification] Impossible d\'afficher la notification :', e);
    }
    activeTimers.delete(identifier);
  }, msUntil);

  activeTimers.set(identifier, timerId);
};

