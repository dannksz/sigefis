import { NextResponse } from "next/server";
import { createContact, parseContato } from "@/services/contato.service";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const data = parseContato(body);
  if (!data) {
    return NextResponse.json({ error: "Confira o nome, e-mail, telefone com DDD, motivo e mensagem." }, { status: 400 });
  }
  try {
    await createContact(data);
    return NextResponse.json({ message: "Mensagem enviada com sucesso." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível enviar sua mensagem. Tente novamente." }, { status: 500 });
  }
}
