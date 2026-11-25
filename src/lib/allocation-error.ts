import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export class AllocationError extends Error {}

export function allocationConflict(error: unknown) {
  if (error instanceof AllocationError) return NextResponse.json({ error: error.message }, { status: 409 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
    return NextResponse.json({ error: "A verba foi atualizada simultaneamente. Tente novamente." }, { status: 409 });
  }
}
