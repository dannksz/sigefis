import { NextResponse } from "next/server";
import { parseListQuery } from "@/lib/pagination";
import { listContacts } from "@/services/contato.service";

export async function GET(request: Request) {
  if (request.headers.get("x-auth-role") !== "ADMIN") {
    return NextResponse.json({ error: "Acesso exclusivo de administradores." }, { status: 403 });
  }
  try {
    return NextResponse.json(await listContacts(parseListQuery(request)), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar as mensagens." }, { status: 500 });
  }
}
