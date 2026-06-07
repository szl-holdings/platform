import { describe, expect, it } from 'vitest';
import {
  changePasswordBodySchema,
  loginBodySchema,
  loginPasswordBodySchema,
  mfaVerifyBodySchema,
  registerBodySchema,
  sessionListQuerySchema,
  userSchema,
  wsTicketBodySchema,
} from './auth';

describe('loginBodySchema', () => {
  it('accepts valid credentials', () => {
    expect(loginBodySchema.parse({ email: 'u@e.com', password: 'x' })).toBeTruthy();
  });
  it('rejects an invalid email', () => {
    expect(() => loginBodySchema.parse({ email: 'no-at', password: 'x' })).toThrow();
  });
  it('rejects empty password', () => {
    expect(() => loginBodySchema.parse({ email: 'u@e.com', password: '' })).toThrow();
  });
  it('rejects missing fields', () => {
    expect(() => loginBodySchema.parse({})).toThrow();
  });
});

describe('loginPasswordBodySchema', () => {
  it('accepts password with min length', () => {
    expect(
      loginPasswordBodySchema.parse({
        email: 'u@e.com',
        password: '12345678',
      }),
    ).toBeTruthy();
  });
  it('rejects password shorter than 8 chars', () => {
    expect(() => loginPasswordBodySchema.parse({ email: 'u@e.com', password: 'short' })).toThrow();
  });
});

describe('registerBodySchema', () => {
  it('accepts valid registration', () => {
    expect(
      registerBodySchema.parse({
        email: 'u@e.com',
        password: '12345678',
        displayName: 'User',
      }),
    ).toBeTruthy();
  });
  it('rejects password > 128 chars', () => {
    expect(() =>
      registerBodySchema.parse({
        email: 'u@e.com',
        password: 'x'.repeat(129),
        displayName: 'U',
      }),
    ).toThrow();
  });
  it('rejects empty displayName', () => {
    expect(() =>
      registerBodySchema.parse({
        email: 'u@e.com',
        password: '12345678',
        displayName: '',
      }),
    ).toThrow();
  });
});

describe('wsTicketBodySchema', () => {
  it('accepts empty body', () => {
    expect(wsTicketBodySchema.parse({})).toEqual({});
  });
  it('accepts a channel', () => {
    expect(wsTicketBodySchema.parse({ channel: 'general' }).channel).toBe('general');
  });
  it('rejects channel > 128 chars', () => {
    expect(() => wsTicketBodySchema.parse({ channel: 'x'.repeat(129) })).toThrow();
  });
});

describe('userSchema', () => {
  it('validates a complete user', () => {
    const r = userSchema.parse({
      id: 1,
      email: 'u@e.com',
      displayName: 'U',
      avatarUrl: 'https://x.com/a.png',
      platformRole: 'admin',
      isActive: true,
      lastLoginAt: '2026-01-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(r.lastLoginAt).toBeInstanceOf(Date);
  });
  it('accepts a null avatarUrl', () => {
    const r = userSchema.parse({
      id: 1,
      email: 'u@e.com',
      displayName: 'U',
      avatarUrl: null,
      createdAt: new Date(),
    });
    expect(r.avatarUrl).toBeNull();
  });
  it('rejects bad avatarUrl', () => {
    expect(() =>
      userSchema.parse({
        id: 1,
        email: 'u@e.com',
        displayName: 'U',
        avatarUrl: 'not-a-url',
        createdAt: new Date(),
      }),
    ).toThrow();
  });
  it('rejects non-integer id', () => {
    expect(() =>
      userSchema.parse({
        id: 1.5,
        email: 'u@e.com',
        displayName: 'U',
        createdAt: new Date(),
      }),
    ).toThrow();
  });
});

describe('sessionListQuerySchema', () => {
  it('delegates to paginationQuerySchema (defaults applied)', () => {
    const r = sessionListQuerySchema.parse({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(50);
  });
});

describe('mfaVerifyBodySchema', () => {
  it('accepts a 6-digit token', () => {
    expect(mfaVerifyBodySchema.parse({ token: '123456' }).token).toBe('123456');
  });
  it('rejects token of wrong length', () => {
    expect(() => mfaVerifyBodySchema.parse({ token: '12345' })).toThrow();
    expect(() => mfaVerifyBodySchema.parse({ token: '1234567' })).toThrow();
  });
  it('rejects non-digit token', () => {
    expect(() => mfaVerifyBodySchema.parse({ token: '12345a' })).toThrow();
  });
});

describe('changePasswordBodySchema', () => {
  it('accepts a valid change', () => {
    expect(
      changePasswordBodySchema.parse({
        currentPassword: 'old',
        newPassword: 'newpass12',
      }),
    ).toBeTruthy();
  });
  it('rejects newPassword < 8 chars', () => {
    expect(() =>
      changePasswordBodySchema.parse({
        currentPassword: 'old',
        newPassword: 'short',
      }),
    ).toThrow();
  });
  it('rejects empty currentPassword', () => {
    expect(() =>
      changePasswordBodySchema.parse({
        currentPassword: '',
        newPassword: 'newpass12',
      }),
    ).toThrow();
  });
});
