import {
  TransparenciaRepository,
  type ObraPublicaDTO,
} from "@/repositories/transparencia.repository";

export class TransparenciaService {
  private repository = new TransparenciaRepository();

  findAll(): Promise<ObraPublicaDTO[]> {
    return this.repository.findAll();
  }
}
