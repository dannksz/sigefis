import { NextResponse } from "next/server";
import { auditSuccess } from "@/lib/audit-request";
import { getProfile, ProfileError, updateProfile } from "@/services/profile.service";

const headers = { "Cache-Control": "private, no-store" };

async function handle(request: Request, update: boolean) {
  const id = Number(request.headers.get("x-auth-user-id"));
  if (!Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json({ error: "Autenticação obrigatória." }, { status: 401, headers });
  }
  try {
    const profile = update
      ? await updateProfile(id, await request.json().catch(() => null))
      : await getProfile(id);
    if (update) {
      await auditSuccess({
        acao: "ATUALIZAR_PERFIL", pathname: new URL(request.url).pathname, registroId: id, usuarioId: id,
        ipOrigem: request.headers.get("x-auth-client-ip") || "unknown",
      }).catch((error) => console.error("Erro ao auditar alteração do perfil:", error));
    }
    return NextResponse.json(profile, { headers });
  } catch (error) {
    if (error instanceof ProfileError) return NextResponse.json({ error: error.message }, { status: error.status, headers });
    console.error("Erro ao acessar o perfil:", error);
    return NextResponse.json({ error: "Não foi possível acessar os dados da conta." }, { status: 500, headers });
  }
}

export function GET(request: Request) { return handle(request, false); }
export function PUT(request: Request) { return handle(request, true); }
