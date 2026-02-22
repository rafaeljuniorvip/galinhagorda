import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { findOrCreateGoogleUser, getUserById } from '@/services/userService';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        try {
          const dbUser = await findOrCreateGoogleUser({
            email: profile.email,
            name: profile.name || user.name || '',
            image: (profile.picture as string) || user.image || null,
            providerAccountId: account.providerAccountId,
          });
          // Attach db user id to the user object for jwt callback
          (user as any).dbId = dbUser.id;
          (user as any).role = dbUser.role;
          (user as any).linked_player_id = dbUser.linked_player_id;
          (user as any).linked_team_id = dbUser.linked_team_id;
          return true;
        } catch (error) {
          console.error('[Auth] Error creating/finding user:', error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // On initial sign in, add db user data to token
      if (user) {
        token.dbId = (user as any).dbId;
        token.role = (user as any).role;
        token.linked_player_id = (user as any).linked_player_id;
        token.linked_team_id = (user as any).linked_team_id;
      }

      // When session update is triggered, refresh from DB
      if (trigger === 'update') {
        const dbUser = await getUserById(token.dbId as string);
        if (dbUser) {
          token.name = dbUser.name;
          token.picture = dbUser.avatar_url;
          token.role = dbUser.role;
          token.linked_player_id = dbUser.linked_player_id;
          token.linked_team_id = dbUser.linked_team_id;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.dbId as string;
        (session.user as any).role = token.role as string;
        (session.user as any).avatar_url = token.picture as string;
        (session.user as any).linked_player_id = token.linked_player_id as string | null;
        (session.user as any).linked_team_id = token.linked_team_id as string | null;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
});
