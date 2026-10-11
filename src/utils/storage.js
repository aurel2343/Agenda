/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENDA ESME — storage.js
 * Couche d'abstraction pour la persistance locale des données.
 * Reproduit fidèlement l'interface asynchrone d'AsyncStorage (React Native)
 * en s'appuyant sur l'API localStorage standard du navigateur web.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export const AsyncStorage = {
  /**
   * Récupère une valeur stockée sous forme de chaîne de caractères.
   * @param {string} key - Clé de stockage (ex: '@tasks', '@ics_url')
   * @returns {Promise<string|null>} - La valeur brute stockée ou null si inexistante
   */
  getItem: async (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('[Storage] Erreur de lecture pour la clé :', key, e);
      return null;
    }
  },

  /**
   * Enregistre une valeur sous forme de chaîne dans le localStorage.
   * @param {string} key - Clé de stockage
   * @param {string} value - Donnée sérialisée (généralement du JSON)
   * @returns {Promise<void>}
   */
  setItem: async (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('[Storage] Erreur d\'écriture pour la clé :', key, e);
    }
  },

  /**
   * Supprime une entrée du stockage local.
   * @param {string} key - Clé de stockage à retirer
   * @returns {Promise<void>}
   */
  removeItem: async (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('[Storage] Erreur de suppression pour la clé :', key, e);
    }
  }
};

export default AsyncStorage;

