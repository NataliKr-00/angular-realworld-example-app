const TOKEN_KEY = 'jwtToken';

export const jwtStorage = {
  getToken(): string | undefined {
    return window.localStorage[TOKEN_KEY];
  },

  saveToken(token: string): void {
    window.localStorage[TOKEN_KEY] = token;
  },

  destroyToken(): void {
    window.localStorage.removeItem(TOKEN_KEY);
  },
};
