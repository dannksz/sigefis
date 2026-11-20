import "dotenv/config";
import prisma from "../src/lib/prisma";
import { cleanupOrphanEvidenceFiles } from "../src/lib/evidencia-upload";

async function main() {
  const removed = await cleanupOrphanEvidenceFiles();
  console.log(`Arquivos de evidência órfãos removidos: ${removed}.`);
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao limpar arquivos de evidência órfãos:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
