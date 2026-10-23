import '../src/env';
import { PrismaClient, ServiceOccasion } from '@prisma/client';

const prisma = new PrismaClient();

type ServiceSeed = {
  name: string;
  occasion: ServiceOccasion;
  description: string;
  image: string;
  isActive: boolean;
};

const services: ServiceSeed[] = [
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
    name: 'Board Meetings',
    occasion: 'BUSINESS',
    description: 'Premium meeting catering with punctual delivery and discreet service.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&fit=crop',
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
  },
  {
    name: 'Private Dinners',
    occasion: 'PRIVATE',
    description: 'Chef-at-home style experiences for intimate gatherings.',
    image: 'https://images.unsplash.com/photo-1541544181074-e37e0a55eabd?w=800&fit=crop',
    isActive: true
  },
  {
    name: 'Cocktail Receptions',
    occasion: 'BOTH',
    description: 'Canapés, finger food, and drinks packages for any occasion.',
    image: 'https://images.unsplash.com/photo-1525268323446-0505b6fe7778?w=800&fit=crop',
    isActive: true
  }
];

async function main() {
  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: {
        name: service.name,
        occasion: service.occasion,
      },
    });

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: service,
      });
    } else {
      await prisma.service.create({ data: service });
    }
  }

  console.log(`Seeded services: ${services.length}`);
}

main()
  .catch((e) => {
    console.error('Service seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
