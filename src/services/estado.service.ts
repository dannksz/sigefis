import { EstadoRepository } from '@/repositories/estado.repository';
import type { CreateEstadoDTO, UpdateEstadoDTO, EstadoResponseDTO } from '../types/estado';

export class EstadoService {
    private estadoRepository: EstadoRepository;

    constructor() {
        this.estadoRepository = new EstadoRepository();
    }

    async create(data: CreateEstadoDTO): Promise<EstadoResponseDTO> {
        return this.estadoRepository.create(data);
    }

    async findAll(): Promise<EstadoResponseDTO[]> {
        return this.estadoRepository.findAll();
    }

    async findById(id: number): Promise<EstadoResponseDTO> {
        const estado = await this.estadoRepository.findById(id);

        if (!estado) {
            throw new Error(`Estado não encontrado.`);
        }

        return estado;
    }

    async update(id: number, data: UpdateEstadoDTO): Promise<EstadoResponseDTO> {
        await this.findById(id); // Verifica se o estado existe antes de atualizar
        return this.estadoRepository.update(id, data);
    }

    async delete(id: number): Promise<void> {
        await this.findById(id); // Verifica se o estado existe antes de deletar
        return this.estadoRepository.delete(id);
    }
}
