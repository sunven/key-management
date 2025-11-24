import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
        // Check if user exists
        const existingUsers = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        // If user doesn't exist, create them
        if (existingUsers.length === 0) {
          await db.insert(users).values({
            email: user.email,
            name: user.name || null,
            image: user.image || null,
          });
        }
      }
      return true;
    },
    async jwt({ token, account }: any) {
      // On sign in or if ID is missing, fetch user ID from database and store in token
      if (token.email && (!token.id || account?.provider === 'google')) {
        const dbUsers = await db
          .select()
          .from(users)
          .where(eq(users.email, token.email))
          .limit(1);

        if (dbUsers.length > 0) {
          token.id = dbUsers[0].id.toString();
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
