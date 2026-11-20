import "dotenv/config";
import * as bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";

const demoPassword = "SigefisDemo2026!";

const estadosComCapitais = [
  ["Acre", "AC", "Norte", "Rio Branco"],
  ["Alagoas", "AL", "Nordeste", "Maceió"],
  ["Amapá", "AP", "Norte", "Macapá"],
  ["Amazonas", "AM", "Norte", "Manaus"],
  ["Bahia", "BA", "Nordeste", "Salvador"],
  ["Ceará", "CE", "Nordeste", "Fortaleza"],
  ["Distrito Federal", "DF", "Centro-Oeste", "Brasília"],
  ["Espírito Santo", "ES", "Sudeste", "Vitória"],
  ["Goiás", "GO", "Centro-Oeste", "Goiânia"],
  ["Maranhão", "MA", "Nordeste", "São Luís"],
  ["Mato Grosso", "MT", "Centro-Oeste", "Cuiabá"],
  ["Mato Grosso do Sul", "MS", "Centro-Oeste", "Campo Grande"],
  ["Minas Gerais", "MG", "Sudeste", "Belo Horizonte"],
  ["Pará", "PA", "Norte", "Belém"],
  ["Paraíba", "PB", "Nordeste", "João Pessoa"],
  ["Paraná", "PR", "Sul", "Curitiba"],
  ["Pernambuco", "PE", "Nordeste", "Recife"],
  ["Piauí", "PI", "Nordeste", "Teresina"],
  ["Rio de Janeiro", "RJ", "Sudeste", "Rio de Janeiro"],
  ["Rio Grande do Norte", "RN", "Nordeste", "Natal"],
  ["Rio Grande do Sul", "RS", "Sul", "Porto Alegre"],
  ["Rondônia", "RO", "Norte", "Porto Velho"],
  ["Roraima", "RR", "Norte", "Boa Vista"],
  ["Santa Catarina", "SC", "Sul", "Florianópolis"],
  ["São Paulo", "SP", "Sudeste", "São Paulo"],
  ["Sergipe", "SE", "Nordeste", "Aracaju"],
  ["Tocantins", "TO", "Norte", "Palmas"],
] as const;

function date(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

async function findOrCreateEstado(data: {
  nome: string;
  sigla: string;
  regiao: string;
}) {
  return prisma.estado.upsert({
    where: { sigla: data.sigla },
    update: {},
    create: data,
  });
}

async function findOrCreateCidade(data: { nome: string; estadoId: number }) {
  const existing = await prisma.cidade.findFirst({ where: data });
  return existing ?? prisma.cidade.create({ data });
}

async function findOrCreateEndereco(data: {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  cidadeId: number;
}) {
  const existing = await prisma.endereco.findFirst({ where: data });
  return existing ?? prisma.endereco.create({ data });
}

async function findOrCreateUsuario(data: {
  nome: string;
  email: string;
  cpf: string;
  role: "ADMIN" | "FISCAL" | "GESTOR" | "USER";
  enderecoId: number;
  senha: string;
}) {
  return prisma.usuario.upsert({
    where: { email: data.email },
    update: {},
    create: {
      ...data,
      senha: await bcrypt.hash(data.senha, 10),
    },
  });
}

async function findOrCreateOrgao(data: {
  nome: string;
  sigla: string;
  enderecoId: number;
}) {
  const existing = await prisma.orgao_publico.findFirst({
    where: { nome: data.nome, sigla: data.sigla },
  });
  return existing ?? prisma.orgao_publico.create({ data });
}

async function findOrCreateEmpresa(data: {
  nome: string;
  cnpj: string;
  representanteLegal: string;
  telefone: string;
  email: string;
  enderecoId: number;
}) {
  return prisma.empresa.upsert({
    where: { cnpj: data.cnpj },
    update: {},
    create: data,
  });
}

async function findOrCreateProjeto(data: {
  nome: string;
  descricao: string;
  finalidade: string;
  enderecoId: number;
}) {
  const existing = await prisma.projeto_obra.findFirst({
    where: { nome: data.nome },
  });
  return existing ?? prisma.projeto_obra.create({ data });
}

async function findOrCreateVerba(data: {
  valor: string;
  origem: string;
  finalidade: string;
  orgaoId: number;
}) {
  const existing = await prisma.verba_publica.findFirst({
    where: { origem: data.origem, finalidade: data.finalidade, orgaoId: data.orgaoId },
  });
  return existing ?? prisma.verba_publica.create({ data });
}

async function findOrCreateEtapa(data: {
  projetoObraId: number;
  nomeEtapa: string;
  ordemEtapa: number;
  percentualPrevisto: string;
  percentualExecutado: string;
  dataInicioPrevista: Date;
  dataFimPrevista: Date;
  dataInicioReal?: Date;
  status: string;
}) {
  const existing = await prisma.etapa_cronograma.findFirst({
    where: { projetoObraId: data.projetoObraId, ordemEtapa: data.ordemEtapa },
  });
  return existing ?? prisma.etapa_cronograma.create({ data });
}

async function main() {
  const estados = new Map<string, { id: number }>();
  for (const [nome, sigla, regiao, capital] of estadosComCapitais) {
    const estado = await findOrCreateEstado({ nome, sigla, regiao });
    await findOrCreateCidade({ nome: capital, estadoId: estado.id });
    estados.set(sigla, estado);
  }

  const estadoSp = estados.get("SP");
  const estadoPr = estados.get("PR");
  if (!estadoSp || !estadoPr) {
    throw new Error("A seed não encontrou os estados SP e PR.");
  }

  const cidadeCampinas = await findOrCreateCidade({
    nome: "Campinas",
    estadoId: estadoSp.id,
  });
  const cidadeCuritiba = await findOrCreateCidade({
    nome: "Curitiba",
    estadoId: estadoPr.id,
  });

  const enderecoPrefeitura = await findOrCreateEndereco({
    logradouro: "Avenida Municipal",
    numero: "100",
    bairro: "Centro",
    cep: "13010000",
    cidadeId: cidadeCampinas.id,
  });
  const enderecoObra = await findOrCreateEndereco({
    logradouro: "Rua das Flores",
    numero: "250",
    bairro: "Jardim Esperança",
    cep: "13050000",
    cidadeId: cidadeCampinas.id,
  });
  const enderecoEmpresa = await findOrCreateEndereco({
    logradouro: "Rua dos Engenheiros",
    numero: "80",
    bairro: "Vila Industrial",
    cep: "80010000",
    cidadeId: cidadeCuritiba.id,
  });

  const admin = await findOrCreateUsuario({
    nome: "Administrador de Demonstração",
    email: "admin.demo@sigefis.local",
    cpf: "90000000001",
    role: "ADMIN",
    enderecoId: enderecoPrefeitura.id,
    senha: demoPassword,
  });
  const gestor = await findOrCreateUsuario({
    nome: "Gestor de Obras de Demonstração",
    email: "gestor.demo@sigefis.local",
    cpf: "90000000002",
    role: "GESTOR",
    enderecoId: enderecoPrefeitura.id,
    senha: demoPassword,
  });
  const fiscalInterno = await findOrCreateUsuario({
    nome: "Fiscal Interno de Demonstração",
    email: "fiscal.interno@sigefis.local",
    cpf: "90000000003",
    role: "FISCAL",
    enderecoId: enderecoPrefeitura.id,
    senha: demoPassword,
  });
  const fiscalExterno = await findOrCreateUsuario({
    nome: "Fiscal Externo de Demonstração",
    email: "fiscal.externo@sigefis.local",
    cpf: "90000000004",
    role: "FISCAL",
    enderecoId: enderecoEmpresa.id,
    senha: demoPassword,
  });
  await findOrCreateUsuario({
    nome: "Usuário Público de Demonstração",
    email: "usuario.demo@sigefis.local",
    cpf: "90000000005",
    role: "USER",
    enderecoId: enderecoPrefeitura.id,
    senha: demoPassword,
  });

  const orgao = await findOrCreateOrgao({
    nome: "Secretaria Municipal de Obras",
    sigla: "SMO",
    enderecoId: enderecoPrefeitura.id,
  });
  const empresa = await findOrCreateEmpresa({
    nome: "Construtora Horizonte Ltda.",
    cnpj: "00.000.000/0001-00",
    representanteLegal: "Marina de Souza",
    telefone: "(19) 3000-0000",
    email: "contato@horizonte.local",
    enderecoId: enderecoEmpresa.id,
  });

  const projeto = await findOrCreateProjeto({
    nome: "Revitalização da Praça Central",
    descricao: "Revitalização de pavimentação, iluminação e acessibilidade da praça central.",
    finalidade: "Infraestrutura urbana",
    enderecoId: enderecoObra.id,
  });
  const projetoEscola = await findOrCreateProjeto({
    nome: "Ampliação da Escola Municipal",
    descricao: "Construção de novas salas e adequação da área de convivência escolar.",
    finalidade: "Educação",
    enderecoId: enderecoObra.id,
  });

  const verba = await findOrCreateVerba({
    valor: "850000.00",
    origem: "Tesouro municipal",
    finalidade: "Revitalização urbana",
    orgaoId: orgao.id,
  });
  const verbaEducacao = await findOrCreateVerba({
    valor: "1200000.00",
    origem: "Fundo municipal de educação",
    finalidade: "Ampliação escolar",
    orgaoId: orgao.id,
  });

  const vinculoProjeto = await prisma.projeto_verba.findFirst({
    where: { projetoObraId: projeto.id, verbaPublicaId: verba.id },
  });
  if (!vinculoProjeto) {
    await prisma.projeto_verba.create({
      data: { projetoObraId: projeto.id, verbaPublicaId: verba.id, valorAlocado: "850000.00" },
    });
  }
  const vinculoEscola = await prisma.projeto_verba.findFirst({
    where: { projetoObraId: projetoEscola.id, verbaPublicaId: verbaEducacao.id },
  });
  if (!vinculoEscola) {
    await prisma.projeto_verba.create({
      data: {
        projetoObraId: projetoEscola.id,
        verbaPublicaId: verbaEducacao.id,
        valorAlocado: "1200000.00",
      },
    });
  }

  const contrato = await prisma.contrato.findFirst({
    where: { numeroContrato: "001/2026-SMO" },
  });
  const contratoAtual =
    contrato ??
    (await prisma.contrato.create({
      data: {
        numeroContrato: "001/2026-SMO",
        valorContrato: "850000.00",
        dataAssinatura: date("2026-01-15"),
        dataInicio: date("2026-02-01"),
        dataFim: date("2026-12-20"),
        projetoObraId: projeto.id,
        empresaId: empresa.id,
        verbaPublicaId: verba.id,
      },
    }));

  const etapa = await findOrCreateEtapa({
    projetoObraId: projeto.id,
    nomeEtapa: "Execução da pavimentação",
    ordemEtapa: 1,
    percentualPrevisto: "60.00",
    percentualExecutado: "45.00",
    dataInicioPrevista: date("2026-02-01"),
    dataFimPrevista: date("2026-06-30"),
    dataInicioReal: date("2026-02-03"),
    status: "EM_EXECUCAO",
  });
  await findOrCreateEtapa({
    projetoObraId: projetoEscola.id,
    nomeEtapa: "Fundação e estrutura",
    ordemEtapa: 1,
    percentualPrevisto: "40.00",
    percentualExecutado: "20.00",
    dataInicioPrevista: date("2026-03-01"),
    dataFimPrevista: date("2026-08-31"),
    dataInicioReal: date("2026-03-05"),
    status: "EM_EXECUCAO",
  });

  const designacaoInterna = await prisma.obra_fiscal.findFirst({
    where: { projetoObraId: projeto.id, usuarioId: fiscalInterno.id },
  });
  if (!designacaoInterna) {
    await prisma.obra_fiscal.create({
      data: {
        dataDesignacao: date("2026-01-20"),
        usuarioId: fiscalInterno.id,
        projetoObraId: projeto.id,
        tipoFiscal: "INTERNO",
      },
    });
  }
  const designacaoExterna = await prisma.obra_fiscal.findFirst({
    where: { projetoObraId: projeto.id, usuarioId: fiscalExterno.id },
  });
  if (!designacaoExterna) {
    await prisma.obra_fiscal.create({
      data: {
        dataDesignacao: date("2026-01-22"),
        usuarioId: fiscalExterno.id,
        projetoObraId: projeto.id,
        tipoFiscal: "EXTERNO",
      },
    });
  }

  const fiscalizacao = await prisma.fiscalizacao.findFirst({
    where: { projetoObraId: projeto.id, dataVistoria: date("2026-05-15") },
  });
  const fiscalizacaoAtual =
    fiscalizacao ??
    (await prisma.fiscalizacao.create({
      data: {
        dataVistoria: date("2026-05-15"),
        percentualExecutado: "45.00",
        parecerTecnico: "Serviços executados conforme o cronograma, com necessidade de acompanhamento da drenagem.",
        statusVistoria: "APROVADA",
        projetoObraId: projeto.id,
        usuarioId: fiscalInterno.id,
        etapaCronogramaId: etapa.id,
      },
    }));

  const revisao = await prisma.revisao_fiscalizacao.findFirst({
    where: { fiscalizacaoId: fiscalizacaoAtual.id, fiscalExternoId: fiscalExterno.id },
  });
  if (!revisao) {
    await prisma.revisao_fiscalizacao.create({
      data: {
        fiscalizacaoId: fiscalizacaoAtual.id,
        fiscalExternoId: fiscalExterno.id,
        statusRevisao: "APROVADA",
        parecer: "Vistoria conferida e aprovada para fins de medição.",
        dataRevisao: date("2026-05-18"),
      },
    });
  }

  const conta = await prisma.conta_bancaria.findFirst({
    where: { projetoObraId: projeto.id, orgaoPublicoId: orgao.id },
  });
  if (!conta) {
    await prisma.conta_bancaria.create({
      data: {
        banco: "Banco do Brasil",
        agencia: "1234-5",
        numeroConta: "67890-1",
        tipoConta: "Conta vinculada",
        orgaoPublicoId: orgao.id,
        projetoObraId: projeto.id,
      },
    });
  }

  const liberacao = await prisma.liberacao_recurso.findFirst({
    where: { etapaCronogramaId: etapa.id, verbaPublicaId: verba.id },
  });
  const liberacaoAtual =
    liberacao ??
    (await prisma.liberacao_recurso.create({
      data: {
        valorLiberacao: "250000.00",
        dataLiberacao: date("2026-05-20"),
        verbaPublicaId: verba.id,
        etapaCronogramaId: etapa.id,
        status: "APROVADA",
        criadoPorUsuarioId: gestor.id,
        aprovadoPorUsuarioId: admin.id,
        dataAprovacao: date("2026-05-21"),
      },
    }));

  const pagamento = await prisma.pagamento.findFirst({
    where: { numeroNotaFiscal: "NF-DEMO-0001" },
  });
  if (!pagamento) {
    await prisma.pagamento.create({
      data: {
        valorPagamento: "180000.00",
        dataPagamento: date("2026-05-25"),
        numeroNotaFiscal: "NF-DEMO-0001",
        contratoId: contratoAtual.id,
        etapaCronogramaId: etapa.id,
        status: "APROVADA",
        criadoPorUsuarioId: gestor.id,
        aprovadoPorUsuarioId: admin.id,
        dataAprovacao: date("2026-05-26"),
      },
    });
  }

  const decisao = await prisma.decisao_financeira.findFirst({
    where: { tipoOperacao: "LIBERACAO", operacaoId: liberacaoAtual.id, status: "APROVADA" },
  });
  if (!decisao) {
    await prisma.decisao_financeira.create({
      data: {
        tipoOperacao: "LIBERACAO",
        operacaoId: liberacaoAtual.id,
        status: "APROVADA",
        justificativa: "Registro de demonstração aprovado pelo administrador.",
        usuarioId: admin.id,
        dataDecisao: date("2026-05-21"),
      },
    });
  }

  const pagamentoAtual = await prisma.pagamento.findUnique({
    where: { numeroNotaFiscal: "NF-DEMO-0001" },
  });
  if (pagamentoAtual) {
    const decisaoPagamento = await prisma.decisao_financeira.findFirst({
      where: {
        tipoOperacao: "PAGAMENTO",
        operacaoId: pagamentoAtual.id,
        status: "APROVADA",
      },
    });
    if (!decisaoPagamento) {
      await prisma.decisao_financeira.create({
        data: {
          tipoOperacao: "PAGAMENTO",
          operacaoId: pagamentoAtual.id,
          status: "APROVADA",
          justificativa: "Registro de demonstração aprovado pelo administrador.",
          usuarioId: admin.id,
          dataDecisao: date("2026-05-26"),
        },
      });
    }
  }

  console.log("Carga inicial fictícia concluída.");
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao executar a carga inicial fictícia:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
