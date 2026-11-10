import { EtapaCronogramaRepository } from "@/repositories/etapa-cronograma.repository";
import { LiberacaoRecursoRepository } from "@/repositories/liberacao-recurso.repository";
import { ProjetoVerbaRepository } from "@/repositories/projeto-verba.repository";
import { VerbaPublicaRepository } from "@/repositories/verba-publica.repository";
import type {
  CreateLiberacaoRecursoDTO,
  LiberacaoRecursoResponseDTO,
  UpdateLiberacaoRecursoDTO,
} from "@/types/liberacao-recurso";

function cents(value: string): bigint {
  const [integer, decimal = ""] = value.split(".");
  return BigInt(integer) * BigInt("100") + BigInt(decimal.padEnd(2, "0"));
}

function money(value: bigint): string {
  const hundred = BigInt("100");
  return `${value / hundred}.${(value % hundred).toString().padStart(2, "0")}`;
}

export class LiberacaoRecursoService {
  private repository = new LiberacaoRecursoRepository();
  private etapaRepository = new EtapaCronogramaRepository();
  private verbaRepository = new VerbaPublicaRepository();
  private projetoVerbaRepository = new ProjetoVerbaRepository();

  private async ensureLimit(
    verbaPublicaId: number,
    etapaCronogramaId: number,
    valorLiberacao: string,
    excludeId?: number,
  ): Promise<void> {
    const etapa = await this.etapaRepository.findById(etapaCronogramaId);
    if (!etapa) throw new Error("Etapa do cronograma não encontrada.");
    if (!(await this.verbaRepository.existsById(verbaPublicaId))) {
      throw new Error("Verba pública não encontrada.");
    }
    const vinculo = (await this.projetoVerbaRepository.findAll()).find(
      (item) => item.projetoObraId === etapa.projetoObraId && item.verbaPublicaId === verbaPublicaId,
    );
    if (!vinculo) throw new Error("A verba não está vinculada ao projeto da etapa.");
    const liberado = cents(await this.repository.sumByVerba(verbaPublicaId, excludeId));
    if (liberado + cents(valorLiberacao) > cents(vinculo.valorAlocado)) {
      throw new Error(`O total de liberações excede o valor alocado (${money(cents(vinculo.valorAlocado))}).`);
    }
  }

  async create(data: CreateLiberacaoRecursoDTO): Promise<LiberacaoRecursoResponseDTO> {
    await this.ensureLimit(data.verbaPublicaId, data.etapaCronogramaId, data.valorLiberacao);
    return this.repository.create(data);
  }
  findAll() { return this.repository.findAll(); }
  async findById(id: number): Promise<LiberacaoRecursoResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Liberação de recurso não encontrada.");
    return item;
  }
  async update(id: number, data: UpdateLiberacaoRecursoDTO): Promise<LiberacaoRecursoResponseDTO> {
    const current = await this.findById(id);
    await this.ensureLimit(
      data.verbaPublicaId ?? current.verbaPublicaId,
      data.etapaCronogramaId ?? current.etapaCronogramaId,
      data.valorLiberacao ?? current.valorLiberacao,
      id,
    );
    return this.repository.update(id, data);
  }
  async delete(id: number) {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
