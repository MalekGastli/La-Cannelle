import { PrismaClient, ProductCategory } from '@prisma/client';
import { serviceService } from '../src/services/serviceService';
import { menuService } from '../src/services/menuService';
import { CATALOG } from './catalog';
import { accessoryService } from '../src/services/accessoryService';

// Idempotent first-run content, executed at deploy time. Each block only runs while its table is
// empty, so anything edited in the admin area is never overwritten or duplicated.
const prisma = new PrismaClient();

const SAMPLE_NAMES = ["Mini Bruschetta", "Arancini", "Salmon Blini", "Falafel Bites", "Mini Quiche", "Caprese Skewer", "Prawn Spoon", "Vegetable Spring Roll", "Garden Salad", "Burrata & Tomato", "Seared Scallops", "Beef Carpaccio", "Hummus Platter", "Tomato Basil Soup", "Pumpkin Soup", "Beef Wellington", "Herb-Crusted Lamb", "Mushroom Risotto", "Roast Chicken Supreme", "Baked Salmon", "Vegetable Lasagne", "Roast Potatoes", "Seasonal Vegetables", "Herbed Rice", "Couscous Salad", "Chocolate Sphere", "Warm Fondant", "Panna Cotta", "Fruit Platter", "Still Water 0.75l", "Sparkling Water 0.75l", "Apple Juice", "Soft Drink Selection"];

async function main() {
  // Sample dishes created by an earlier deploy are replaced once by the real catalogue.
  const imported = await prisma.product.count({ where: { image: { startsWith: '/images/products/' } } });
  const pendingCatalog = imported === 0;
  if (pendingCatalog) {
    const removed = await prisma.product.deleteMany({ where: { name: { in: SAMPLE_NAMES } } });
    if (removed.count) console.log(`ensure-defaults: removed ${removed.count} sample dishes`);
    for (const item of CATALOG) {
      await prisma.product.create({
        data: {
          name: item.name,
          description: item.description,
          category: item.category as ProductCategory,
          price: item.price,
          cost: item.cost,
          available: item.available,
          minOrderQuantity: 1,
          allergens: [],
          ingredients: [],
          image: item.image,
        },
      });
    }
    console.log(`ensure-defaults: imported ${CATALOG.length} catalogue products`);
  }
  if ((await prisma.service.count()) === 0) console.log('ensure-defaults: services', await serviceService.restoreDefaultServices());
  if ((await prisma.accessory.count()) === 0) console.log('ensure-defaults: accessories', await accessoryService.restoreDefaultAccessories());
  if ((await prisma.menu.count()) === 0 || pendingCatalog) console.log('ensure-defaults: menus', await menuService.restoreDefaultMenus());
}

main()
  .catch((error) => {
    // Never fail a deploy because of sample content
    console.error('ensure-defaults failed', error);
  })
  .finally(() => prisma.$disconnect());
