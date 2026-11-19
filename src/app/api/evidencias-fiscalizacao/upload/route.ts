import { NextResponse } from "next/server";
import { EvidenciaFiscalizacaoService } from "@/services/evidencia-fiscalizacao.service";
import { auditSuccess } from "@/lib/audit-request";
import {
  isValidLatitude,
  isValidLongitude,
  saveEvidenceFile,
} from "@/lib/evidencia-upload";

const service = new EvidenciaFiscalizacaoService();

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Envie os dados como multipart/form-data." },
      { status: 400 },
    );
  }
  const fiscalizacaoValue = formData.get("fiscalizacaoId");
  const fiscalizacaoId =
    typeof fiscalizacaoValue === "string" ? Number(fiscalizacaoValue) : NaN;
  const tipoEvidencia = formData.get("tipoEvidencia");
  const latitude = formData.get("latitude");
  const longitude = formData.get("longitude");
  const file = formData.get("arquivo");

  if (!Number.isSafeInteger(fiscalizacaoId) || fiscalizacaoId <= 0) {
    return NextResponse.json(
      { error: "ID de fiscalização inválido." },
      { status: 400 },
    );
  }
  if (
    typeof tipoEvidencia !== "string" ||
    tipoEvidencia.trim().length === 0 ||
    tipoEvidencia.trim().length > 45
  ) {
    return NextResponse.json(
      { error: "Tipo de evidência inválido." },
      { status: 400 },
    );
  }
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return NextResponse.json(
      { error: "Latitude ou longitude inválida." },
      { status: 400 },
    );
  }
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Arquivo obrigatório." },
      { status: 400 },
    );
  }

  let caminhoArquivo: string;
  try {
    caminhoArquivo = await saveEvidenceFile(fiscalizacaoId, file);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao armazenar arquivo.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await service.create({
      tipoEvidencia: tipoEvidencia.trim(),
      caminhoArquivo,
      latitude,
      longitude,
      fiscalizacaoId,
    });
    const usuarioId = Number(request.headers.get("x-auth-user-id"));
    if (Number.isSafeInteger(usuarioId) && usuarioId > 0) {
      await auditSuccess({
        acao: "UPLOAD_EVIDENCIA",
        pathname: "/api/evidencias-fiscalizacao/upload",
        usuarioId,
        ipOrigem: request.headers.get("x-auth-client-ip") || "unknown",
        registroId: result.id,
        detalhes: {
          tipoEvidencia: result.tipoEvidencia,
          tamanhoArquivo: file.size,
        },
      }).catch((error: unknown) =>
        console.error("Erro ao auditar upload de evidência:", error),
      );
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Fiscalização não encontrada.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao cadastrar evidência enviada:", error);
    return NextResponse.json(
      { error: "Erro interno ao cadastrar evidência." },
      { status: 500 },
    );
  }
}
