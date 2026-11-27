import "dotenv/config";
import { hash } from "bcryptjs";
import type { user_role } from "@prisma/client";
import prisma from "../src/lib/prisma";
import { demoData } from "./demo-data";

async function main() {
  const password = process.env.SIGEFIS_DEMO_PASSWORD ?? "SigefisDemo2026!";
  const senha = await hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const counts = await Promise.all([
      tx.estado.count(),
      tx.cidade.count(),
      tx.endereco.count(),
      tx.usuario.count(),
      tx.orgao_publico.count(),
      tx.empresa.count(),
      tx.verba_publica.count(),
      tx.emenda_parlamentar.count(),
      tx.projeto_obra.count(),
      tx.projeto_verba.count(),
      tx.etapa_cronograma.count(),
      tx.contrato.count(),
      tx.obra_fiscal.count(),
      tx.fiscalizacao.count(),
      tx.revisao_fiscalizacao.count(),
      tx.conta_bancaria.count(),
      tx.liberacao_recurso.count(),
      tx.pagamento.count(),
      tx.decisao_financeira.count(),
      tx.log_auditoria.count(),
      tx.evidencia_fiscalizacao.count(),
      tx.alerta_fiscalizacao.count(),
      tx.bloqueio_repasse.count(),
      tx.processo_regularizacao.count(),
    ]);
    if (counts.some((count) => count > 0)) {
      throw new Error("O seed de demonstração exige um banco vazio. Use um banco separado para preservar os dados existentes.");
    }

    // A ordem preserva as referências entre os registros do cenário.
    await tx.estado.createMany({ data: demoData.estado });
    await tx.cidade.createMany({ data: demoData.cidade });
    await tx.endereco.createMany({ data: demoData.endereco });
    await tx.usuario.createMany({
      data: demoData.usuario.map((user) => ({ ...user, role: user.role as user_role, senha })),
    });
    await tx.orgao_publico.createMany({ data: demoData.orgao_publico });
    await tx.empresa.createMany({ data: demoData.empresa });
    await tx.verba_publica.createMany({ data: demoData.verba_publica });
    await tx.emenda_parlamentar.createMany({ data: demoData.emenda_parlamentar });
    await tx.projeto_obra.createMany({ data: demoData.projeto_obra });
    await tx.projeto_verba.createMany({ data: demoData.projeto_verba });
    await tx.etapa_cronograma.createMany({ data: demoData.etapa_cronograma });
    await tx.contrato.createMany({ data: demoData.contrato });
    await tx.obra_fiscal.createMany({ data: demoData.obra_fiscal });
    await tx.fiscalizacao.createMany({ data: demoData.fiscalizacao });
    await tx.revisao_fiscalizacao.createMany({ data: demoData.revisao_fiscalizacao });
    await tx.conta_bancaria.createMany({ data: demoData.conta_bancaria });
    await tx.liberacao_recurso.createMany({ data: demoData.liberacao_recurso });
    await tx.pagamento.createMany({ data: demoData.pagamento });
    await tx.decisao_financeira.createMany({ data: demoData.decisao_financeira });
    await tx.log_auditoria.createMany({ data: demoData.log_auditoria });
  }, { isolationLevel: "Serializable", timeout: 30000 });

  console.log(`Seed concluído: ${demoData.projeto_obra.length} obras, ${demoData.contrato.length} contratos e ${demoData.etapa_cronograma.length} etapas.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
