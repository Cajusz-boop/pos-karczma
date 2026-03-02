export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


const T9_MAP: Record<string, string[]> = {
  "2": ["a", "ą", "b", "c", "ć"],
  "3": ["d", "e", "ę", "f"],
  "4": ["g", "h", "i"],
  "5": ["j", "k", "l", "ł"],
  "6": ["m", "n", "ń", "o", "ó"],
  "7": ["p", "q", "r", "s", "ś"],
  "8": ["t", "u", "v"],
  "9": ["w", "x", "y", "z", "ź", "ż"],
};

function t9ToRegex(t9Code: string): RegExp {
  let pattern = "";
  for (const digit of t9Code) {
    const chars = T9_MAP[digit];
    if (chars) {
      pattern += `[${chars.join("")}${chars.map((c) => c.toUpperCase()).join("")}]`;
    } else {
      pattern += ".";
    }
  }
  return new RegExp(pattern, "i");
}

function normalizePolish(text: string): string {
  return text
    .toLowerCase()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z");
}

/**
 * GET /api/products/search - search products by various methods
 * 
 * Query params:
 * - q: search query (name)
 * - code: numeric code (for keyboard mode)
 * - t9: T9 sequence (e.g., "5255" for "jajko")
 * - categoryId: limit to specific category
 * - limit: max results (default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const code = searchParams.get("code");
    const t9 = searchParams.get("t9");
    const categoryId = searchParams.get("categoryId");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

    const baseWhere = {
      isActive: true,
      isAvailable: true,
      isHidden: false,
      ...(categoryId && { categoryId }),
    };

    let products;

    if (code) {
      products = await prisma.product.findMany({
        where: {
          ...baseWhere,
          sortOrder: parseInt(code) || -1,
        },
        include: {
          category: { select: { id: true, name: true } },
        },
        take: limit,
      });

      if (products.length === 0) {
        products = await prisma.product.findMany({
          where: {
            ...baseWhere,
            id: { startsWith: code },
          },
          include: {
            category: { select: { id: true, name: true } },
          },
          take: limit,
        });
      }
    } else if (t9) {
      const regex = t9ToRegex(t9);
      
      const allProducts = await prisma.product.findMany({
        where: baseWhere,
        include: {
          category: { select: { id: true, name: true } },
        },
      });

      products = allProducts
        .filter((p) => regex.test(p.name))
        .slice(0, limit);
    } else if (query) {
      const normalizedQuery = normalizePolish(query);

      const allProducts = await prisma.product.findMany({
        where: baseWhere,
        include: {
          category: { select: { id: true, name: true } },
        },
      });

      products = allProducts
        .filter((p) => {
          const normalizedName = normalizePolish(p.name);
          return (
            normalizedName.includes(normalizedQuery) ||
            p.name.toLowerCase().includes(query.toLowerCase())
          );
        })
        .sort((a, b) => {
          const aStarts = normalizePolish(a.name).startsWith(normalizedQuery);
          const bStarts = normalizePolish(b.name).startsWith(normalizedQuery);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.name.localeCompare(b.name, "pl");
        })
        .slice(0, limit);
    } else {
      products = await prisma.product.findMany({
        where: baseWhere,
        include: {
          category: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
        take: limit,
      });
    }

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        nameShort: p.nameShort,
        priceGross: Number(p.priceGross),
        categoryId: p.categoryId,
        categoryName: p.category.name,
        color: p.color,
        isSet: p.isSet,
        productType: p.productType,
      })),
      count: products.length,
      searchMode: code ? "code" : t9 ? "t9" : query ? "text" : "all",
    });
  } catch (e) {
    console.error("[ProductSearch GET]", e);
    return NextResponse.json({ error: "Błąd wyszukiwania" }, { status: 500 });
  }
}
