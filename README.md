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
O Prisma irá criar automaticamente a base de dados `sigefis` e todas as 20 tabelas estruturais no seu MySQL local:
\`\`\`bash
npx prisma migrate dev --name init_sigefis
\`\`\`

### 6. Rodar o projeto em modo de desenvolvimento
\`\`\`bash
npm run dev
\`\`\`
O aplicativo estará disponível acessando `http://localhost:3000` no seu navegador.