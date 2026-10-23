import { PrismaClient, ProductCategory, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const parseMySqlDateTimeUtc = (value: string) => {
  // Accepts: "YYYY-MM-DD HH:mm:ss.SSS" or "YYYY-MM-DD HH:mm:ss"
  const trimmed = value.trim();
  const match =
    trimmed.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/,
    ) ?? trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error(`Invalid datetime: ${value}`);

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const hour = Number(match[4] ?? '0');
  const minute = Number(match[5] ?? '0');
  const second = Number(match[6] ?? '0');
  const ms = Number((match[7] ?? '0').padEnd(3, '0'));

  return new Date(Date.UTC(year, month, day, hour, minute, second, ms));
};

async function main() {
  const orders = [
    {
      id: '1c626c4f-534f-4fad-886e-2f3c4df483d6',
      userId: 18,
      serviceId: null,
      clientName: 'John Doe',
      contactEmail: 'client@example.com',
      phone: '+1 (555) 123-4567',
      eventType: 'Corporate Lunch',
      eventDate: parseMySqlDateTimeUtc('2024-12-20 00:00:00.000'),
      eventTime: '12:30 PM',
      guests: 45,
      location: 'TechCorp HQ, Dusseldorf',
      total: 2478.9,
      subtotal: 2430,
      serviceFee: 48.9,
      status: 'COMPLETED' as any,
      paymentStatus: 'PAID' as any,
      specialRequests: 'Vegetarian options needed for 8 guests',
      cancellationReason: null,
      businessType: 'B2B',
      serviceType: 'office',
      postalCode: null,
      createdAt: parseMySqlDateTimeUtc('2025-12-21 16:22:27.202'),
      updatedAt: parseMySqlDateTimeUtc('2025-12-30 05:36:50.604')
    },
    {
      id: '12f5c98a-ac41-40a3-b21e-259aedc1afa5',
      userId: null,
      serviceId: null,
      clientName: 'Smith Wedding',
      contactEmail: 'emily.smith@email.com',
      phone: '+49 987 654 321',
      eventType: 'Wedding Reception',
      eventDate: parseMySqlDateTimeUtc('2024-12-22 00:00:00.000'),
      eventTime: '4:00 PM',
      guests: 120,
      location: 'Schloss Benrath, Dusseldorf',
      total: 8928.9,
      subtotal: 8880,
      serviceFee: 48.9,
      status: 'PREPARATION' as any,
      paymentStatus: 'PAID' as any,
      specialRequests: 'Gluten-free cake, vegan options',
      cancellationReason: null,
      businessType: 'B2C',
      serviceType: 'wedding',
      postalCode: null,
      createdAt: parseMySqlDateTimeUtc('2025-12-21 16:22:27.216'),
      updatedAt: parseMySqlDateTimeUtc('2025-12-21 16:22:27.216')
    },
    {
      id: 'e013b321-bd74-43fa-83b3-068ee1fa0ac8',
      userId: 18,
      serviceId: null,
      clientName: 'John Doe',
      contactEmail: 'client@example.com',
      phone: '+1 (555) 123-4567',
      eventType: 'Corporate Lunch',
      eventDate: parseMySqlDateTimeUtc('2024-12-20 00:00:00.000'),
      eventTime: '12:30 PM',
      guests: 45,
      location: 'TechCorp HQ, Düsseldorf',
      total: 3375,
      subtotal: 3326.1,
      serviceFee: 48.9,
      status: 'PENDING' as any,
      paymentStatus: 'PAID' as any,
      specialRequests: 'Vegetarian options needed for 8 guests',
      cancellationReason: null,
      businessType: 'B2B',
      serviceType: 'office',
      postalCode: null,
      createdAt: parseMySqlDateTimeUtc('2025-12-22 12:51:34.330'),
      updatedAt: parseMySqlDateTimeUtc('2025-12-30 05:36:20.889')
    },
    {
      id: '61821901-ab7d-48de-8568-f71831805645',
      userId: null,
      serviceId: null,
      clientName: 'Smith Wedding',
      contactEmail: 'emily.smith@email.com',
      phone: '+49 987 654 321',
      eventType: 'Wedding Reception',
      eventDate: parseMySqlDateTimeUtc('2024-12-22 00:00:00.000'),
      eventTime: '4:00 PM',
      guests: 120,
      location: 'Schloss Benrath, Düsseldorf',
      total: 14400,
      subtotal: 14351.1,
      serviceFee: 48.9,
      status: 'PENDING' as any,
      paymentStatus: 'PAID' as any,
      specialRequests: 'Gluten-free cake, vegan options',
      cancellationReason: null,
      businessType: 'B2C',
      serviceType: 'wedding',
      postalCode: null,
      createdAt: parseMySqlDateTimeUtc('2025-12-22 12:51:34.381'),
      updatedAt: parseMySqlDateTimeUtc('2025-12-30 05:36:10.781')
    },
    {
      id: 'ed9a4e55-a8c9-49e0-b835-5b45ee842e43',
      userId: 18,
      serviceId: null,
      clientName: 'John Doe',
      contactEmail: 'client@example.com',
      phone: '+1 (555) 123-4567',
      eventType: 'Corporate Lunch',
      eventDate: parseMySqlDateTimeUtc('2024-12-20 00:00:00.000'),
      eventTime: '12:30 PM',
      guests: 45,
      location: 'TechCorp HQ, Düsseldorf',
      total: 3375,
      subtotal: 3326.1,
      serviceFee: 48.9,
      status: 'DELIVERY' as any,
      paymentStatus: 'PAID' as any,
      specialRequests: 'Vegetarian options needed for 8 guests',
      cancellationReason: null,
      businessType: 'B2B',
      serviceType: 'office',
      postalCode: null,
      createdAt: parseMySqlDateTimeUtc('2025-12-22 12:57:47.959'),
      updatedAt: parseMySqlDateTimeUtc('2025-12-22 18:37:30.552')
    },
    {
      id: 'e88b7815-fdc2-49ba-b98d-8a98185a3dde',
      userId: null,
      serviceId: null,
      clientName: 'Smith Wedding',
      contactEmail: 'emily.smith@email.com',
      phone: '+49 987 654 321',
      eventType: 'Wedding Reception',
      eventDate: parseMySqlDateTimeUtc('2024-12-22 00:00:00.000'),
      eventTime: '4:00 PM',
      guests: 120,
      location: 'Schloss Benrath, Düsseldorf',
      total: 14400,
      subtotal: 14351.1,
      serviceFee: 48.9,
      status: 'PREPARATION' as any,
      paymentStatus: 'PAID' as any,
      specialRequests: 'Gluten-free cake, vegan options',
      cancellationReason: null,
      businessType: 'B2C',
      serviceType: 'wedding',
      postalCode: null,
      createdAt: parseMySqlDateTimeUtc('2025-12-22 12:57:47.975'),
      updatedAt: parseMySqlDateTimeUtc('2025-12-22 12:57:47.975')
    },
    {
      id: '7e48cd4e-5506-48cc-930e-85e87acf662d',
      userId: null,
      serviceId: 3,
      clientName: 'PPPPPP PPPPP',
      contactEmail: 'PPP@JJ.LL',
      phone: '5555555',
      eventType: 'Fingerfood Catering',
      eventDate: parseMySqlDateTimeUtc('2026-01-17 00:00:00.000'),
      eventTime: '00:30',
      guests: 20,
      location: '45356',
      total: 766.4,
      subtotal: 713.9,
      serviceFee: 48.9,
      status: 'CANCELLED' as any,
      paymentStatus: 'REFUNDED' as any,
      specialRequests:
        'Company: MMMMMM\nCompany Info: KKKKK\n\nAccessories:\n- Pappbecher (kompostierbar) x20 (€0.18 each)\n\nTTTTT',
      cancellationReason: null,
      businessType: 'business',
      serviceType: 'Fingerfood Catering',
      postalCode: '45356',
      createdAt: parseMySqlDateTimeUtc('2025-12-30 04:44:32.770'),
      updatedAt: parseMySqlDateTimeUtc('2025-12-30 05:35:08.476')
    }
  ] as const;

  const orderItems = [
    { id: 93, orderId: '1c626c4f-534f-4fad-886e-2f3c4df483d6', productId: 166, quantity: 45, price: 9, name: 'Heirloom Tomato Burrata Salad' },
    { id: 94, orderId: '1c626c4f-534f-4fad-886e-2f3c4df483d6', productId: 171, quantity: 45, price: 26, name: 'Pan-seared Salmon' },
    { id: 95, orderId: '1c626c4f-534f-4fad-886e-2f3c4df483d6', productId: 176, quantity: 45, price: 6, name: 'Truffle Mashed Potatoes' },
    { id: 96, orderId: '1c626c4f-534f-4fad-886e-2f3c4df483d6', productId: 181, quantity: 45, price: 8, name: 'Lemon Tart' },
    { id: 97, orderId: '1c626c4f-534f-4fad-886e-2f3c4df483d6', productId: 187, quantity: 45, price: 5, name: 'Coffee & Tea Service' },
    { id: 98, orderId: '12f5c98a-ac41-40a3-b21e-259aedc1afa5', productId: 167, quantity: 120, price: 11, name: 'Smoked Salmon Blini' },
    { id: 99, orderId: '12f5c98a-ac41-40a3-b21e-259aedc1afa5', productId: 169, quantity: 120, price: 8, name: 'Charcuterie Cup' },
    { id: 100, orderId: '12f5c98a-ac41-40a3-b21e-259aedc1afa5', productId: 172, quantity: 120, price: 30, name: 'Beef Short Rib' },
    { id: 101, orderId: '12f5c98a-ac41-40a3-b21e-259aedc1afa5', productId: 176, quantity: 120, price: 6, name: 'Truffle Mashed Potatoes' },
    { id: 102, orderId: '12f5c98a-ac41-40a3-b21e-259aedc1afa5', productId: 177, quantity: 120, price: 5, name: 'Seasonal Roasted Vegetables' },
    { id: 103, orderId: '12f5c98a-ac41-40a3-b21e-259aedc1afa5', productId: 180, quantity: 120, price: 9, name: 'Chocolate Fondant' },
    { id: 104, orderId: '12f5c98a-ac41-40a3-b21e-259aedc1afa5', productId: 187, quantity: 120, price: 5, name: 'Coffee & Tea Service' },
    { id: 105, orderId: 'e013b321-bd74-43fa-83b3-068ee1fa0ac8', productId: 192, quantity: 45, price: 24, name: 'Truffle Mushroom Risotto' },
    { id: 106, orderId: 'e013b321-bd74-43fa-83b3-068ee1fa0ac8', productId: 194, quantity: 45, price: 28, name: 'Seared Scallops' },
    { id: 107, orderId: '61821901-ab7d-48de-8568-f71831805645', productId: 193, quantity: 120, price: 38, name: 'Herb-crusted Rack of Lamb' },
    { id: 108, orderId: '61821901-ab7d-48de-8568-f71831805645', productId: 195, quantity: 120, price: 18, name: 'Heirloom Tomato Burrata Salad' },
    { id: 109, orderId: 'ed9a4e55-a8c9-49e0-b835-5b45ee842e43', productId: 219, quantity: 45, price: 24, name: 'Truffle Mushroom Risotto' },
    { id: 110, orderId: 'ed9a4e55-a8c9-49e0-b835-5b45ee842e43', productId: 221, quantity: 45, price: 28, name: 'Seared Scallops' },
    { id: 111, orderId: 'e88b7815-fdc2-49ba-b98d-8a98185a3dde', productId: 220, quantity: 120, price: 38, name: 'Herb-crusted Rack of Lamb' },
    { id: 112, orderId: 'e88b7815-fdc2-49ba-b98d-8a98185a3dde', productId: 222, quantity: 120, price: 18, name: 'Heirloom Tomato Burrata Salad' },
    { id: 113, orderId: '7e48cd4e-5506-48cc-930e-85e87acf662d', productId: 394, quantity: 21, price: 15.9, name: 'Bauernsalat' },
    { id: 114, orderId: '7e48cd4e-5506-48cc-930e-85e87acf662d', productId: 175, quantity: 20, price: 18, name: 'Grilled Vegetable Lasagna' },
    { id: 115, orderId: '7e48cd4e-5506-48cc-930e-85e87acf662d', productId: 177, quantity: 20, price: 5, name: 'Seasonal Roasted Vegetables' },
    { id: 116, orderId: '7e48cd4e-5506-48cc-930e-85e87acf662d', productId: 187, quantity: 20, price: 5, name: 'Coffee & Tea Service' },
    { id: 117, orderId: '7e48cd4e-5506-48cc-930e-85e87acf662d', productId: 186, quantity: 20, price: 4, name: 'House Lemonade' }
  ] as const;

  const productIds = Array.from(new Set(orderItems.map((i) => i.productId)));
  const products = productIds.map((id) => {
    const name = orderItems.find((i) => i.productId === id)?.name ?? `Product ${id}`;
    const lowered = name.toLowerCase();
    const category =
      lowered.includes('salad') || lowered.includes('scallops') || lowered.includes('blini') || lowered.includes('charcuterie') || lowered.includes('bauernsalat')
        ? ProductCategory.STARTER
        : lowered.includes('potatoes') || lowered.includes('vegetables')
          ? ProductCategory.SIDE
          : lowered.includes('tart') || lowered.includes('chocolate') || lowered.includes('fondant')
            ? ProductCategory.DESSERT
            : lowered.includes('coffee') || lowered.includes('tea') || lowered.includes('lemonade')
              ? ProductCategory.BEVERAGE
              : ProductCategory.MAIN;

    const price = Math.max(0, Number(orderItems.find((i) => i.productId === id)?.price ?? 0));
    const cost = Number.isFinite(price) && price > 0 ? Number((price * 0.4).toFixed(2)) : 1;
    const description = `Seeded product (for order history): ${name}`;

    return {
      id,
      name,
      description,
      category,
      price: price > 0 ? price : 1,
      cost,
      available: true,
      minOrderQuantity: 1
    };
  });

  // Ensure referenced user exists (orders reference userId=18)
  await prisma.user.upsert({
    where: { id: 18 },
    update: {},
    create: {
      id: 18,
      email: 'legacy-user-18@example.com',
      password: 'legacy',
      firstName: 'Legacy',
      lastName: 'User',
      role: UserRole.CLIENT,
      status: 'active'
    }
  });

  // Ensure referenced products exist
  for (const product of products) {
    const { id, ...data } = product as any;
    await prisma.product.upsert({
      where: { id },
      update: data,
      create: { id, ...data }
    });
  }

  // Upsert orders
  for (const order of orders) {
    const { id, ...data } = order as any;
    await prisma.order.upsert({
      where: { id },
      update: data,
      create: { id, ...data }
    });
  }

  // Upsert order items
  for (const item of orderItems) {
    const { id, ...data } = item as any;
    await prisma.orderItem.upsert({
      where: { id },
      update: data,
      create: { id, ...data }
    });
  }

  console.log(`Seeded orders: ${orders.length}`);
  console.log(`Seeded order_items: ${orderItems.length}`);
  console.log(`Ensured products: ${products.length}`);
}

main()
  .catch((e) => {
    console.error('Seed orders failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
