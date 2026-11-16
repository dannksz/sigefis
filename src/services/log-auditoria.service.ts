import { LogAuditoriaRepository } from "@/repositories/log-auditoria.repository";
import { UserRepository } from "@/repositories/user.repository";
import type {
  CreateLogAuditoriaDTO,
  LogAuditoriaResponseDTO,
} from "@/types/log-auditoria";

export class LogAuditoriaService {
  private repository = new LogAuditoriaRepository();
  private userRepository = new UserRepository();

  private async ensureUser(usuarioId: number): Promise<void> {
    if (!(await this.userRepository.findById(usuarioId))) {
      throw new Error("Usuário não encontrado.");
    }
  }

  async create(data: CreateLogAuditoriaDTO): Promise<LogAuditoriaResponseDTO> {
    await this.ensureUser(data.usuarioId);
    return this.repository.create(data);
  }

  findAll(): Promise<LogAuditoriaResponseDTO[]> {
    return this.repository.findAll();
  }

  async findById(id: number): Promise<LogAuditoriaResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Log de auditoria não encontrado.");
    return item;
  }

}
