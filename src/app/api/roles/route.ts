export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        permissions: true,
      },
    });

    return NextResponse.json(roles);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd pobierania ról" },
      { status: 500 }
    );
  }
}
