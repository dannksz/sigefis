# 🏛️ SIGEFIS - Sistema Integrado de Gestão e Fiscalização de Obras Públicas

Sistema desenvolvido para garantir total rastreabilidade, transparência e conformidade legal na gestão de obras públicas.

## 🚀 Tecnologias Utilizadas
- **Next.js** (Framework Frontend/Backend)
- **Prisma 7** (ORM e Gestão de Base de Dados)
- **MySQL (XAMPP)** (Base de dados relacional local)
- **TypeScript** (Tipagem estática)

---

## 📦 Como Executar o Projeto Localmente

Siga o passo a passo abaixo para configurar e rodar o projeto na sua máquina:

### 1. Pré-requisitos
- Ter o Node.js instalado.
- Ter o **XAMPP** instalado e com o serviço **MySQL** ativo.

### 2. Clonar o repositório
Abra o terminal na pasta onde deseja clonar o projeto e execute:
\`\`\`bash
git clone https://github.com/dannksz/sigefis.git
cd sigefis
\`\`\`

### 3. Instalar as dependências
Instale os pacotes do projeto (incluindo o Prisma e o cliente):
\`\`\`bash
npm install
\`\`\`

### 4. Configurar as Variáveis de Ambiente
Crie um ficheiro chamado `.env` na raiz do projeto e adicione a string de conexão com o seu MySQL local (XAMPP):
\`\`\`env
DATABASE_URL="mysql://root:@localhost:3306/sigefis"
\`\`\`

### 5. Executar as Migrações do Prisma
Crie primeiro a base de dados `sigefis` no MySQL (por exemplo, pelo phpMyAdmin). Depois aplique as migrations do projeto:
\`\`\`bash
npx prisma migrate dev
npx prisma generate
\`\`\`

### 6. Rodar o projeto em modo de desenvolvimento
\`\`\`bash
npm run dev
\`\`\`
O aplicativo estará disponível acessando `http://localhost:3000` no seu navegador.

---

## API de usuários (Thunder Client)

Use `http://localhost:3000/api/users` como URL base e envie `Content-Type: application/json` nas requisições com corpo.

| Método | URL | Ação |
|---|---|---|
| GET | `/api/users` | Lista os usuários |
| POST | `/api/users` | Cria um usuário |
| GET | `/api/users/{id}` | Busca um usuário pelo ID |
| PUT | `/api/users/{id}` | Atualiza os campos enviados |
| DELETE | `/api/users/{id}` | Exclui um usuário |

Exemplo de corpo para `POST /api/users`:

\`\`\`json
{
  "nome": "Ana Souza",
  "email": "ana@example.com",
  "senha": "SenhaForte123!",
  "cpf": "12345678901",
  "role": "USER"
}
\`\`\`

`role` deve ser `ADMIN`, `FISCAL`, `GESTOR` ou `USER`. `cnpj`, `dataNascimento` (formato ISO 8601) e `enderecoId` são opcionais. O campo `senha` é armazenado com hash e nunca é incluído nas respostas.