import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { connectDB } from "@/lib/db"
import { User } from "@/models"
import md5 from "md5"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        await connectDB()
        
        // 1. Cari user berdasarkan field 'user' (bukan email)
        const user = await User.findOne({ user: credentials.username })

        if (!user) {
          throw new Error("User not found.")
        }

        // Cek Password (MD5)
        if (user.password !== md5(credentials.password as string)) {
          throw new Error("Invalid password.")
        }

        // 2. Return data object
        // PENTING: Kita harus mapping field 'user' database ke 'email' NextAuth
        return {
          id: user._id.toString(),
          name: user.role,      // Bisa diisi role atau nama
          email: user.user,     // <--- INI KUNCINYA (Mapping user -> email)
          role: user.role,      // Custom field role
        }
      },
    }),
  ],
  callbacks: {
    // 3. Pastikan data masuk ke Token JWT
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.email = user.email // Pastikan email tersimpan
      }
      return token
    },
    // 4. Pastikan data masuk ke Session Client
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.email = token.email as string // Pastikan email terbaca di frontend
      }
      return session
    },
  },
})