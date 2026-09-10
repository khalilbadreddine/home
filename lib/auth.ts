import type { DefaultSession, NextAuthOptions } from 'next-auth';
import { getServerSession as nextGetServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dbAdapter, ownerEmail } from './adapter';
import * as repo from './db/repo';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isOwner?: boolean;
    };
  }
}

function resolveSecret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  const path = require('node:path');
  const file = path.join(process.cwd(), 'data', '.auth-secret');
  try {
    if (existsSync(file)) return readFileSync(file, 'utf8').trim();
    mkdirSync(path.dirname(file), { recursive: true });
    const s = randomBytes(32).toString('hex');
    writeFileSync(file, s, { mode: 0o600 });
    return s;
  } catch {
    return randomBytes(32).toString('hex');
  }
}

const providers: NextAuthOptions['providers'] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

providers.push(
  CredentialsProvider({
    name: 'Owner login',
    credentials: {
      email: { label: 'Email', type: 'email', placeholder: 'you@yourkitchen.com' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      const user = await repo.dbGetUserByEmail(credentials.email);
      if (!user?.password_hash) return null;
      const ok = await bcrypt.compare(credentials.password, user.password_hash);
      if (!ok) return null;
      // owner auto-promotion
      if (credentials.email.toLowerCase() === ownerEmail() && !user.is_owner) {
        await repo.dbUpdateUser(String(user.id), { is_owner: true });
      }
      return {
        id: String(user.id),
        name: user.name,
        email: user.email,
        image: user.image,
        is_owner: user.is_owner ? true : credentials.email.toLowerCase() === ownerEmail(),
      } as any;
    },
  })
);

export const authOptions: NextAuthOptions = {
  secret: resolveSecret(),
  adapter: dbAdapter,
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin' },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      // at sign-in
      if (user) {
        token.uid = (user as any).id;
        token.name = (user as any).name;
        token.email = (user as any).email;
        token.image = (user as any).image;
        token.isOwner = Boolean((user as any).is_owner) || ((user as any).email || '').toLowerCase() === ownerEmail();
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.uid) session.user.id = String(token.uid);
      if (token?.name) session.user.name = String(token.name);
      if (token?.email) session.user.email = String(token.email);
      if (token?.image) session.user.image = token.image as string;
      // keep isOwner fresh (covers owner-email auto-promotion & Google sign-ins)
      try {
        const u = token.uid ? await repo.dbGetUser(String(token.uid)) : session.user.email ? await repo.dbGetUserByEmail(session.user.email) : undefined;
        session.user.isOwner =
          (u?.is_owner ? true : false) ||
          token.isOwner === true ||
          (session.user.email || '').toLowerCase() === ownerEmail();
      } catch {
        session.user.isOwner = token.isOwner === true;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      return baseUrl + '/admin';
    },
  },
};

export async function getServerSession() {
  return nextGetServerSession(authOptions);
}
