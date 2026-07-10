import { getConfiguredAdminEmail, isMatchingAdminEmail, normalizeString } from './authUtils';

describe('authUtils', () => {
  it('normalizes and compares admin emails case-insensitively', () => {
    expect(normalizeString(' Ansari@Gmail.com ')).toBe('ansari@gmail.com');
    expect(isMatchingAdminEmail('ANSARI@GMAIL.COM', 'ansari@gmail.com')).toBe(true);
  });

  it('uses the configured admin email from the environment', () => {
    expect(getConfiguredAdminEmail({ REACT_APP_ADMIN_EMAIL: ' Test@Example.com ' })).toBe('test@example.com');
  });
});
