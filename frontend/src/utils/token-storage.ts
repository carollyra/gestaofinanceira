const TOKEN_KEY = 'financas:token';

// localStorage may be unavailable (private mode, blocked storage): fail soft
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Session keeps working in memory until the page is reloaded
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing to clear
    }
  },
};
