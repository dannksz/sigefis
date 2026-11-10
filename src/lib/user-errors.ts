import { Prisma } from "@prisma/client";

export function isUserEmailConflict(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return false;
  }

  const target = error.meta?.target;
  return (
    target === "usuario_email_key" ||
    target === "email" ||
    (Array.isArray(target) && target.includes("email"))
  );
}

export function isUserAddressForeignKeyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}
