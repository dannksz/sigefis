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

Adicione também `JWT_SECRET` ao `.env`. Gere um valor forte com `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` e nunca compartilhe nem versione o `.env`.
\`\`\`env
JWT_SECRET="substitua-pelo-valor-aleatorio-gerado"
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

O cadastro (`POST /api/users`) é público e sempre cria usuários com papel `USER`; o campo `role` não pode ser enviado. Os demais métodos de `/api/users` exigem um JWT no cabeçalho `Authorization: Bearer <token>` e, por enquanto, apenas `ADMIN` pode utilizá-los. O login em `POST /api/auth/login` é público.

Para promover manualmente o primeiro usuário a administrador em um ambiente local, faça isso no phpMyAdmin após conferir o ID do usuário:

```sql
UPDATE usuario SET role = 'ADMIN' WHERE id = <ID_DO_USUARIO>;
```

Não exponha essa operação como endpoint público. O `.env` deve conter um `JWT_SECRET` aleatório com pelo menos 32 bytes.

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
  "cpf": "12345678901"
}
\`\`\`

`cpf` deve conter 11 dígitos; `cnpj`, se informado, deve conter 14 dígitos. `dataNascimento` (formato ISO 8601) e `enderecoId` são opcionais. A senha deve conter ao menos 8 caracteres e no máximo 72 bytes. O campo `senha` é armazenado com hash e nunca é incluído nas respostas.

Execute `npm test` para validar as regras de autenticação e os payloads de usuários.

### Checklist de testes manuais

Use dados de teste em uma obra com contrato, verba alocada e etapa de cronograma. Use a mesma etapa durante todo o fluxo.

- [ ] Como fiscal interno, registrar uma vistoria e anexar uma evidência.
- [ ] Como fiscal externo designado, abrir a vistoria, conferir o anexo e aprovar a revisão. Confirmar o status e o parecer no histórico.
- [ ] Como gestor, solicitar uma liberação na verba da etapa. Como administrador de outra conta, aprovar a solicitação e conferir o status e o total aprovado.
- [ ] Como gestor, tentar registrar um pagamento acima do saldo liberado e conferir se a API bloqueia o registro.
- [ ] Registrar um pagamento com nota fiscal dentro dos limites do contrato e do saldo liberado. Como administrador de outra conta, aprovar e conferir o status e o total atualizado.

## Listagem de auditoria

`GET /api/logs-auditoria` exige um JWT de `ADMIN` no cabeçalho `Authorization: Bearer <token>`.
Omitir `categoria` retorna todos os eventos. Use `page` e `pageSize` para paginar os resultados.

| Categoria | Eventos |
|---|---|
| `login` | Logins bem-sucedidos e malsucedidos |
| `obras` | Projetos, etapas do cronograma e vínculos entre projetos e verbas |
| `financeiro` | Verbas, emendas, contratos, contas bancárias, liberações, pagamentos, decisões e bloqueios de repasse |
| `fiscalizacao` | Designações de fiscais, vistorias, revisões, evidências, alertas e regularizações |

Por exemplo, `GET /api/logs-auditoria?categoria=login&page=1&pageSize=10` retorna os eventos de login e os totais de paginação dessa categoria. Uma categoria vazia, desconhecida ou repetida retorna HTTP `400`.

## API pública de obras

As rotas abaixo aceitam consultas sem autenticação.

| Rota | Resposta |
|---|---|
| `GET /api/publico/obras` | Lista de obras ordenada por ID, com `page`, `pageSize`, `total`, `totalPages` e `items`. Uma busca sem resultados retorna HTTP `200` com `items: []`. |
| `GET /api/publico/obras/{id}` | Uma obra publicada. Retorna HTTP `400` para ID inválido e `404` se a obra não existir ou estiver privada. |
| `GET /api/publico/obras/filtros` | Opções de região, estado, município, finalidade e status das obras publicadas. |

| Parâmetro da lista | Comportamento |
|---|---|
| `busca` | Busca por trecho do nome ou da descrição. |
| `finalidade` | Filtra pelo valor da finalidade. |
| `regiao` | Nome da região do endereço da obra, como `Sudeste`. |
| `estadoId` | ID inteiro positivo do estado do município. |
| `cidadeId` | ID inteiro positivo do município associado ao endereço da obra. |
| `dataInicio`, `dataFim` | Limites opcionais em `YYYY-MM-DD`. A obra entra no resultado se pelo menos uma etapa prevista cruzar o intervalo, incluindo as datas de início e fim. É possível informar só um dos limites. |
| `status` | Status de uma etapa, por exemplo `EM_EXECUCAO`. Com filtro de período, a mesma etapa precisa atender às duas condições. |
| `conclusaoInicio`, `conclusaoFim` | Limites inclusivos da **data de término prevista da etapa**, em `YYYY-MM-DD`. É possível informar só um dos limites. Com status ou período, a mesma etapa precisa atender a todas as condições. |
| `entregaInicio`, `entregaFim` | Limites inclusivos da **entrega prevista da obra**, em `YYYY-MM-DD`. É possível informar só um dos limites. Obras sem previsão ficam fora desse filtro. |
| `page` | Número da página a partir de 1. Padrão `1`. |
| `pageSize` | Quantidade de itens de 1 a 100. Padrão `10`. |

Valores inválidos de paginação usam os padrões. Município malformado, data inválida, intervalo invertido ou status vazio ou com mais de 45 caracteres retornam HTTP `400`. Um município ou status válido sem correspondência retorna lista vazia.

Exemplo de consulta:

```http
GET /api/publico/obras?regiao=Sudeste&conclusaoInicio=2026-05-01&conclusaoFim=2026-06-30&status=EM_EXECUCAO&page=1&pageSize=10
```

O endpoint de opções devolve `regioes`, `finalidades` e `status` como listas de strings. `estados` contém `id`, `nome`, `sigla` e `regiao`. `cidades` contém `id`, `nome` e `estadoId`. O frontend pode cruzar esses campos para montar os seletores em cascata. Cada localização e valor de opção vem de pelo menos uma obra publicada.

Cada obra contém `id`, `nome`, `descricao`, `finalidade`, `dataConclusao`, `municipio` (`id`, `nome`, `uf`), `etapas`, `contratos`, `pagamentosAprovados`, `liberacoesAprovadas`, `fiscalizacoes`, `alertas` e `totaisFinanceiros`. `dataConclusao` representa a entrega prevista da obra e retorna `null` quando não informada. As etapas retornam ID, nome, status e datas previstas. As datas públicas usam `YYYY-MM-DD`.

`POST /api/projetos` e `PUT /api/projetos/{id}` aceitam `dataConclusao` opcional em `YYYY-MM-DD`. Em uma edição, omitir o campo preserva a data gravada e enviar `null` limpa a previsão.

`totaisFinanceiros` tem quatro valores em reais, como strings decimais com duas casas. `alocado` soma os vínculos projeto–verba, `contratado` soma os contratos, `liberado` soma liberações aprovadas e `pago` soma pagamentos aprovados. Os filtros selecionam obras, e a resposta inclui todas as etapas e os totais integrais de cada obra selecionada.

Obras e alertas começam privados. Um `ADMIN` pode enviar `{"publicado":true}` ou `{"publicado":false}` via `PUT /api/projetos/{id}` e `PUT /api/alertas-fiscalizacao/{id}` com JWT. Um alerta só aparece se ele e a obra estiverem publicados. O seed publica explicitamente a obra de demonstração **Revitalização da Praça Central**.

Falhas internas retornam HTTP `500` com um objeto contendo `error`.
