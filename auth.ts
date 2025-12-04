import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { prisma } from '@/lib/db/prisma';

const config = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
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
    async jwt({ token, account }: any) {
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
    async session({ session, token }: any) {
      // Add user ID from token to session
      if (session.user && token.id) {
        session.user.id = token.id as string;
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
