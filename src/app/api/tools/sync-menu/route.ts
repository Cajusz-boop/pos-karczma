export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Menu z Karczmy Łabędź - aktualne menu 2026
const MENU = {
  categories: [
    { name: 'Przystawki', icon: '🥗', sortOrder: 1, imageUrl: '/menu/zupy-przystawki.png' },
    { name: 'Zupy', icon: '🍲', sortOrder: 2, imageUrl: '/menu/zupy-przystawki.png' },
    { name: 'Dania główne', icon: '🍽️', sortOrder: 3, imageUrl: '/menu/dania-glowne.png' },
    { name: 'Wege & Gluten Free', icon: '🥬', sortOrder: 4, imageUrl: '/menu/wege.png' },
    { name: 'Dla dzieci', icon: '👶', sortOrder: 5, imageUrl: '/menu/desery-dzieci.png' },
    { name: 'Desery', icon: '🍰', sortOrder: 6, imageUrl: '/menu/desery-dzieci.png' },
    { name: 'Dodatki', icon: '🥔', sortOrder: 7, imageUrl: '/menu/desery-dzieci.png' },
    { name: 'Drink Bar 0%', icon: '🍹', sortOrder: 8, imageUrl: '/menu/drink-bar.png' },
    { name: 'Karta sezonowa', icon: '🍂', sortOrder: 9, imageUrl: '/menu/sezonowe.png' },
  ],
  products: [
    // PRZYSTAWKI
    { name: 'Sałatka fit', price: 39, category: 'Przystawki' },
    { name: 'Złocista mozzarella na rukoli', price: 29, category: 'Przystawki' },
    { name: 'Chrupiące placki ziemniaczane', price: 22, category: 'Przystawki' },
    { name: 'Kopytka w dwóch odsłonach', price: 16, category: 'Przystawki' },

    // ZUPY
    { name: 'Rosół z makaronem', price: 21, category: 'Zupy' },
    { name: 'Pomidorowa z makaronem', price: 22, category: 'Zupy' },
    { name: 'Tradycyjny żur na zakwasie', price: 25, category: 'Zupy' },
    { name: 'Zupa grzybowa', price: 28, category: 'Zupy' },
    { name: 'Zupa klopsowa', price: 26, category: 'Zupy' },

    // DANIA GŁÓWNE
    { name: 'Schabowy chłopski', price: 43, category: 'Dania główne' },
    { name: 'Wątróbka w klasycznym duecie', price: 42, category: 'Dania główne' },
    { name: 'Gołąbki z kaszą w sosie grzybowym', price: 45, category: 'Dania główne' },
    { name: 'Soczyste polędwiczki', price: 56, category: 'Dania główne' },
    { name: 'Golonka', price: 63, category: 'Dania główne' },
    { name: 'Rumiane żeberka', price: 65, category: 'Dania główne' },
    { name: 'Buła swojak', price: 46, category: 'Dania główne' },
    { name: 'Placek ziemniaczany z gulaszem', price: 59, category: 'Dania główne' },
    { name: 'Udko kacze', price: 58, category: 'Dania główne' },
    { name: 'Ręcznie klejone pierogi', price: 38, category: 'Dania główne' },
    { name: 'Kieszonka pełna smaku', price: 51, category: 'Dania główne' },
    { name: 'Łosoś na warzywach', price: 59, category: 'Dania główne' },
    { name: 'Sandacz', price: 59, category: 'Dania główne' },
    { name: 'Babcine kluski z okrasą', price: 36, category: 'Dania główne' },
    { name: 'Uczta dla czworga', price: 170, category: 'Dania główne' },

    // WEGE & GLUTEN FREE
    { name: 'Pasta na grzance', price: 31, category: 'Wege & Gluten Free' },
    { name: 'Smalec z fasoli', price: 31, category: 'Wege & Gluten Free' },
    { name: 'Krem z pomidorów i papryki', price: 25, category: 'Wege & Gluten Free' },
    { name: 'Boczniakowy gulasz z warzywami', price: 45, category: 'Wege & Gluten Free' },
    { name: 'Naleśniki bezglutenowe', price: 29, category: 'Wege & Gluten Free' },

    // DLA DZIECI
    { name: 'Zupa pomidorowa (dzieci)', price: 18, category: 'Dla dzieci' },
    { name: 'Chrupiący filecik', price: 28, category: 'Dla dzieci' },
    { name: 'Mini Swojak', price: 28, category: 'Dla dzieci' },
    { name: 'Malowany naleśnik', price: 17, category: 'Dla dzieci' },

    // DESERY
    { name: 'Lody z maszyny', price: 14, category: 'Desery' },
    { name: 'Sernik z nutą pistacji', price: 23, category: 'Desery' },
    { name: 'Torcik bezowy', price: 23, category: 'Desery' },

    // DODATKI
    { name: 'Purée', price: 12, category: 'Dodatki' },
    { name: 'Frytki', price: 12, category: 'Dodatki' },
    { name: 'Ziemniaki opiekane', price: 8, category: 'Dodatki' },
    { name: 'Sałata w śmietanie', price: 10, category: 'Dodatki' },
    { name: 'Surówka mix', price: 12, category: 'Dodatki' },

    // DRINK BAR 0%
    { name: 'Blue Dream', price: 19, category: 'Drink Bar 0%' },
    { name: 'Iced Coffee', price: 21, category: 'Drink Bar 0%' },
    { name: 'Hugo Spritz', price: 25, category: 'Drink Bar 0%' },
    { name: 'Pinacolada', price: 20, category: 'Drink Bar 0%' },
  ]
};

export async function POST() {
  try {
    const log: string[] = [];
    log.push('🔄 Synchronizacja menu Karczmy Łabędź...');

    // 1. Pobierz domyślną stawkę VAT (8% dla gastronomii)
    let taxRate = await prisma.taxRate.findFirst({
      where: { ratePercent: 8 }
    });
    
    if (!taxRate) {
      taxRate = await prisma.taxRate.findFirst();
    }
    
    if (!taxRate) {
      return NextResponse.json({ error: 'Brak stawki VAT w bazie!' }, { status: 500 });
    }
    log.push(`✓ Stawka VAT: ${taxRate.ratePercent}%`);

    // 2. Dezaktywuj wszystkie istniejące produkty
    const deactivated = await prisma.product.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });
    log.push(`✓ Dezaktywowano ${deactivated.count} starych produktów`);

    // 3. Utwórz/aktualizuj kategorie
    const categoryMap: Record<string, string> = {};
    
    for (const cat of MENU.categories) {
      const existing = await prisma.category.findFirst({
        where: { name: cat.name, parentId: null }
      });

      if (existing) {
        await prisma.category.update({
          where: { id: existing.id },
          data: { 
            icon: cat.icon, 
            sortOrder: cat.sortOrder, 
            imageUrl: cat.imageUrl,
            isActive: true 
          }
        });
        categoryMap[cat.name] = existing.id;
        log.push(`✓ Zaktualizowano: ${cat.icon} ${cat.name}`);
      } else {
        const created = await prisma.category.create({
          data: {
            name: cat.name,
            icon: cat.icon,
            sortOrder: cat.sortOrder,
            imageUrl: cat.imageUrl,
            isActive: true
          }
        });
        categoryMap[cat.name] = created.id;
        log.push(`✓ Utworzono: ${cat.icon} ${cat.name}`);
      }
    }

    // 4. Dezaktywuj inne kategorie
    await prisma.category.updateMany({
      where: {
        id: { notIn: Object.values(categoryMap) },
        parentId: null
      },
      data: { isActive: false }
    });

    // 5. Utwórz/aktualizuj produkty
    let created = 0;
    let updated = 0;

    for (let i = 0; i < MENU.products.length; i++) {
      const prod = MENU.products[i];
      const categoryId = categoryMap[prod.category];
      
      if (!categoryId) {
        log.push(`❌ Brak kategorii: ${prod.category}`);
        continue;
      }

      const existing = await prisma.product.findFirst({
        where: { name: prod.name }
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            categoryId: categoryId,
            priceGross: prod.price,
            isActive: true,
            isAvailable: true,
            sortOrder: i + 1
          }
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            name: prod.name,
            categoryId: categoryId,
            priceGross: prod.price,
            taxRateId: taxRate.id,
            isActive: true,
            isAvailable: true,
            sortOrder: i + 1
          }
        });
        created++;
      }
    }

    log.push('');
    log.push('✅ Synchronizacja zakończona!');
    log.push(`📝 Utworzono: ${created} produktów`);
    log.push(`🔄 Zaktualizowano: ${updated} produktów`);
    log.push(`📂 Kategorii: ${MENU.categories.length}`);
    log.push(`🍽️ Produktów aktywnych: ${MENU.products.length}`);

    return NextResponse.json({ 
      success: true, 
      log,
      stats: { created, updated, categories: MENU.categories.length, products: MENU.products.length }
    });
  } catch (error) {
    console.error('[sync-menu]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
