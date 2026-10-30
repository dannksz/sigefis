import { CidadeRepository } from "@/repositories/cidade.repository";
import { EstadoRepository } from "@/repositories/estado.repository";
import type { CidadeResponseDTO, CreateCidadeDTO, UpdateCidadeDTO } from "@/types/cidade";

export class CidadeService {
    private cidadeRepository: CidadeRepository;
    private estadoRepository: EstadoRepository;

    constructor() {
        this.cidadeRepository = new CidadeRepository();
        this.estadoRepository = new EstadoRepository();
    }

    private async ensureEstadoExists(estadoId: number): Promise<void>{
        const estado = await this.estadoRepository.findById(estadoId);

        if(!estado) {
            throw new Error("Estado não encontrado.");
        }
    }

    async create(data: CreateCidadeDTO): Promise<CidadeResponseDTO> {
        await this.ensureEstadoExists(data.estadoId);
        return this.cidadeRepository.create(data);
    }

    async findAll(): Promise<CidadeResponseDTO[]> {
        return this.cidadeRepository.findAll();
    }

    async findById(id: number): Promise<CidadeResponseDTO> {
        const cidade = await this.cidadeRepository.findById(id);

        if (!cidade) {
            throw new Error("Cidade não encontrada.");
        }

        return cidade;
    }

    async update(
        id: number,
        data: UpdateCidadeDTO,
    ): Promise<CidadeResponseDTO> {
        await this.findById(id);

        if (data.estadoId !== undefined) {
            await this.ensureEstadoExists(data.estadoId);
        }

        return this.cidadeRepository.update(id, data);
    }

    async delete(id: number): Promise<void>{
        await this.findById(id);
        return this.cidadeRepository.delete(id);
    }
}