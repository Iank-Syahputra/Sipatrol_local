import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // Tambahkan ini supaya support localhost http
  // ---------------------------------------------
  useSecureCookies: process.env.NODE_ENV === "production", 
  cookies: {
    sessionToken: {
      name: "next-auth.session-token", // Paksa nama cookie yang konsisten
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production", // False jika di localhost
      },
    },
  },
  // ---------------------------------------------

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username dan Password wajib diisi");
        }

        const cleanUsername = credentials.username.trim();

        const user = await prisma.profile.findFirst({
          where: { username: cleanUsername }
        });

        if (!user) {
          throw new Error("User tidak ditemukan");
        }

        let isValid = false;
        try {
          isValid = await bcrypt.compare(credentials.password, user.password);
        } catch (e) {
          isValid = credentials.password === user.password;
        }

        if (!isValid && credentials.password === user.password) {
            isValid = true;
        }

        if (!isValid) {
          throw new Error("Password salah");
        }

        return {
          id: user.id,
          name: user.fullName,
          email: user.username, 
          role: user.role,
          unitId: user.assignedUnitId
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.unitId = user.unitId;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.unitId = token.unitId;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  trustHost: true, // Penting untuk Next.js 15
  secret: process.env.NEXTAUTH_SECRET || "rahasia_dapur_sipatrol_2026",
  debug: true,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };