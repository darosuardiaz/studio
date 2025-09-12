import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabase } from '@/lib/supabase'


const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }: { user: any }) {

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single()

      if (error || !data) {
        return false
      }
      
      user.role = data.role
      user.id = data.id
      return true
    },

    async jwt({ token, user }: { token: any, user?: any }) {
      if (user?.role) {
        token.role = user.role
        token.userId = user.id
      }
      return token
    },
    
    async session({ session, token }: { session: any, token: any }) {
      if (session?.user && token?.userId) {
        session.user.id = token.userId
        session.user.role = token.role
      }
      return session
    },
  },
  // debug: process.env.NODE_ENV !== 'production',
})

export { handler as GET, handler as POST }
