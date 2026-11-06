import prisma from "@/lib/prisma";

export class VerbaPublicaRepository {
  async existsById(id: number): Promise<boolean> {
    const verba = await prisma.verba_publica.findUnique({
      where: { id },
      select: { id: true },
    });

    return verba !== null;
  }
}
