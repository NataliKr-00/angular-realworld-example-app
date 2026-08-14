import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { jwtStorage } from './jwt-storage';

describe('jwtStorage', () => {
  beforeEach(() => {
    window.localStorage.removeItem('jwtToken');
  });

  afterEach(() => {
    window.localStorage.removeItem('jwtToken');
  });

  it('saves and reads jwtToken via localStorage bracket access', () => {
    jwtStorage.saveToken('abc');
    expect(window.localStorage['jwtToken']).toBe('abc');
    expect(jwtStorage.getToken()).toBe('abc');
  });

  it('overwrites an existing token', () => {
    jwtStorage.saveToken('old');
    jwtStorage.saveToken('new');
    expect(jwtStorage.getToken()).toBe('new');
  });

  it('destroys the token with removeItem', () => {
    jwtStorage.saveToken('abc');
    jwtStorage.destroyToken();
    expect(jwtStorage.getToken() == null).toBe(true);
    expect(window.localStorage.getItem('jwtToken')).toBeNull();
  });
});
