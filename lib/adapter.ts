import type { Adapter, AdapterAccount, AdapterSession, AdapterUser, VerificationToken } from 'next-auth/adapters';
import * as repo from './db/repo';
import { getDb, now } from './db';

export const dbAdapter: Adapter = {
  async createUser(user: Omit<AdapterUser, 'id'>) {
    const existing = await repo.dbGetUserByEmail(user.email);
    if (existing) return existing as AdapterUser;
    return (await repo.dbCreateUser({
      name: user.name ?? null,
      email: user.email,
      emailVerified: user.emailVerified ?? null,
      image: user.image ?? null,
      is_owner: user.email.toLowerCase() === ownerEmail(),
    })) as AdapterUser;
  },

  getUser: (id: string) => repo.dbGetUser(id) as Promise<AdapterUser | null>,
  getUserByEmail: (email: string) => repo.dbGetUserByEmail(email) as Promise<AdapterUser | null>,
  getUserByAccount: ({ provider, providerAccountId }: Pick<AdapterAccount, 'provider' | 'providerAccountId'>) =>
    repo.dbGetUserByAccount(provider, providerAccountId) as Promise<AdapterUser | null>,

  async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, 'id'>) {
    const data: Record<string, unknown> = {};
    if (user.name !== undefined) data.name = user.name;
    if (user.email !== undefined) data.email = user.email;
    if (user.image !== undefined) data.image = user.image;
    if (user.emailVerified !== undefined) data.email_verified = user.emailVerified;
    const updated = await repo.dbUpdateUser(String(user.id), data);
    return updated as AdapterUser;
  },

  deleteUser: (userId: string) => repo.dbDeleteUser(userId),

  async linkAccount(account: AdapterAccount) {
    if (!account.userId) throw new Error('linkAccount: missing userId');
    await repo.dbLinkAccount(account, Number(account.userId));
    return account;
  },

  async unlinkAccount({ provider, providerAccountId }: Pick<AdapterAccount, 'provider' | 'providerAccountId'>) {
    const d = getDb();
    await d.run('DELETE FROM accounts WHERE provider = $1 AND provider_account_id = $2', [provider, providerAccountId]);
  },

  async createSession(session: { sessionToken: string; userId: string; expires: Date }) {
    await repo.dbCreateSession({
      sessionToken: session.sessionToken,
      userId: Number(session.userId),
      expires: session.expires,
    });
    return {
      id: session.sessionToken,
      sessionToken: session.sessionToken,
      user: { id: session.userId },
      expires: session.expires,
    } as unknown as AdapterSession;
  },

  async getSessionAndUser(sessionToken: string) {
    const row = await repo.dbGetSession(sessionToken);
    if (!row) return null;
    const u = (row as any).user;
    return {
      session: {
        id: row.id,
        sessionToken,
        user: { id: String(u.id) },
        expires: new Date(row.expires),
      } as unknown as AdapterSession,
      user: {
        id: String(u.id),
        name: (row as any).name ?? undefined,
        email: (row as any).email,
        image: (row as any).image ?? undefined,
        emailVerified: null,
        // carried through at runtime for the session callback
        ...( { is_owner: (row as any).is_owner ? true : undefined } ),
      } as unknown as AdapterUser,
    };
  },

  updateSession: (session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>) =>
    Promise.resolve(session as AdapterSession),

  deleteSession: async (sessionToken: string) => {
    await repo.dbDeleteSession(sessionToken);
    return null;
  },

  async createVerificationToken(vt: VerificationToken) {
    const d = getDb();
    await d.run('INSERT INTO verification_tokens (identifier, token, expires) VALUES ($1,$2,$3)', [
      vt.identifier,
      vt.token,
      new Date(vt.expires).toISOString(),
    ]);
    return vt;
  },

  async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
    const d = getDb();
    const row = await d.get('SELECT * FROM verification_tokens WHERE identifier = $1 AND token = $2 AND expires > $3', [
      identifier,
      token,
      now(),
    ]);
    if (!row) return null;
    await d.run('DELETE FROM verification_tokens WHERE identifier = $1 AND token = $2', [identifier, token]);
    return { identifier, token, expires: row.expires } as VerificationToken;
  },
};

export function ownerEmail(): string {
  return (process.env.ADMIN_EMAIL || 'admin@therecipeseeker.com').toLowerCase();
}
