import { prisma } from "@/server/db/client";
import bcrypt from "bcryptjs";
import { AppError } from "@/server/validation/errors";

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) {
    throw new AppError("An account with this email already exists", "EMAIL_EXISTS", 400);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name.trim(),
      passwordHash,
      emailVerified: new Date(),
      passwordChangedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  return user;
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateUser(id: string, data: { name?: string; avatarUrl?: string; image?: string }) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updatePassword(userId: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordChangedAt: new Date() },
  });
}

export async function verifyPassword(userId: string, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) return false;
  return bcrypt.compare(password, user.passwordHash);
}