import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db/client";
import { env } from "@/lib/env";
import { checkRateLimit } from "@/server/services/rate-limit";

const DUMMY_PASSWORD_HASH = "$2b$12$HijdupQ4Y0TErvTaslcVd.LJQ2JdHJaXMtNQZ0ingZMvepv.dsqLm";
const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 60;

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/login",
    newUser: "/onboarding",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase();

        const rateLimited = await checkRateLimit(`login:${email}`, LOGIN_RATE_LIMIT, LOGIN_RATE_LIMIT_WINDOW_SECONDS);
        if (!rateLimited.allowed) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          await bcrypt.compare(credentials.password as string, DUMMY_PASSWORD_HASH);
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "credentials") {
        return true;
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  secret: env.AUTH_SECRET,
  trustHost: true,
};