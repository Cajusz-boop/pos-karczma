import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1, "Wymagany tytuł").max(100),
  content: z.string().min(1, "Wymagana treść"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  pinned: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
});

/**
 * GET /api/announcements — list announcements (active, not expired)
 */
export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: [{ pinned: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    return NextResponse.json({
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        priority: a.priority,
        pinned: a.pinned,
        author: a.author,
        expiresAt: a.expiresAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[Announcements GET]", e);
    return NextResponse.json({ error: "Błąd pobierania ogłoszeń" }, { status: 500 });
  }
}

/**
 * POST /api/announcements — create a new announcement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Wymagane zalogowanie" }, { status: 401 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        authorId: userId,
        title: parsed.data.title,
        content: parsed.data.content,
        priority: parsed.data.priority ?? "NORMAL",
        pinned: parsed.data.pinned ?? false,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (e) {
    console.error("[Announcements POST]", e);
    return NextResponse.json({ error: "Błąd tworzenia ogłoszenia" }, { status: 500 });
  }
}

/**
 * DELETE /api/announcements — delete an announcement
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Wymagane id" }, { status: 400 });

    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Announcements DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania" }, { status: 500 });
  }
}
