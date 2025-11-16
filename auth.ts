import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        // Check if user exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });

        // If user doesn't exist, create them
        if (!existingUser) {
          await db.insert(users).values({
            email: user.email,
            name: user.name || null,
            image: user.image || null,
          });
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        // Get user from database to include ID in session
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, token.email),
        });

        if (dbUser) {
          session.user.id = dbUser.id.toString();
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});
