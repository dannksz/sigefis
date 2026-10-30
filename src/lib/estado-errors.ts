import { Prisma } from "@prisma/client";

export function isEstadoSiglaConflict(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return false;
  }

  const target = error.meta?.target;
  return (
    target === "estado_sigla_key" ||
    target === "sigla" ||
    (Array.isArray(target) && target.includes("sigla"))
  );
}
