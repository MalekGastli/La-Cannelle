import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@catering.com' },
    update: {},
    create: {
      email: 'admin@catering.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN
    }
  });

  // Sample client
  const clientPassword = await bcrypt.hash('client123', 10);
  await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      password: clientPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1 (555) 123-4567',
      company: 'Acme Corporation',
      position: 'Event Manager',
      role: UserRole.CLIENT,
      preferences: ['Italian', 'Vegetarian'] as any,
      allergies: ['Shellfish'] as any
    }
  });

  // System status
  await prisma.systemStatus.upsert({
    where: { id: 1 },
    update: {},
    create: {
      orderingPaused: false,
      capacityLimit: 50,
      currentReservations: 2,
      dailyLimit: 100,
      perHourLimit: 25,
      weekendMultiplier: 1.5,
      enableAutoPause: true
    }
  });

  // Accessories (used in order page step 10)
  const accessories = [
    {
      id: 14,
      nameEn: 'Besteck (Messer, Gabel, Löffel)',
      nameDe: 'Besteck (Messer, Gabel, Löffel)',
      descriptionEn:
        'Standard Besteck-Set, bestehend aus Messer, Gabel und / oder Löffel - basierend auf Bestellung. Vermietung, inkl. Reinigungskosten',
      descriptionDe:
        'Standard Besteck-Set, bestehend aus Messer, Gabel und / oder Löffel - basierend auf Bestellung. Vermietung, inkl. Reinigungskosten',
      detailsEn: null,
      detailsDe: null,
      unitEn: null,
      unitDe: null,
      price: 2,
      quantityMode: 'GUEST_COUNT',
      fixedQuantity: null,
      image: 'https://www.schoenerdaheim.de/media/46/4a/b1/1709296112/catering-08-hotel-amb-01.jpg?1712150457',
      isActive: true
    },
    {
      id: 4,
      nameEn: 'Weingläser',
      nameDe: 'Weingläser',
      descriptionEn: 'Klassische, kristallklare Weingläser',
      descriptionDe: 'Klassische, kristallklare Weingläser',
      detailsEn: 'Fassungsvermögen 350ml',
      detailsDe: 'Fassungsvermögen 350ml',
      unitEn: null,
      unitDe: null,
      price: 2.25,
      quantityMode: 'GUEST_COUNT',
      fixedQuantity: null,
      image:
        'https://www.gastronomie-kaufhaus.de/out/pictures/master/product/1/zieher-vision-weinglas-balanced-gastronomie-kaufhaus-1-2535.jpg',
      isActive: true
    },
    {
      id: 5,
      nameEn: 'Buffet-Servierplatten',
      nameDe: 'Buffet-Servierplatten',
      descriptionEn: 'Große ovale Servierplatten für Buffet-Aufbau',
      descriptionDe: 'Große ovale Servierplatten für Buffet-Aufbau',
      detailsEn: 'Keramik, hitzebeständig',
      detailsDe: 'Keramik, hitzebeständig',
      unitEn: null,
      unitDe: null,
      price: 8.5,
      quantityMode: 'CLIENT',
      fixedQuantity: null,
      image: 'https://media.xxxlutz.com/i/xxxlutz/NCYF89xExQUHUFb5RKpHL2EA/?fmt=auto&%24hq%24=&w=1200',
      isActive: true
    },
    {
      id: 6,
      nameEn: 'Tischdecken',
      nameDe: 'Tischdecken',
      descriptionEn: 'Elegante Tischwäsche für formelle Events',
      descriptionDe: 'Elegante Tischwäsche für formelle Events',
      detailsEn: 'Verschiedene Größen verfügbar',
      detailsDe: 'Verschiedene Größen verfügbar',
      unitEn: null,
      unitDe: null,
      price: 12,
      quantityMode: 'CLIENT',
      fixedQuantity: null,
      image: 'https://de.euroelectronics.eu/cdn/shop/products/77746.jpg?v=1660303869&width=1800',
      isActive: true
    },
    {
      id: 7,
      nameEn: 'Kaffeetassen & Untertassen',
      nameDe: 'Kaffeetassen & Untertassen',
      descriptionEn: 'Klassische Tassen und Untertassen für den Kaffeeservice',
      descriptionDe: 'Klassische Tassen und Untertassen für den Kaffeeservice',
      detailsEn: 'Porzellan-Set (Tasse + Untertasse)',
      detailsDe: 'Porzellan-Set (Tasse + Untertasse)',
      unitEn: null,
      unitDe: null,
      price: 2.1,
      quantityMode: 'GUEST_COUNT',
      fixedQuantity: null,
      image: 'https://m.media-amazon.com/images/I/51GC4TPowZL.jpg',
      isActive: true
    }
  ] as const;

  for (const accessory of accessories) {
    const { id, ...data } = accessory as any;
    await prisma.accessory.upsert({
      where: { id },
      update: data,
      create: { id, ...data }
    });
  }

  // Services (used for business/private occasion selection)
  const services = [
    {
      name: 'Office Catering',
      occasion: 'BUSINESS',
      description: 'Breakfast meetings, lunch delivery, and ongoing office catering.',
      image: 'https://images.unsplash.com/photo-1555992336-03a23c7b20a6?w=800&fit=crop',
      isActive: true
    },
    {
      name: 'Corporate Events',
      occasion: 'BUSINESS',
      description: 'Professional catering for meetings, conferences, and launches.',
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&fit=crop',
      isActive: true
    },
    {
      name: 'Event Catering',
      occasion: 'PRIVATE',
      description: 'Birthdays, anniversaries, and private celebrations.',
      image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&fit=crop',
      isActive: true
    },
    {
      name: 'Weddings',
      occasion: 'PRIVATE',
      description: 'Bespoke wedding menus, service, and coordination.',
      image: 'https://images.unsplash.com/photo-1523438097201-fb5f1f6b227b?w=800&fit=crop',
      isActive: true
    }
  ] as const;

  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: {
        name: service.name,
        occasion: service.occasion
      }
    });
    if (existing) {
      await prisma.service.update({ where: { id: existing.id }, data: service as any });
    } else {
      await prisma.service.create({ data: service as any });
    }
  }

  // Closed dates
  const closedDates = [
    { date: new Date('2024-12-25'), reason: 'Christmas Day', recurring: true },
    { date: new Date('2024-12-31'), reason: 'New Years Eve', recurring: true }
  ];

  for (const cd of closedDates) {
    await prisma.closedDate.upsert({
      where: { date: cd.date },
      update: {},
      create: cd
    });
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

