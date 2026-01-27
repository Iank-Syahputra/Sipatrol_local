// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma" // Pastikan path ini benar sesuai langkah 1
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  // 1. Setting Session
  session: {
    strategy: "jwt",
  },
  // 2. Secret Key (Wajib ambil dari .env)
  secret: process.env.AUTH_SECRET,

  // 3. Halaman Login Custom
  pages: {
    signIn: "/login", // Kalau user belum login, lempar kesini
  },

  // 4. Konfigurasi Login (Username & Password)
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Cek apakah input ada
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username dan Password wajib diisi")
        }

        // Cari User di Database (Tabel Profile)
        const user = await prisma.profile.findUnique({
          where: { username: credentials.username }
        })

        // Jika user tidak ada
        if (!user) {
          throw new Error("User tidak ditemukan")
        }

        // Cek Password
        // Handle jika password di db null (akun lama clerk)
        const dbPassword = user.password || ""
        const isPasswordValid = await bcrypt.compare(credentials.password, dbPassword)

        if (!isPasswordValid) {
          throw new Error("Password salah")
        }

        // Jika sukses, kembalikan data user
        return {
          id: user.id,
          name: user.fullName,
          email: user.username, // NextAuth butuh field email, kita isi username saja
          role: user.role,
          unitId: user.assignedUnitId
        }
      }
    })
  ],

  // 5. Callbacks (Agar Role & UnitId tersimpan di session)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.unitId = user.unitId
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role
        session.user.unitId = token.unitId
      }
      return session
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }