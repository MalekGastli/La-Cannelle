import { PrismaClient, ProductCategory } from '@prisma/client';
import { serviceService } from '../src/services/serviceService';
import { menuService } from '../src/services/menuService';
import { accessoryService } from '../src/services/accessoryService';

// Idempotent first-run content, executed at deploy time. Each block only runs while its table is
// empty, so anything edited in the admin area is never overwritten or duplicated.
const prisma = new PrismaClient();

type Dish = [name: string, description: string, price: number, image: string, allergens: string[]];

const IMG = {
  fingerfood: ['/images/truffle-arancini.jpg', '/images/buffet-fingerfood.jpg', '/images/mediterranean-buffet.jpg'],
  starter: ['/images/salad.jpg', '/images/scallops.jpg'],
  main: ['/images/beef-wellington.jpg', '/images/lamb.jpg', '/images/risotto.jpg'],
  side: ['/images/mediterranean-buffet.jpg', '/images/salad.jpg'],
  dessert: ['/images/chocolate-sphere.jpg', '/images/fondant.jpg'],
  drink: ['/images/accessories/table-setting.jpg'],
};

const pick = (list: string[], i: number) => list[i % list.length];

const CATALOG: Record<ProductCategory, Array<[string, string, number, string[]]>> = {
  FINGERFOOD: [
    ['Mini Bruschetta', 'Tomato, basil and aged balsamic on toasted ciabatta.', 1.6, ['Gluten']],
    ['Arancini', 'Crispy risotto balls with mozzarella and herbs.', 1.9, ['Gluten', 'Milk']],
    ['Salmon Blini', 'Smoked salmon, dill cream and lemon zest on a mini blini.', 2.4, ['Fish', 'Gluten', 'Milk']],
    ['Falafel Bites', 'Herbed chickpea bites with sesame yoghurt dip.', 1.5, ['Sesame', 'Milk']],
    ['Mini Quiche', 'Spinach and feta in buttery shortcrust.', 1.7, ['Gluten', 'Egg', 'Milk']],
    ['Caprese Skewer', 'Cherry tomato, mozzarella and basil with pesto.', 1.4, ['Milk', 'Nuts']],
    ['Prawn Spoon', 'Marinated prawn with mango and chilli on a ceramic spoon.', 2.6, ['Crustaceans']],
    ['Vegetable Spring Roll', 'Crisp rolls with sweet chilli dip.', 1.4, ['Gluten', 'Soy']],
  ],
  STARTER: [
    ['Garden Salad', 'Seasonal leaves, cucumber, tomato and house vinaigrette.', 4.5, []],
    ['Burrata & Tomato', 'Creamy burrata with heirloom tomatoes and basil oil.', 6.9, ['Milk']],
    ['Seared Scallops', 'Pan-seared scallops with cauliflower purée.', 9.5, ['Molluscs', 'Milk']],
    ['Beef Carpaccio', 'Thinly sliced beef, rocket, parmesan and capers.', 8.2, ['Milk']],
    ['Hummus Platter', 'Classic hummus with warm flatbread and crudités.', 4.2, ['Gluten', 'Sesame']],
  ],
  SOUP: [
    ['Tomato Basil Soup', 'Velvety roasted tomato soup with basil.', 3.9, ['Milk']],
    ['Pumpkin Soup', 'Pumpkin, ginger and coconut cream.', 4.1, []],
  ],
  MAIN: [
    ['Beef Wellington', 'Tender beef fillet in puff pastry with mushroom duxelles.', 18.9, ['Gluten', 'Egg', 'Milk']],
    ['Herb-Crusted Lamb', 'Roast lamb with rosemary jus and seasonal vegetables.', 17.5, ['Milk']],
    ['Mushroom Risotto', 'Creamy risotto with wild mushrooms and parmesan.', 12.9, ['Milk']],
    ['Roast Chicken Supreme', 'Free-range chicken with thyme gravy.', 13.5, ['Milk']],
    ['Baked Salmon', 'Lemon-dill salmon fillet with white wine sauce.', 15.9, ['Fish', 'Milk']],
    ['Vegetable Lasagne', 'Layers of seasonal vegetables, béchamel and tomato.', 11.5, ['Gluten', 'Milk', 'Egg']],
  ],
  SIDE: [
    ['Roast Potatoes', 'Rosemary and sea salt roasted potatoes.', 3.2, []],
    ['Seasonal Vegetables', 'Glazed seasonal vegetables.', 3.5, []],
    ['Herbed Rice', 'Fluffy rice with fresh herbs.', 2.9, []],
    ['Couscous Salad', 'Couscous with lemon, mint and roasted peppers.', 3.4, ['Gluten']],
  ],
  DESSERT: [
    ['Chocolate Sphere', 'Dark chocolate sphere with raspberry coulis.', 5.9, ['Milk', 'Egg', 'Nuts']],
    ['Warm Fondant', 'Molten chocolate fondant with vanilla cream.', 5.5, ['Gluten', 'Egg', 'Milk']],
    ['Panna Cotta', 'Vanilla panna cotta with berry compote.', 4.6, ['Milk']],
    ['Fruit Platter', 'Fresh seasonal fruit.', 4.2, []],
  ],
  BEVERAGE: [
    ['Still Water 0.75l', 'Natural spring water.', 2.5, []],
    ['Sparkling Water 0.75l', 'Sparkling mineral water.', 2.5, []],
    ['Apple Juice', 'Cloudy pressed apple juice.', 2.9, []],
    ['Soft Drink Selection', 'Cola, lemonade and orange soda.', 2.6, []],
  ],
};

const IMAGE_KEY: Record<ProductCategory, keyof typeof IMG> = {
  FINGERFOOD: 'fingerfood', STARTER: 'starter', SOUP: 'starter', MAIN: 'main', SIDE: 'side', DESSERT: 'dessert', BEVERAGE: 'drink',
} as Record<ProductCategory, keyof typeof IMG>;

async function main() {
  if ((await prisma.product.count()) === 0) {
    let created = 0;
    for (const category of Object.keys(CATALOG) as ProductCategory[]) {
      const list = CATALOG[category];
      for (let i = 0; i < list.length; i += 1) {
        const [name, description, price, allergens] = list[i];
        await prisma.product.create({
          data: {
            name,
            description,
            category,
            price,
            cost: Math.round(price * 0.4 * 100) / 100,
            available: true,
            minOrderQuantity: 1,
            allergens,
            ingredients: [],
            image: pick(IMG[IMAGE_KEY[category]], i),
          },
        });
        created += 1;
      }
    }
    console.log(`ensure-defaults: created ${created} sample dishes`);
  }
  if ((await prisma.service.count()) === 0) console.log('ensure-defaults: services', await serviceService.restoreDefaultServices());
  if ((await prisma.accessory.count()) === 0) console.log('ensure-defaults: accessories', await accessoryService.restoreDefaultAccessories());
  if ((await prisma.menu.count()) === 0) console.log('ensure-defaults: menus', await menuService.restoreDefaultMenus());
}

main()
  .catch((error) => {
    // Never fail a deploy because of sample content
    console.error('ensure-defaults failed', error);
  })
  .finally(() => prisma.$disconnect());
