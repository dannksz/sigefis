import { UserRepository } from "../repositories/user.repository";
import { CreateUserDTO, UpdateUserDTO, UserResponseDTO } from "../types/user";
import * as bcrypt from "bcryptjs";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  // 1.Criar um novo usuário com validação de e-mail e hash de senha
  async create(data: CreateUserDTO): Promise<UserResponseDTO> {
    // Verificar se já existe um usuário com este email
    const userExists = await this.userRepository.findByEmail(data.email);
    if (userExists) {
      throw new Error("Já existe um usuário cadastrado com esse e-mail.");
    }

    //Criptografar a senha antes de mandar para o repositório 
    const hashedPassword = await bcrypt.hash(data.senha, 10);

    //Substituir a senha limpa pela senha criptografada no DTO
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
    //Garantir que o usuário existe antes de atualizar
    await this.findById(id);

    const updatedData = data.senha
      ? { ...data, senha: await bcrypt.hash(data.senha, 10) }
      : data;

    return await this.userRepository.update(id, updatedData);
  }

  //5. Deletar usuário
  async delete(id:number): Promise<void> {
    // Garantir que o usuário existe antes de deletar
    await this.findById(id);
    await this.userRepository.delete(id);
  }
}
