import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';

const prisma = new PrismaClient();

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Find user by username in the profiles table
        const user = await prisma.profile.findUnique({
          where: {
            username: credentials.username,
          },
        });

        if (!user || !user.password_hash) {
          return null;
        }

        // Compare the provided password with the hashed password
        const isValid = await compare(credentials.password, user.password_hash);

        if (!isValid) {
          return null;
        }

        // Return user object without password
        return {
          id: user.id,
          name: user.full_name,
          email: user.username, // Using username as email for simplicity
          role: user.role,
          unitId: user.assigned_unit_id,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.unitId = user.unitId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
        session.user.unitId = token.unitId as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
  }
});