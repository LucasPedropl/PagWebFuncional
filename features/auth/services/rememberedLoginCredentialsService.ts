export type LoginAudience = 'business' | 'client';

export interface RememberedLoginCredentials {
  email: string;
  password: string;
}

const STORAGE_KEY_PREFIX = 'pagweb_remembered_login';

const storageKeyForAudience = (audience: LoginAudience): string =>
  `${STORAGE_KEY_PREFIX}_${audience}`;

export const rememberedLoginCredentialsService = {
  load(audience: LoginAudience): RememberedLoginCredentials | null {
    try {
      const raw = localStorage.getItem(storageKeyForAudience(audience));
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        typeof (parsed as RememberedLoginCredentials).email !== 'string' ||
        typeof (parsed as RememberedLoginCredentials).password !== 'string'
      ) {
        return null;
      }
      const credentials = parsed as RememberedLoginCredentials;
      if (!credentials.email.trim()) return null;
      return {
        email: credentials.email,
        password: credentials.password,
      };
    } catch {
      return null;
    }
  },

  save(audience: LoginAudience, credentials: RememberedLoginCredentials): void {
    localStorage.setItem(
      storageKeyForAudience(audience),
      JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
      }),
    );
  },

  clear(audience: LoginAudience): void {
    localStorage.removeItem(storageKeyForAudience(audience));
  },
};
