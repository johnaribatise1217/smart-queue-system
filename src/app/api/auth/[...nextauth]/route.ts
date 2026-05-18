import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from "next-auth/providers/google"
import { type IUser, User } from "backend/model/user";
import dbConnect from "backend/config/dbConnect";

type Credentials = {
  email: string,
  password: string
}

type Token = {
  user: IUser
}

export const authOptions = (req: NextApiRequest, res: NextApiResponse):
 NextAuthOptions => ({
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},
      // @ts-ignore
      async authorize(credentials: Credentials) {
        await dbConnect()
        const { email, password } = credentials
        const user = await User.findOne({ email }).select('+password')
        if (!user) throw new Error("Invalid email or password")
        const isMatch = await user.comparePassword(password)
        if (!isMatch) throw new Error("Invalid email or password")
        if(!user.isVerified) throw new Error("Please verify your email before logging in")
        return user
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    })
  ],
  callbacks: {
    signIn: async ({ user, account }) => {
      if (account?.provider === "google") {
        await dbConnect()

        const role = 
          typeof window !== "undefined"
            ? localStorage.getItem("queue_role") ?? "user"
            : "user";

        let existingUser = await User.findOne({ email: user.email})
        if (!existingUser) {
          existingUser = await User.create({
            name: user.name,
            email: user.email,
            password: Math.random().toString(36).slice(-8),
            googleId: user.id,
            avatar: {
              public_id: `google_${user.id}`,
              url: user.image,
            },
            isVerified: true,
            role
          })
        }
      }
      return true
    },
    jwt: async ({ token, user, account }) => {
      // on initial sign in
      if (user) {
        if (account?.provider === "google") {
          await dbConnect()
          const dbUser = await User.findOne({ email: user.email }).select("-password")
          if (dbUser) {
            token.user = dbUser.toObject()
          }
        } else {
          token.user = user as unknown as IUser
        }
      }

      if (req?.url?.includes("/api/auth/session?update")) {
        const jwtToken = token as { user: IUser }
        const updatedUser = await User.findById(jwtToken?.user?._id).select("-password").lean()
        if (updatedUser) token.user = updatedUser as unknown as IUser
      }

      return token
    },
    session: async ({ session, token }) => {
      session.user = token.user as IUser
      // @ts-ignore
      delete session?.user?.password
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    secret: process.env.NEXTAUTH_SECRET
  },
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login',
  }
})

export const auth = async (req: NextApiRequest, res: NextApiResponse) => {
  return await NextAuth(req, res, authOptions(req, res))
}

export { auth as GET, auth as POST }