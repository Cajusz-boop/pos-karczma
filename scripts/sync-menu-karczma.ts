import { prisma } from '../src/lib/prisma';

// Menu z Karczmy Łabędź - aktualne menu 2026
const MENU = {
  categories: [
    { name: 'Przystawki', icon: '🥗', sortOrder: 1 },
    { name: 'Zupy', icon: '🍲', sortOrder: 2 },
    { name: 'Dania główne', icon: '🍽️', sortOrder: 3 },
    { name: 'Wege & Gluten Free', icon: '🥬', sortOrder: 4 },
    { name: 'Dla dzieci', icon: '👶', sortOrder: 5 },
    { name: 'Desery', icon: '🍰', sortOrder: 6 },
    { name: 'Dodatki', icon: '🥔', sortOrder: 7 },
    { name: 'Drink Bar 0%', icon: '🍹', sortOrder: 8 },
  ],
  products: [
    // PRZYSTAWKI
    { name: 'Sałatka fit', price: 39, category: 'Przystawki', desc: 'z delikatnie grillowanym kurczakiem' },
    { name: 'Złocista mozzarella na rukoli', price: 29, category: 'Przystawki', desc: 'panierowana mozzarella z sosem malinowo-chrzanowym' },
    { name: 'Chrupiące placki ziemniaczane', price: 22, category: 'Przystawki' },
    { name: 'Kopytka w dwóch odsłonach', price: 16, category: 'Przystawki', desc: 'z okrasą lub słodkie z masłem i cukrem' },

    // ZUPY
    { name: 'Rosół z makaronem', price: 21, category: 'Zupy' },
    { name: 'Pomidorowa z makaronem', price: 22, category: 'Zupy' },
    { name: 'Tradycyjny żur na zakwasie', price: 25, category: 'Zupy', desc: 'z jajkiem i białą kiełbasą' },
    { name: 'Zupa grzybowa', price: 28, category: 'Zupy', desc: 'z grzankami' },
    { name: 'Zupa klopsowa', price: 26, category: 'Zupy', desc: 'z purée ziemniaczanym' },

    // DANIA GŁÓWNE
    { name: 'Schabowy chłopski', price: 43, category: 'Dania główne', desc: 'podany z frytkami i surówką' },
    { name: 'Wątróbka w klasycznym duecie', price: 42, category: 'Dania główne', desc: 'z purée i surówką z kiszonej kapusty' },
    { name: 'Gołąbki z kaszą w sosie grzybowym', price: 45, category: 'Dania główne', desc: 'z aksamitnym purée' },
    { name: 'Soczyste polędwiczki', price: 56, category: 'Dania główne', desc: 'w sosie z zielonego pieprzu, na purée' },
    { name: 'Golonka', price: 63, category: 'Dania główne', desc: 'nadziewana kapustą kiszoną z opiekanymi ziemniakami' },
    { name: 'Rumiane żeberka', price: 65, category: 'Dania główne', desc: 'z opiekanymi ziemniakami i surówkami' },
    { name: 'Buła swojak', price: 46, category: 'Dania główne', desc: 'burger z mięsem wołowo-wieprzowym, frytki, sos czosnkowy' },
    { name: 'Placek ziemniaczany z gulaszem', price: 59, category: 'Dania główne', desc: 'z gulaszem wieprzowym i białą kapustą' },
    { name: 'Udko kacze', price: 58, category: 'Dania główne', desc: 'z kopytkami i buraczkami' },
    { name: 'Ręcznie klejone pierogi', price: 38, category: 'Dania główne', desc: 'z mięsem / kapustą i grzybami / ruskie / ze szpinakiem' },
    { name: 'Kieszonka pełna smaku', price: 51, category: 'Dania główne', desc: 'pierś drobiowa nadziewana pieczarkami i mozzarellą' },
    { name: 'Łosoś na warzywach', price: 59, category: 'Dania główne', desc: 'na warzywach z kaszą' },
    { name: 'Sandacz', price: 59, category: 'Dania główne', desc: 'w chrupiącej panierce z frytkami i kiszoną kapustą' },
    { name: 'Babcine kluski z okrasą', price: 36, category: 'Dania główne', desc: 'kluski ziemniaczane z mięsem, cebulą i słoniną' },
    { name: 'Uczta dla czworga', price: 170, category: 'Dania główne', desc: 'deska: fileciki, pierogi, żeberka, placki, frytki, ziemniaki, surówki' },

    // WEGE & GLUTEN FREE
    { name: 'Pasta na grzance', price: 31, category: 'Wege & Gluten Free', desc: 'z chrupiącą grzanką i piklami' },
    { name: 'Smalec z fasoli', price: 31, category: 'Wege & Gluten Free', desc: 'z chrupiącymi grzankami' },
    { name: 'Krem z pomidorów i papryki', price: 25, category: 'Wege & Gluten Free', desc: 'z chrupiącymi grzankami' },
    { name: 'Boczniakowy gulasz z warzywami', price: 45, category: 'Wege & Gluten Free', desc: 'serwowany z grzankami' },
    { name: 'Naleśniki bezglutenowe', price: 29, category: 'Wege & Gluten Free', desc: 'z dżemem truskawkowym' },

    // DLA DZIECI
    { name: 'Zupa pomidorowa (dzieci)', price: 18, category: 'Dla dzieci', desc: 'z makaronem' },
    { name: 'Chrupiący filecik', price: 28, category: 'Dla dzieci', desc: 'panierowane mięso drobiowe z frytkami i marchewką' },
    { name: 'Mini Swojak', price: 28, category: 'Dla dzieci', desc: 'mięso wołowo-wieprzowe, ser cheddar, frytki' },
    { name: 'Malowany naleśnik', price: 17, category: 'Dla dzieci', desc: 'z pędzelkiem i sosami waniliowym i truskawkowym' },

    // DESERY
    { name: 'Lody z maszyny', price: 14, category: 'Desery', desc: 'czekoladowe, waniliowe, jogurt, słony karmel, sorbet mango/truskawka' },
    { name: 'Sernik z nutą pistacji', price: 23, category: 'Desery', desc: 'z gałką lodów bakaliowych' },
    { name: 'Torcik bezowy', price: 23, category: 'Desery', desc: 'kajmak, powidła owocowe, mascarpone' },

    // DODATKI
    { name: 'Purée', price: 12, category: 'Dodatki' },
    { name: 'Frytki', price: 12, category: 'Dodatki' },
    { name: 'Ziemniaki opiekane', price: 8, category: 'Dodatki', desc: '2 sztuki' },
    { name: 'Sałata w śmietanie', price: 10, category: 'Dodatki' },
    { name: 'Surówka mix', price: 12, category: 'Dodatki', desc: 'biała kapusta, kiszona kapusta' },

    // DRINK BAR 0%
    { name: 'Blue Dream', price: 19, category: 'Drink Bar 0%', desc: 'Blue Curacao, limonka, Sprite, syrop mojito, mięta' },
    { name: 'Iced Coffee', price: 21, category: 'Drink Bar 0%', desc: 'Blue Curacao, wanilia, mleko, espresso' },
    { name: 'Hugo Spritz', price: 25, category: 'Drink Bar 0%', desc: 'mięta, limonka, J. Gasco Fior di Sambuco' },
    { name: 'Pinacolada', price: 20, category: 'Drink Bar 0%', desc: 'mus kokosowy, śmietanka, mleko, wanilia, sok ananasowy' },
  ]
};

async function syncMenu() {
  console.log('🔄 Synchronizacja menu Karczmy Łabędź...\n');

  // 1. Pobierz domyślną stawkę VAT (8% dla gastronomii)
  let taxRate = await prisma.taxRate.findFirst({
    where: { ratePercent: 8 }
  });
  
  if (!taxRate) {
    taxRate = await prisma.taxRate.findFirst();
  }
  
  if (!taxRate) {
    console.error('❌ Brak stawki VAT w bazie!');
    return;
  }
  console.log(`✓ Stawka VAT: ${taxRate.ratePercent}% (${taxRate.fiscalSymbol})`);

  // 2. Dezaktywuj wszystkie istniejące produkty
  const deactivated = await prisma.product.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  });
  console.log(`✓ Dezaktywowano ${deactivated.count} starych produktów`);

  // 3. Utwórz/aktualizuj kategorie
  const categoryMap: Record<string, string> = {};
  
  for (const cat of MENU.categories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, parentId: null }
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { icon: cat.icon, sortOrder: cat.sortOrder, isActive: true }
      });
      categoryMap[cat.name] = existing.id;
      console.log(`✓ Zaktualizowano kategorię: ${cat.icon} ${cat.name}`);
    } else {
      const created = await prisma.category.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          sortOrder: cat.sortOrder,
          isActive: true
        }
      });
      categoryMap[cat.name] = created.id;
      console.log(`✓ Utworzono kategorię: ${cat.icon} ${cat.name}`);
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
  console.log('\n📦 Synchronizacja produktów...');
  let created = 0;
  let updated = 0;

  for (let i = 0; i < MENU.products.length; i++) {
    const prod = MENU.products[i];
    const categoryId = categoryMap[prod.category];
    
    if (!categoryId) {
      console.error(`❌ Brak kategorii: ${prod.category}`);
      continue;
    }

    const existing = await prisma.product.findFirst({
      where: { 
        name: prod.name,
        categoryId: categoryId
      }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
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

  console.log(`\n✅ Synchronizacja zakończona!`);
  console.log(`   📝 Utworzono: ${created} produktów`);
  console.log(`   🔄 Zaktualizowano: ${updated} produktów`);
  console.log(`   📂 Kategorii: ${MENU.categories.length}`);
  console.log(`   🍽️ Produktów aktywnych: ${MENU.products.length}`);

  await prisma.$disconnect();
}

syncMenu().catch(console.error);
