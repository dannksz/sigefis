import {
  TransparenciaRepository,
  type ObraPublicaDTO,
  type TransparenciaFilters,
  type TransparenciaPagination,
} from "@/repositories/transparencia.repository";

export class TransparenciaService {
  private repository = new TransparenciaRepository();

  findAll(filters: TransparenciaFilters): Promise<TransparenciaPagination> {
    return this.repository.findAll(filters);
  }

  listFilterOptions(filters?: Parameters<TransparenciaRepository["listFilterOptions"]>[0]) {
    return this.repository.listFilterOptions(filters);
  }

  async findById(id: number): Promise<ObraPublicaDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Obra pública não encontrada.");
    return item;
  }
}
