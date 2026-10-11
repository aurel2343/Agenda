// Gestionnaire de notifications Web (Notification API du navigateur)
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Ce navigateur ne supporte pas les notifications.');
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

// Map des timers pour annuler les notifications en attente
const activeTimers = new Map();

export const cancelAllCourseNotifications = () => {
  for (const [key, timerId] of activeTimers.entries()) {
    if (key.startsWith('cours_')) {
      clearTimeout(timerId);
      activeTimers.delete(key);
    }
  }
};

export const cancelAllTaskNotifications = () => {
  for (const [key, timerId] of activeTimers.entries()) {
    if (key.startsWith('task_')) {
      clearTimeout(timerId);
      activeTimers.delete(key);
    }
  }
};

export const scheduleWebNotification = (identifier, title, options, triggerDate) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  if (activeTimers.has(identifier)) {
    clearTimeout(activeTimers.get(identifier));
    activeTimers.delete(identifier);
  }

  const msUntil = triggerDate.getTime() - Date.now();
  if (msUntil <= 0) return; // Déjà passé

  // Note: Dans les navigateurs, les timeouts max ~24.8 jours (2^31 - 1 ms)
  if (msUntil > 2147483647) return;

  const timerId = setTimeout(() => {
    try {
      new Notification(title, {
        icon: '/icon.svg',
        badge: '/icon.svg',
        ...options,
      });
    } catch (e) {
      console.warn('Erreur affichage notification:', e);
    }
    activeTimers.delete(identifier);
  }, msUntil);

  activeTimers.set(identifier, timerId);
};
