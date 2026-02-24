export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

type RouteContext = { params: Promise<{ id: string }> };
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}



export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Brak identyfikatora produktu" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json(
        { error: "Produkt nie istnieje" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get("image");
    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { error: "Brak pola 'image' w formularzu multipart/form-data" },
        { status: 400 }
      );
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "Plik obrazu jest pusty" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, `${id}.jpg`);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/products/${id}.jpg`;
    await prisma.product.update({
      where: { id },
      data: { imageUrl },
    });

    return NextResponse.json({ imageUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd zapisywania obrazu produktu" },
      { status: 500 }
    );
  }
}
