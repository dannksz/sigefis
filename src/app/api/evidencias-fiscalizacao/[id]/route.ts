import { snapshotAuditWork } from "@/lib/audit-work";
import { NextResponse } from "next/server";
import { EvidenciaFiscalizacaoService } from "@/services/evidencia-fiscalizacao.service";
import { parseUpdateEvidenciaFiscalizacaoInput } from "@/lib/evidencia-fiscalizacao-validation";
import { deleteEvidenceFile } from "@/lib/evidencia-upload";
import { auditSuccess } from "@/lib/audit-request";

const service = new EvidenciaFiscalizacaoService();
interface Params {
  params: Promise<{ id: string }>;
}

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isNotFound(error: unknown): error is Error {
  return (
    error instanceof Error &&
    ["Evidência não encontrada.", "Fiscalização não encontrada."].includes(error.message)
  );
}

export async function GET(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de evidência inválido." }, { status: 400 });
  try {
    return NextResponse.json(await service.findById(id));
  } catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao buscar evidência:", error);
    return NextResponse.json({ error: "Erro interno ao buscar evidência." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de evidência inválido." }, { status: 400 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 });
  }
  const input = parseUpdateEvidenciaFiscalizacaoInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  if (input.data.caminhoArquivo !== undefined || input.data.fiscalizacaoId !== undefined) {
    return NextResponse.json({ error: "O arquivo e a vistoria são definidos no upload da evidência." }, { status: 400 });
  }
  try {
    const evidence = await service.findById(id);
    if (request.headers.get("x-auth-role") === "FISCAL" &&
        !await service.isAssignedInspector(Number(request.headers.get("x-auth-user-id")), evidence.fiscalizacaoId)) {
      return NextResponse.json({ error: "Somente fiscais designados podem alterar esta evidência." }, { status: 403 });
    }
    const result = await service.update(id, input.data);
    const usuarioId = Number(request.headers.get("x-auth-user-id"));
    if (Number.isSafeInteger(usuarioId) && usuarioId > 0) {
      await auditSuccess({
        acao: "ATUALIZAR_EVIDENCIA",
        pathname: `/api/evidencias-fiscalizacao/${id}`,
        usuarioId,
        ipOrigem: request.headers.get("x-auth-client-ip") || "unknown",
        registroId: result.id ?? id,
      }).catch((error: unknown) =>
        console.error("Erro ao auditar atualização de evidência:", error),
      );
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao atualizar evidência:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar evidência." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de evidência inválido." }, { status: 400 });
  try {
    const evidence = await service.findById(id);
    const work = await snapshotAuditWork("evidencia_fiscalizacao", id);
    await service.delete(id);
    try {
      await deleteEvidenceFile(evidence.caminhoArquivo);
    } catch (error: unknown) {
      console.error("Evidência removida, mas o arquivo não pôde ser excluído:", error);
      return NextResponse.json(
        { error: "Evidência removida, mas a limpeza do arquivo falhou." },
        { status: 500 },
      );
    }
    const usuarioId = Number(request.headers.get("x-auth-user-id"));
    if (Number.isSafeInteger(usuarioId) && usuarioId > 0) {
      await auditSuccess({
        acao: "EXCLUIR_EVIDENCIA",
        pathname: `/api/evidencias-fiscalizacao/${id}`,
        usuarioId,
        ipOrigem: request.headers.get("x-auth-client-ip") || "unknown",
        registroId: id,
        detalhes: work,
      }).catch((error: unknown) =>
        console.error("Erro ao auditar exclusão de evidência:", error),
      );
    }
    return NextResponse.json({ message: "Evidência excluída com sucesso." });
  } catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao excluir evidência:", error);
    return NextResponse.json({ error: "Erro interno ao excluir evidência." }, { status: 500 });
  }
}
