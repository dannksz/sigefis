import { UserRepository } from "../repositories/user.repository";
import { EnderecoRepository } from "../repositories/endereco.repository";
import { CreateUserDTO, UpdateUserDTO, UserResponseDTO } from "../types/user";
import * as bcrypt from "bcryptjs";

export class UserService {
  private userRepository: UserRepository;
  private enderecoRepository: EnderecoRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.enderecoRepository = new EnderecoRepository();
  }

  async create(data: CreateUserDTO): Promise<UserResponseDTO> {
    const userExists = await this.userRepository.findByEmail(data.email);
    if (userExists) {
      throw new Error("Já existe um usuário cadastrado com esse e-mail.");
    }

    if (data.enderecoId !== undefined && data.enderecoId !== null) {
      await this.ensureEnderecoExists(data.enderecoId);
    }

    const hashedPassword = await bcrypt.hash(data.senha, 10);
    const userDataToCreate = {
        ...data,
        senha: hashedPassword,
    };

    return await this.userRepository.create(userDataToCreate);
  }

  //2. Listar todos os usuários
  async findAll(): Promise<UserResponseDTO[]> {
    return await this.userRepository.findAll();
  }

  //3. Buscar usuário por ID
  async findById(id: number): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(id);
    if(!user){
        throw new Error('Usuário não encontrado.');
    }
    return user;
  }

  //4. Atualizar usuário
  async update(id:number, data: UpdateUserDTO): Promise<UserResponseDTO> {
    await this.findById(id);

    if (data.email !== undefined) {
      const userWithEmail = await this.userRepository.findByEmail(data.email);
      if (userWithEmail && userWithEmail.id !== id) {
        throw new Error("Já existe um usuário cadastrado com esse e-mail.");
      }
    }

    if (data.enderecoId !== undefined && data.enderecoId !== null) {
      await this.ensureEnderecoExists(data.enderecoId);
    }

    const updatedData = data.senha !== undefined
      ? { ...data, senha: await bcrypt.hash(data.senha, 10) }
      : data;

    return await this.userRepository.update(id, updatedData);
  }

  //5. Deletar usuário
  async delete(id:number): Promise<void> {
    await this.findById(id);
    await this.userRepository.delete(id);
  }

  async authenticate(data: { email: string; senha: string }): Promise<UserResponseDTO | null> {
    const user = await this.userRepository.findByEmailForAuthentication(data.email);
    if (!user) {
      return null;
    }

    const passwordMatch = await bcrypt.compare(data.senha, user.senha);
    if (!passwordMatch) {
      return null;
    }

    return user.user;
  }

  private async ensureEnderecoExists(enderecoId: number): Promise<void> {
    const endereco = await this.enderecoRepository.findById(enderecoId);
    if (!endereco) {
      throw new Error("Endereço não encontrado.");
    }
  }
}
