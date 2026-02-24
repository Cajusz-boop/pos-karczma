import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const templateSchema = z.object({
  header: z.string().max(2000).optional(),
  footer: z.string().max(2000).optional(),
  item: z.string().max(1000).optional(),
  storno: z.string().max(1000).optional(),
  addon: z.string().max(500).optional(),
  set: z.string().max(1000).optional(),
  component: z.string().max(500).optional(),
  course: z.string().max(500).optional(),
  timer: z.string().max(500).optional(),
  fire: z.string().max(500).optional(),
  separator: z.string().max(100).optional(),
});

const DEFAULT_TEMPLATES = {
  header: `$[Data,10,0]$ $[Czas,8,0]$
================================
ZAMÓWIENIE #$[NrZam,6,1]$
Stolik: $[Stolik,10,0]$  Kelner: $[Kelner,15,0]$
================================`,
  footer: `================================
$[Ilosc,3,1]$ pozycji
================================`,
  item: `$[Ilosc,3,1]$x $[Nazwa,30,0]$`,
  storno: `--- STORNO ---
$[Ilosc,3,1]$x $[Nazwa,30,0]$`,
  addon: `   + $[Nazwa,28,0]$`,
  set: `$[Ilosc,3,1]$x $[Nazwa,30,0]$ (zestaw)`,
  component: `   - $[Nazwa,28,0]$`,
  course: `
--- DANIE $[Kurs,1,0]$ ---`,
  timer: `   [za $[Minuty,2,0]$ min]`,
  fire: `   🔥 OGIEŃ! 🔥`,
  separator: `--------------------------------`,
};

/**
 * GET /api/printers/[id]/templates - get printer templates
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [ {"id":"_"} ];
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const printer = await prisma.printer.findUnique({
      where: { id },
      select: { id: true, name: true, templatesJson: true, charsPerLine: true },
    });

    if (!printer) {
      return NextResponse.json({ error: "Drukarka nie istnieje" }, { status: 404 });
    }

    const customTemplates = (printer.templatesJson as Record<string, string>) ?? {};
    const mergedTemplates = { ...DEFAULT_TEMPLATES, ...customTemplates };

    return NextResponse.json({
      printer: {
        id: printer.id,
        name: printer.name,
        charsPerLine: printer.charsPerLine,
      },
      templates: mergedTemplates,
      defaults: DEFAULT_TEMPLATES,
      variables: [
        { name: "$[Data,10,0]$", description: "Data wydruku" },
        { name: "$[Czas,8,0]$", description: "Czas wydruku" },
        { name: "$[NrZam,6,1]$", description: "Numer zamówienia" },
        { name: "$[Stolik,10,0]$", description: "Numer stolika" },
        { name: "$[Kelner,15,0]$", description: "Nazwa kelnera" },
        { name: "$[Nazwa,30,0]$", description: "Nazwa produktu" },
        { name: "$[Ilosc,3,1]$", description: "Ilość" },
        { name: "$[Cena,8,2]$", description: "Cena" },
        { name: "$[Kurs,1,0]$", description: "Numer kursu/dania" },
        { name: "$[Minuty,2,0]$", description: "Minuty opóźnienia" },
        { name: "$[Notatka,40,0]$", description: "Notatka do pozycji" },
        { name: "$[Modyfikatory,40,0]$", description: "Lista modyfikatorów" },
      ],
    });
  } catch (e) {
    console.error("[PrinterTemplates GET]", e);
    return NextResponse.json({ error: "Błąd pobierania szablonów" }, { status: 500 });
  }
}

/**
 * PUT /api/printers/[id]/templates - update printer templates
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = templateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const printer = await prisma.printer.findUnique({
      where: { id },
      select: { templatesJson: true },
    });

    if (!printer) {
      return NextResponse.json({ error: "Drukarka nie istnieje" }, { status: 404 });
    }

    const existingTemplates = (printer.templatesJson as Record<string, string>) ?? {};
    const newTemplates = { ...existingTemplates };

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        newTemplates[key] = value;
      }
    }

    await prisma.printer.update({
      where: { id },
      data: { templatesJson: newTemplates },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "PRINTER_TEMPLATES_UPDATED", "Printer", id, existingTemplates, newTemplates);

    return NextResponse.json({
      templates: newTemplates,
      message: "Szablony zaktualizowane",
    });
  } catch (e) {
    console.error("[PrinterTemplates PUT]", e);
    return NextResponse.json({ error: "Błąd aktualizacji szablonów" }, { status: 500 });
  }
}

/**
 * POST /api/printers/[id]/templates/reset - reset to defaults
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.printer.update({
      where: { id },
      data: { templatesJson: Prisma.JsonNull },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "PRINTER_TEMPLATES_RESET", "Printer", id);

    return NextResponse.json({
      templates: DEFAULT_TEMPLATES,
      message: "Szablony przywrócone do domyślnych",
    });
  } catch (e) {
    console.error("[PrinterTemplates POST reset]", e);
    return NextResponse.json({ error: "Błąd resetowania szablonów" }, { status: 500 });
  }
}
