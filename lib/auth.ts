import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { connectDB } from "@/lib/db"
import { User } from "@/models"
import md5 from "md5"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  
  // 1. Session Strategy
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Hari
  },

  // 2. CONFIG COOKIES (Solusi Looping Login)
  // Ini memaksa NextAuth menggunakan cookie yang kompatibel dengan HTTP & Docker
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // PENTING: Set 'false' agar bisa login di HTTP (non-SSL) atau di balik proxy
        // Jika nanti sudah full HTTPS di production, boleh diganti jadi 'true'
        secure: false, 
      },
    },
  },

  // 3. Halaman Login Custom
  pages: {
    signIn: "/login",
    error: "/api/auth/error",
  },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          await connectDB()

          const usernameInput = credentials?.username
          const passwordInput = credentials?.password
          
          // Validasi input kosong
          if (!usernameInput || !passwordInput) {
            throw new Error("Username dan Password wajib diisi.")
          }

          console.log(`🔍 Login Attempt: "${usernameInput}"`)

          // ============================================================
          // LOGIC DATABASE
          // Schema Anda kolomnya 'user', tapi input form 'username'
          // ============================================================
          const foundUser = await User.findOne({ user: usernameInput })

          if (!foundUser) {
            console.log("❌ User tidak ditemukan di database.")
            // (Opsional) Uncomment baris bawah ini jika ingin mengintip isi DB saat error
            // const allUsers = await User.find({}, 'user'); console.log("Isi DB:", allUsers);
            throw new Error("User not found.")
          }

          // Cek Password (MD5)
          const inputHash = md5(passwordInput as string)
          
          if (foundUser.password !== inputHash) {
            console.log("❌ Password Salah.")
            throw new Error("Invalid password.")
          }

          console.log("✅ Login Berhasil:", foundUser.user)

          // Return data user ke Token
          return {
            id: foundUser._id.toString(),
            name: foundUser.nama_lengkap || foundUser.role, 
            email: foundUser.user, // Simpan username di field email session
            role: foundUser.role,
          }
        } catch (error) {
          console.error("⚠️ Auth Error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        // Pastikan email di session terisi username dari database
        session.user.email = token.email as string 
      }
      return session
    },
  },
})