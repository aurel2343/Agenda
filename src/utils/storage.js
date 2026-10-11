// Compatibilité localStorage simulant AsyncStorage pour un portage 1:1
export const AsyncStorage = {
  getItem: async (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Storage getItem error:', e);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Storage setItem error:', e);
    }
  },
  removeItem: async (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage removeItem error:', e);
    }
  }
};
export default AsyncStorage;
