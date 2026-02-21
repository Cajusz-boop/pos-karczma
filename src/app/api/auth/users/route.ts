import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        roleId: true,
        isOwner: true,
        role: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        roleId: u.roleId,
        roleName: u.role.name,
        isOwner: u.isOwner,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd pobierania użytkowników" },
      { status: 500 }
    );
  }
}
