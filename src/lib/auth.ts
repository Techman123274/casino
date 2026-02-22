import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import clientPromise from "./mongodb";
import { connectDB } from "./mongoose";
import User from "@/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, { databaseName: "RapidRole" }),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log(
              "\x1b[31m[RAPID ROLE :: AUTH]\x1b[0m Missing credentials"
            );
            return null;
          }

          await connectDB();

          const user = await User.findOne({
            email: (credentials.email as string).toLowerCase(),
          });

          if (!user) {
            console.log(
              "\x1b[31m[RAPID ROLE :: AUTH]\x1b[0m User not found:",
              credentials.email
            );
            return null;
          }

          if (user.isSelfExcluded) {
            console.log(
              "\x1b[33m[RAPID ROLE :: AUTH]\x1b[0m Self-excluded user attempted login:",
              credentials.email
            );
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.hashedPassword
          );

          if (!isValid) {
            console.log(
              "\x1b[31m[RAPID ROLE :: AUTH]\x1b[0m Invalid password for:",
              credentials.email
            );
            return null;
          }

          console.log(
            "\x1b[32m[RAPID ROLE :: AUTH]\x1b[0m Login success:",
            user.username
          );

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.username,
            image: user.image,
          };
        } catch (err) {
          console.error(
            "\x1b[31m[RAPID ROLE :: AUTH]\x1b[0m authorize() crashed:",
            err instanceof Error ? err.message : err
          );
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
