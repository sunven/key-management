import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { prisma } from '@/lib/db/prisma';

interface SignInParams {
  user: {
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
  account: {
    provider: string;
  } | null;
}

interface JWTParams {
  token: {
    email?: string | null;
    id?: string;
  };
  account: {
    provider: string;
  } | null;
}

interface SessionParams {
  session: {
    user?: {
      id?: string;
    };
  };
  token: {
    id?: string;
  };
}

const config = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }: SignInParams) {
      if (account?.provider === 'google' && user.email) {
        // Upsert user: create if doesn't exist, update if exists
        await prisma.user.upsert({
          where: { email: user.email },
          create: {
            email: user.email,
            name: user.name || null,
            image: user.image || null,
          },
          update: {
            name: user.name || null,
            image: user.image || null,
          },
        });
      }
      return true;
    },
    async jwt({ token, account }: JWTParams) {
      // On sign in or if ID is missing, fetch user ID from database and store in token
      if (token.email && (!token.id || account?.provider === 'google')) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (dbUser) {
          token.id = dbUser.id.toString();
        }
      }
      return token;
    },
    async session({ session, token }: SessionParams) {
      // Add user ID from token to session
      if (session.user && token.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

// @ts-expect-error - NextAuth v5 beta type inference issue
export const { handlers, signIn, signOut, auth } = NextAuth(config);
