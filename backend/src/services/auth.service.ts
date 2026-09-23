import type { LoginInput, RegisterInput } from '../schemas/auth.schema';
import { AppError } from '../utils/app-error';
import { DEFAULT_CATEGORIES } from '../utils/default-categories';
import { signToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';
import { prisma } from '../utils/prisma';

const publicUserSelect = { id: true, name: true, email: true, createdAt: true } as const;

// Compared against when the e-mail does not exist, so the response time does
// not reveal which e-mails are registered. Uses the same cost as real hashes.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword('dummy-password-never-matches'));

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new AppError('E-mail já cadastrado', 409);
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      categories: { createMany: { data: [...DEFAULT_CATEGORIES] } },
    },
    select: publicUserSelect,
  });

  return { user, token: signToken(user.id) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  const passwordMatches = await comparePassword(
    input.password,
    user?.passwordHash ?? (await getDummyHash()),
  );

  if (!user || !passwordMatches) {
    throw new AppError('E-mail ou senha inválidos', 401);
  }

  return {
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    token: signToken(user.id),
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });

  if (!user) {
    throw new AppError('Usuário não encontrado', 401);
  }

  return user;
}
