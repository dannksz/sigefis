import prisma from "@/lib/prisma";
import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { ContatoInput, MensagemContato } from "@/types/contato";

export class ContatoRepository {
  async create(data: ContatoInput): Promise<void> {
    await prisma.mensagem_contato.create({ data, select: { id: true } });
  }

  findAll(query: ListQuery): Promise<PaginatedResult<MensagemContato>> {
    return paginate({
      query,
      count: () => prisma.mensagem_contato.count(),
      findMany: ({ skip, take }) => prisma.mensagem_contato.findMany({
        skip, take, orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      }),
      map: (row) => ({ ...row, criadoEm: row.criadoEm.toISOString() }),
    });
  }
}
