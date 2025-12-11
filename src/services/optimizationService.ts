
const CACHE_KEY = 'langlink-translation-cache';

interface CacheEntry {
  translatedText: string;
  timestamp: number;
}

export const optimizationService = {
  /**
   * Generate a unique key for the translation request
   */
  generateKey: (text: string, sourceLang: string, targetLang: string) => {
    return `${text.trim()}|${sourceLang}|${targetLang}`;
  },

  getCachedTranslation: (text: string, sourceLang: string, targetLang: string): string | null => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const key = optimizationService.generateKey(text, sourceLang, targetLang);
      const entry = cache[key] as CacheEntry;
      
      if (entry) {
        // Optional: Expiry logic (e.g., 7 days)
        if (Date.now() - entry.timestamp > 7 * 24 * 60 * 60 * 1000) {
          delete cache[key];
          localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
          return null;
        }
        return entry.translatedText;
      }
      return null;
    } catch {
      return null;
    }
  },

  setCachedTranslation: (text: string, sourceLang: string, targetLang: string, result: string) => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const key = optimizationService.generateKey(text, sourceLang, targetLang);
      
      cache[key] = {
        translatedText: result,
        timestamp: Date.now(),
      };

      // Simple cleanup if cache gets too big (> 500 items)
      const keys = Object.keys(cache);
      if (keys.length > 500) {
        delete cache[keys[0]]; // Remove oldest (roughly, keys are rarely perfectly ordered by time in JS objects but sufficient for demo)
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn("Cache storage failed", e);
    }
  },

  /**
   * Standard debounce helper
   */
  debounce: <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<F>): void => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => func(...args), waitFor);
    };
  }
};
